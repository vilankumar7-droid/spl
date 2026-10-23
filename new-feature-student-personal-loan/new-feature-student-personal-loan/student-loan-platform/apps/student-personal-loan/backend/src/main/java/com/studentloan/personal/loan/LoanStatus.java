package com.studentloan.personal.loan;

import java.util.EnumSet;
import java.util.Set;

public enum LoanStatus {
    DRAFT,
    DETAILS_PENDING,
    DOCUMENTS_PENDING,
    DOCUMENTS_PROCESSING,
    READY_FOR_REVIEW,
    SUBMITTED,
    VERIFICATION_IN_PROGRESS,
    MANUAL_REVIEW,
    APPROVED,
    REJECTED,
    NEEDS_CORRECTION,
    CANCELLED;

    /** Statuses in which the applicant may still edit details and documents. */
    public static final Set<LoanStatus> EDITABLE = EnumSet.of(
            DRAFT, DETAILS_PENDING, DOCUMENTS_PENDING, DOCUMENTS_PROCESSING, READY_FOR_REVIEW, NEEDS_CORRECTION);

    /** Statuses that are waiting on a reviewer. */
    public static final Set<LoanStatus> IN_REVIEW = EnumSet.of(SUBMITTED, VERIFICATION_IN_PROGRESS, MANUAL_REVIEW);

    public static final Set<LoanStatus> FINAL = EnumSet.of(APPROVED, REJECTED, CANCELLED);

    public boolean isEditable() {
        return EDITABLE.contains(this);
    }
}
