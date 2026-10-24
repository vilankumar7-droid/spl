package com.studentloan.personal.loan;

import com.studentloan.personal.auth.AuthenticatedUser;
import com.studentloan.personal.common.exception.ApiException;
import org.springframework.stereotype.Component;

/**
 * Resource ownership checks. A valid JWT alone does not grant access to a loan: students only see their own,
 * staff can read all. Not-owned loans return 404 so we do not reveal that they exist.
 */
@Component
public class LoanAccess {

    private final LoanRepository loans;

    public LoanAccess(LoanRepository loans) {
        this.loans = loans;
    }

    public LoanApplication readable(Long loanId, AuthenticatedUser user) {
        LoanApplication loan = loans.findById(loanId).orElseThrow(() -> ApiException.notFound("Loan application"));
        if (user.isStaff() || isOwner(loan, user)) {
            return loan;
        }
        throw ApiException.notFound("Loan application");
    }

    public LoanApplication owned(Long loanId, AuthenticatedUser user) {
        LoanApplication loan = loans.findById(loanId).orElseThrow(() -> ApiException.notFound("Loan application"));
        if (!isOwner(loan, user)) {
            throw ApiException.notFound("Loan application");
        }
        return loan;
    }

    public LoanApplication ownedAndEditable(Long loanId, AuthenticatedUser user) {
        LoanApplication loan = owned(loanId, user);
        if (!loan.getStatus().isEditable()) {
            throw ApiException.conflict("NOT_EDITABLE",
                    "This application can no longer be changed because it is " + loan.getStatus().name()
                            .replace('_', ' ').toLowerCase());
        }
        return loan;
    }

    private static boolean isOwner(LoanApplication loan, AuthenticatedUser user) {
        return loan.getApplicant().getUserId().equals(user.id());
    }
}
