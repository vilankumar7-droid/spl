package com.studentloan.personal.document;

import com.studentloan.personal.audit.AuditService;
import com.studentloan.personal.auth.AuthenticatedUser;
import com.studentloan.personal.common.exception.ApiException;
import com.studentloan.personal.config.PlatformProperties;
import com.studentloan.personal.loan.LoanAccess;
import com.studentloan.personal.loan.LoanApplication;
import com.studentloan.personal.loan.LoanMapper;
import com.studentloan.personal.loan.dto.LoanDtos.DocumentResponse;
import com.studentloan.personal.messaging.LoanEventTypes;
import com.studentloan.personal.messaging.OutboxService;
import com.studentloan.personal.workflow.LoanProgressService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;

/**
 * Document references for a loan. Performs basic technical checks (size, PDF signature) synchronously.
 * Deeper processing (parseability, encryption, text extraction) moves to the Python agent in Stage C.
 * Passing these checks does not prove a document is authentic.
 */
@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);
    private static final byte[] PDF_SIGNATURE = "%PDF-".getBytes();

    private final DocumentRepository documents;
    private final DocumentStorage storage;
    private final LoanAccess access;
    private final LoanProgressService progress;
    private final OutboxService outbox;
    private final AuditService audit;
    private final long maxBytes;
    private final RestClient restClient;
    private final String verificationUrl;
    private final boolean verificationEnabled;

    public DocumentService(DocumentRepository documents, DocumentStorage storage, LoanAccess access,
                           LoanProgressService progress, OutboxService outbox, AuditService audit,
                           PlatformProperties properties, RestClient.Builder restClientBuilder,
                           @Value("${platform.document.verification-url}") String verificationUrl,
                           @Value("${platform.features.pdf-processing-agent:false}") boolean verificationEnabled) {
        this.documents = documents;
        this.storage = storage;
        this.access = access;
        this.progress = progress;
        this.outbox = outbox;
        this.audit = audit;
        this.maxBytes = properties.storage().maxDocumentBytes();
        this.restClient = restClientBuilder.build();
        this.verificationUrl = verificationUrl;
        this.verificationEnabled = verificationEnabled;
    }

    public record DocumentDownload(Resource resource, String filename, String contentType) {
    }

    @Transactional
    public DocumentResponse upload(AuthenticatedUser user, Long loanId, DocumentType type, MultipartFile file) {
        LoanApplication loan = access.ownedAndEditable(loanId, user);
        validate(file);

        documents.findByLoanApplicationIdAndDocumentType(loan.getId(), type).ifPresent(existing -> {
            storage.delete(existing.getStorageKey());
            documents.delete(existing);
            documents.flush();
        });

        String publicId = "DOC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String storageKey = UUID.randomUUID() + ".pdf";
        try (InputStream in = file.getInputStream()) {
            storage.store(storageKey, in);
        } catch (IOException e) {
            throw new IllegalStateException("Could not store document", e);
        }
        DocumentReference doc = documents.save(new DocumentReference(publicId, loan.getId(), type,
                safeName(file.getOriginalFilename()), storageKey, "application/pdf", file.getSize(),
            verificationEnabled ? DocumentStatus.PROCESSING : DocumentStatus.VALIDATED,
            verificationEnabled ? "Document verification is in progress"
                : "Basic checks passed (PDF signature and size)"));

        if (verificationEnabled) {
            verifyRemotely(doc, file);
        }

        loan.touch();
        outbox.record(LoanEventTypes.UPDATED, LoanEventTypes.TOPIC_LOAN_APPLICATION, loan.getReferenceNumber(),
                Map.of("change", "DOCUMENT_UPLOADED", "documentId", publicId, "documentType", type.name()));
        progress.recompute(loan, user.email());
        audit.record(user.email(), "DOCUMENT_UPLOADED", "Document", publicId, type.name());
        return LoanMapper.document(doc);
    }

    private void verifyRemotely(DocumentReference document, MultipartFile file) {
        try {
            ByteArrayResource upload = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return document.getOriginalFilename();
                }
            };
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", upload);
            body.add("documentId", document.getPublicId());
            body.add("documentType", document.getDocumentType().name());
            VerificationResponse response = restClient.post().uri(verificationUrl)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(VerificationResponse.class);
            if (response == null || response.status() == null || response.message() == null) {
                document.updateValidation(DocumentStatus.NEEDS_MANUAL_REVIEW,
                        "The document processor returned an empty response");
                return;
            }
            DocumentStatus status = switch (response.status()) {
                case "VALIDATED" -> DocumentStatus.VALIDATED;
                case "FAILED" -> DocumentStatus.FAILED;
                case "NEEDS_MANUAL_REVIEW" -> DocumentStatus.NEEDS_MANUAL_REVIEW;
                default -> throw new IllegalArgumentException("Unsupported document verification status");
            };
            document.updateValidation(status, response.message());
        } catch (IOException | RestClientException | IllegalArgumentException ex) {
            log.warn("Document verification did not complete for {}; manual review required",
                    document.getPublicId(), ex);
            document.updateValidation(DocumentStatus.NEEDS_MANUAL_REVIEW,
                    "Document verification could not be completed; manual review is required");
        }
    }

    private record VerificationResponse(String status, String message) {
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> list(AuthenticatedUser user, Long loanId) {
        LoanApplication loan = access.readable(loanId, user);
        return documents.findByLoanApplicationIdOrderByUploadedAtAsc(loan.getId()).stream()
                .map(LoanMapper::document).toList();
    }

    @Transactional
    public DocumentDownload download(AuthenticatedUser user, Long loanId, String documentId) {
        LoanApplication loan = access.readable(loanId, user);
        DocumentReference doc = documents.findByPublicIdAndLoanApplicationId(documentId, loan.getId())
                .orElseThrow(() -> ApiException.notFound("Document"));
        audit.record(user.email(), "DOCUMENT_DOWNLOADED", "Document", documentId, null);
        return new DocumentDownload(storage.load(doc.getStorageKey()), doc.getOriginalFilename(), doc.getContentType());
    }

    @Transactional
    public void delete(AuthenticatedUser user, Long loanId, String documentId) {
        LoanApplication loan = access.ownedAndEditable(loanId, user);
        DocumentReference doc = documents.findByPublicIdAndLoanApplicationId(documentId, loan.getId())
                .orElseThrow(() -> ApiException.notFound("Document"));
        storage.delete(doc.getStorageKey());
        documents.delete(doc);
        documents.flush();
        loan.touch();
        progress.recompute(loan, user.email());
        audit.record(user.email(), "DOCUMENT_DELETED", "Document", documentId, null);
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("EMPTY_FILE", "Please choose a file to upload");
        }
        if (file.getSize() > maxBytes) {
            throw ApiException.badRequest("FILE_TOO_LARGE", "The file is larger than the 5 MB limit");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (!name.endsWith(".pdf")) {
            throw ApiException.badRequest("INVALID_FILE_TYPE", "Only PDF files are accepted");
        }
        try (InputStream in = file.getInputStream()) {
            byte[] header = in.readNBytes(PDF_SIGNATURE.length);
            if (!Arrays.equals(header, PDF_SIGNATURE)) {
                throw ApiException.badRequest("INVALID_PDF",
                        "This file does not look like a valid PDF (signature check failed)");
            }
        } catch (IOException e) {
            throw ApiException.badRequest("UNREADABLE_FILE", "The file could not be read");
        }
    }

    private static String safeName(String name) {
        if (name == null || name.isBlank()) {
            return "document.pdf";
        }
        String base = name.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1).replaceAll("[^A-Za-z0-9._ -]", "_");
        return base.length() > 200 ? base.substring(base.length() - 200) : base;
    }
}
