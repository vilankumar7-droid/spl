package com.studentloan.personal.loan.dto;

import com.studentloan.personal.applicant.dto.ApplicantDtos.ApplicantResponse;
import com.studentloan.personal.document.DocumentStatus;
import com.studentloan.personal.document.DocumentType;
import com.studentloan.personal.loan.EmiCalculator.EmiEstimate;
import com.studentloan.personal.loan.LoanPurpose;
import com.studentloan.personal.loan.LoanStatus;
import com.studentloan.personal.workflow.LoanProgressService.Checklist;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class LoanDtos {

    private LoanDtos() {
    }

    public record CreateLoanRequest(
            @NotNull(message = "Loan amount is required")
            @DecimalMin(value = "10000", message = "Minimum amount is 10,000")
            @DecimalMax(value = "2000000", message = "Maximum amount is 20,00,000") BigDecimal requestedAmount,
            @NotNull(message = "Tenure is required")
            @Min(value = 6, message = "Minimum tenure is 6 months")
            @Max(value = 84, message = "Maximum tenure is 84 months") Integer tenureMonths,
            @NotNull(message = "Interest rate is required")
            @DecimalMin(value = "1.0", message = "Rate must be at least 1%")
            @DecimalMax(value = "30.0", message = "Rate cannot exceed 30%") BigDecimal interestRate,
            @NotNull(message = "Select a purpose") LoanPurpose purpose,
            @Size(max = 500) String purposeNote) {
    }

    /** All fields optional: only supplied fields are changed (PATCH semantics). */
    public record UpdateLoanRequest(
            @DecimalMin(value = "10000", message = "Minimum amount is 10,000")
            @DecimalMax(value = "2000000", message = "Maximum amount is 20,00,000") BigDecimal requestedAmount,
            @Min(value = 6, message = "Minimum tenure is 6 months")
            @Max(value = 84, message = "Maximum tenure is 84 months") Integer tenureMonths,
            @DecimalMin(value = "1.0", message = "Rate must be at least 1%")
            @DecimalMax(value = "30.0", message = "Rate cannot exceed 30%") BigDecimal interestRate,
            LoanPurpose purpose,
            @Size(max = 500) String purposeNote) {
    }

    public record ReasonRequest(@Size(max = 1000) String reason) {
    }

    public record LoanSummary(Long id, String referenceNumber, String applicantName, BigDecimal requestedAmount,
                              Integer tenureMonths, BigDecimal interestRate, LoanPurpose purpose, LoanStatus status,
                              BigDecimal monthlyInstallment, Instant submittedAt, Instant createdAt,
                              Instant updatedAt) {
    }

    public record DocumentResponse(String id, DocumentType documentType, String originalFilename, long sizeBytes,
                                   DocumentStatus status, String validationMessage, Instant uploadedAt) {
    }

    public record TimelineEntry(LoanStatus fromStatus, LoanStatus toStatus, String actor, String reason,
                                Instant changedAt) {
    }

    public record LoanDetail(LoanSummary loan, String purposeNote, String decisionReason, Instant decidedAt,
                             ApplicantResponse applicant, EmiEstimate emi, List<DocumentResponse> documents,
                             List<TimelineEntry> timeline, Checklist checklist, List<String> missingItems,
                             List<String> allowedActions) {
    }
}
