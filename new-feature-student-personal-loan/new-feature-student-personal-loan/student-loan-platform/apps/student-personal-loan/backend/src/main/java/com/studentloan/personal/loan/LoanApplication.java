package com.studentloan.personal.loan;

import com.studentloan.personal.applicant.Applicant;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.Year;

@Entity
@Table(name = "loan_application")
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_number", unique = true)
    private String referenceNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "applicant_id", nullable = false)
    private Applicant applicant;

    @Column(name = "requested_amount", nullable = false)
    private BigDecimal requestedAmount;

    @Column(name = "tenure_months", nullable = false)
    private Integer tenureMonths;

    @Column(name = "interest_rate", nullable = false)
    private BigDecimal interestRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanPurpose purpose;

    @Column(name = "purpose_note")
    private String purposeNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status;

    @Column(name = "decision_reason")
    private String decisionReason;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private Long version;

    protected LoanApplication() {
    }

    public LoanApplication(Applicant applicant, BigDecimal requestedAmount, Integer tenureMonths,
                           BigDecimal interestRate, LoanPurpose purpose, String purposeNote) {
        this.applicant = applicant;
        this.requestedAmount = requestedAmount;
        this.tenureMonths = tenureMonths;
        this.interestRate = interestRate;
        this.purpose = purpose;
        this.purposeNote = purposeNote;
        this.status = LoanStatus.DRAFT;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    /** Human friendly reference such as PLN-2026-0001, assigned once the database ID is known. */
    public void assignReference() {
        if (referenceNumber == null && id != null) {
            referenceNumber = "PLN-%d-%04d".formatted(Year.now().getValue(), id);
        }
    }

    public void updateDetails(BigDecimal requestedAmount, Integer tenureMonths, BigDecimal interestRate,
                              LoanPurpose purpose, String purposeNote) {
        if (requestedAmount != null) this.requestedAmount = requestedAmount;
        if (tenureMonths != null) this.tenureMonths = tenureMonths;
        if (interestRate != null) this.interestRate = interestRate;
        if (purpose != null) this.purpose = purpose;
        if (purposeNote != null) this.purposeNote = purposeNote.isBlank() ? null : purposeNote.trim();
        touch();
    }

    public boolean isLoanDetailsComplete() {
        return requestedAmount != null && requestedAmount.signum() > 0 && tenureMonths != null && tenureMonths > 0
                && interestRate != null && purpose != null;
    }

    /** Only the WorkflowService should call this, so that every change is validated and recorded. */
    public void changeStatus(LoanStatus newStatus) {
        this.status = newStatus;
        if (newStatus == LoanStatus.SUBMITTED) {
            this.submittedAt = Instant.now();
            this.decisionReason = null;
            this.decidedAt = null;
        }
        if (LoanStatus.FINAL.contains(newStatus) || newStatus == LoanStatus.NEEDS_CORRECTION) {
            this.decidedAt = Instant.now();
        }
        touch();
    }

    public void recordDecisionReason(String reason) {
        this.decisionReason = reason;
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getReferenceNumber() { return referenceNumber; }
    public Applicant getApplicant() { return applicant; }
    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public Integer getTenureMonths() { return tenureMonths; }
    public BigDecimal getInterestRate() { return interestRate; }
    public LoanPurpose getPurpose() { return purpose; }
    public String getPurposeNote() { return purposeNote; }
    public LoanStatus getStatus() { return status; }
    public String getDecisionReason() { return decisionReason; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Instant getDecidedAt() { return decidedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
