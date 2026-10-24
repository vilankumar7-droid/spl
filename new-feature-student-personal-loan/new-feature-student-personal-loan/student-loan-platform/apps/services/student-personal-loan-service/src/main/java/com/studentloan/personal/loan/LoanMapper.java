package com.studentloan.personal.loan;

import com.studentloan.personal.document.DocumentReference;
import com.studentloan.personal.loan.dto.LoanDtos.DocumentResponse;
import com.studentloan.personal.loan.dto.LoanDtos.LoanSummary;
import com.studentloan.personal.loan.dto.LoanDtos.TimelineEntry;
import com.studentloan.personal.workflow.LoanStatusHistory;

public final class LoanMapper {

    private LoanMapper() {
    }

    public static LoanSummary summary(LoanApplication l) {
        EmiCalculator.EmiEstimate emi = l.isLoanDetailsComplete()
                ? EmiCalculator.estimate(l.getRequestedAmount(), l.getTenureMonths(), l.getInterestRate(), null)
                : null;
        return new LoanSummary(l.getId(), l.getReferenceNumber(), l.getApplicant().getFullName(),
                l.getRequestedAmount(), l.getTenureMonths(), l.getInterestRate(), l.getPurpose(), l.getStatus(),
                emi == null ? null : emi.monthlyInstallment(), l.getSubmittedAt(), l.getCreatedAt(),
                l.getUpdatedAt());
    }

    public static DocumentResponse document(DocumentReference d) {
        return new DocumentResponse(d.getPublicId(), d.getDocumentType(), d.getOriginalFilename(), d.getSizeBytes(),
                d.getStatus(), d.getValidationMessage(), d.getUploadedAt());
    }

    public static TimelineEntry timeline(LoanStatusHistory h) {
        return new TimelineEntry(h.getFromStatus(), h.getToStatus(), h.getActor(), h.getReason(), h.getChangedAt());
    }
}
