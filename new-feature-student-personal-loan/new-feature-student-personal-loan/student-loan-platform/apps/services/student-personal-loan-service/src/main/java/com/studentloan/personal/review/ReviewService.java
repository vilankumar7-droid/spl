package com.studentloan.personal.review;

import com.studentloan.personal.audit.AuditService;
import com.studentloan.personal.auth.AuthenticatedUser;
import com.studentloan.personal.common.exception.ApiException;
import com.studentloan.personal.loan.*;
import com.studentloan.personal.loan.dto.LoanDtos.LoanDetail;
import com.studentloan.personal.loan.dto.LoanDtos.LoanSummary;
import com.studentloan.personal.review.dto.ReviewDtos.DecisionRequest;
import com.studentloan.personal.workflow.WorkflowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Simulated reviewer workflow. Decisions are made by an authorised demo reviewer, never automatically,
 * and are not real credit decisions.
 */
@Service
public class ReviewService {

    private final LoanRepository loans;
    private final LoanService loanService;
    private final WorkflowService workflow;
    private final AuditService audit;

    public ReviewService(LoanRepository loans, LoanService loanService, WorkflowService workflow,
                         AuditService audit) {
        this.loans = loans;
        this.loanService = loanService;
        this.workflow = workflow;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<LoanSummary> queue(boolean includeAll) {
        List<LoanApplication> result = includeAll
                ? loans.findAllWithApplicant().stream().filter(l -> l.getStatus() != LoanStatus.DRAFT).toList()
                : loans.findByStatusIn(LoanStatus.IN_REVIEW);
        return result.stream().map(LoanMapper::summary).toList();
    }

    @Transactional
    public LoanDetail startReview(AuthenticatedUser reviewer, Long loanId) {
        LoanApplication loan = load(loanId);
        workflow.transition(loan, LoanStatus.VERIFICATION_IN_PROGRESS, reviewer.email(),
                "Reviewer started verification");
        audit.record(reviewer.email(), "REVIEW_STARTED", "LoanApplication", loan.getReferenceNumber(), null);
        return loanService.detail(loan, reviewer);
    }

    @Transactional
    public LoanDetail decide(AuthenticatedUser reviewer, Long loanId, DecisionRequest request) {
        LoanApplication loan = load(loanId);
        String reason = request.reason().trim();
        workflow.transition(loan, request.decision().target(), reviewer.email(), reason);
        loan.recordDecisionReason(reason);
        audit.record(reviewer.email(), "REVIEW_DECISION", "LoanApplication", loan.getReferenceNumber(),
                request.decision().name());
        return loanService.detail(loan, reviewer);
    }

    private LoanApplication load(Long loanId) {
        return loans.findById(loanId).orElseThrow(() -> ApiException.notFound("Loan application"));
    }
}
