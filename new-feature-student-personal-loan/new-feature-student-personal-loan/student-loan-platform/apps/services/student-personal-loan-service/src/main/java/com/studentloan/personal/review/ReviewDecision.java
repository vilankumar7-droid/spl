package com.studentloan.personal.review;

import com.studentloan.personal.loan.LoanStatus;

public enum ReviewDecision {
    APPROVE(LoanStatus.APPROVED),
    REJECT(LoanStatus.REJECTED),
    REQUEST_CORRECTION(LoanStatus.NEEDS_CORRECTION),
    ESCALATE_TO_MANUAL_REVIEW(LoanStatus.MANUAL_REVIEW);

    private final LoanStatus target;

    ReviewDecision(LoanStatus target) {
        this.target = target;
    }

    public LoanStatus target() {
        return target;
    }
}
