package com.studentloan.personal.document;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "document_reference")
public class DocumentReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true)
    private String publicId;

    @Column(name = "loan_application_id", nullable = false)
    private Long loanApplicationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentType documentType;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    /** Generated storage name; the user-supplied filename is never used as a path. */
    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentStatus status;

    @Column(name = "validation_message")
    private String validationMessage;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    protected DocumentReference() {
    }

    public DocumentReference(String publicId, Long loanApplicationId, DocumentType documentType,
                             String originalFilename, String storageKey, String contentType, long sizeBytes,
                             DocumentStatus status, String validationMessage) {
        this.publicId = publicId;
        this.loanApplicationId = loanApplicationId;
        this.documentType = documentType;
        this.originalFilename = originalFilename;
        this.storageKey = storageKey;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.status = status;
        this.validationMessage = validationMessage;
        this.uploadedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public Long getLoanApplicationId() { return loanApplicationId; }
    public DocumentType getDocumentType() { return documentType; }
    public String getOriginalFilename() { return originalFilename; }
    public String getStorageKey() { return storageKey; }
    public String getContentType() { return contentType; }
    public long getSizeBytes() { return sizeBytes; }
    public DocumentStatus getStatus() { return status; }
    public String getValidationMessage() { return validationMessage; }
    public Instant getUploadedAt() { return uploadedAt; }
}
