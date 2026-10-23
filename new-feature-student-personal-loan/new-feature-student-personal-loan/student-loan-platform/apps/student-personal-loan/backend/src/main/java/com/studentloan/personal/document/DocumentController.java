package com.studentloan.personal.document;

import com.studentloan.personal.auth.CurrentUser;
import com.studentloan.personal.loan.dto.LoanDtos.DocumentResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/loans/{loanId}/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public List<DocumentResponse> list(@PathVariable Long loanId) {
        return documentService.list(CurrentUser.get(), loanId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponse upload(@PathVariable Long loanId, @RequestParam DocumentType type,
                                   @RequestParam MultipartFile file) {
        return documentService.upload(CurrentUser.get(), loanId, type, file);
    }

    @GetMapping("/{documentId}/file")
    public ResponseEntity<Resource> download(@PathVariable Long loanId, @PathVariable String documentId) {
        DocumentService.DocumentDownload d = documentService.download(CurrentUser.get(), loanId, documentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(d.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(d.filename()).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(d.resource());
    }

    @DeleteMapping("/{documentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long loanId, @PathVariable String documentId) {
        documentService.delete(CurrentUser.get(), loanId, documentId);
    }
}
