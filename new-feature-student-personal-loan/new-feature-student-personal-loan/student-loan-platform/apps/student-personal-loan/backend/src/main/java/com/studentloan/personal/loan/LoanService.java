package com.studentloan.personal.loan;

import com.studentloan.personal.applicant.Applicant;
import com.studentloan.personal.applicant.ApplicantService;
import com.studentloan.personal.audit.AuditService;
import com.studentloan.personal.auth.AuthenticatedUser;
import com.studentloan.personal.common.exception.ApiException;
import com.studentloan.personal.document.DocumentRepository;
import com.studentloan.personal.feature.Feature;
import com.studentloan.personal.feature.FeatureService;
import com.studentloan.personal.loan.dto.LoanDtos.*;
import com.studentloan.personal.messaging.LoanEventTypes;
import com.studentloan.personal.messaging.OutboxService;
import com.studentloan.personal.workflow.LoanProgressService;
import com.studentloan.personal.workflow.LoanProgressService.Checklist;
import com.studentloan.personal.workflow.LoanStatusHistoryRepository;
import com.studentloan.personal.workflow.WorkflowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class LoanService {

    private final LoanRepository loans;
    private final LoanAccess access;
    private final ApplicantService applicants;
    private final DocumentRepository documents;
    private final LoanStatusHistoryRepository history;
    private final WorkflowService workflow;
    private final LoanProgressService progress;
    private final OutboxService outbox;
    private final FeatureService features;
    private final AuditService audit;

    public LoanService(LoanRepository loans, LoanAccess access, ApplicantService applicants,
                       DocumentRepository documents, LoanStatusHistoryRepository history, WorkflowService workflow,
                       LoanProgressService progress, OutboxService outbox, FeatureService features,
                       AuditService audit) {
        this.loans = loans;
        this.access = access;
        this.applicants = applicants;
        this.documents = documents;
        this.history = history;
        this.workflow = workflow;
        this.progress = progress;
        this.outbox = outbox;
        this.features = features;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<LoanSummary> listMine(AuthenticatedUser user) {
        return loans.findAllForUser(user.id()).stream().map(LoanMapper::summary).toList();
    }

    @Transactional
    public LoanDetail create(AuthenticatedUser user, CreateLoanRequest r) {
        features.require(Feature.PERSONAL_LOAN);
        Applicant applicant = applicants.getOrCreate(user);
        LoanApplication loan = loans.saveAndFlush(new LoanApplication(applicant, r.requestedAmount(),
                r.tenureMonths(), r.interestRate(), r.purpose(), blankToNull(r.purposeNote())));
        loan.assignReference();
        workflow.recordCreated(loan, user.email());
        outbox.record(LoanEventTypes.UPDATED, LoanEventTypes.TOPIC_LOAN_APPLICATION, loan.getReferenceNumber(),
                Map.of("change", "CREATED"));
        progress.recompute(loan, user.email());
        audit.record(user.email(), "LOAN_CREATED", "LoanApplication", loan.getReferenceNumber(), null);
        return detail(loan, user);
    }

    @Transactional(readOnly = true)
    public LoanDetail get(AuthenticatedUser user, Long id) {
        return detail(access.readable(id, user), user);
    }

    @Transactional
    public LoanDetail update(AuthenticatedUser user, Long id, UpdateLoanRequest r) {
        LoanApplication loan = access.ownedAndEditable(id, user);
        loan.updateDetails(r.requestedAmount(), r.tenureMonths(), r.interestRate(), r.purpose(), r.purposeNote());
        outbox.record(LoanEventTypes.UPDATED, LoanEventTypes.TOPIC_LOAN_APPLICATION, loan.getReferenceNumber(),
                Map.of("change", "DETAILS_UPDATED"));
        progress.recompute(loan, user.email());
        return detail(loan, user);
    }

    @Transactional
    public LoanDetail submit(AuthenticatedUser user, Long id) {
        features.require(Feature.PERSONAL_LOAN);
        LoanApplication loan = access.ownedAndEditable(id, user);
        progress.recompute(loan, user.email());
        Checklist checklist = progress.checklist(loan);
        if (!checklist.readyForReview()) {
            throw ApiException.badRequest("APPLICATION_INCOMPLETE",
                    "Please finish: " + String.join(", ", checklist.missingItems()));
        }
        workflow.transition(loan, LoanStatus.SUBMITTED, user.email(), "Submitted by applicant");

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("loanType", "PERSONAL");
        data.put("requestedAmount", loan.getRequestedAmount());
        data.put("tenureMonths", loan.getTenureMonths());
        data.put("purpose", loan.getPurpose().name());
        outbox.record(LoanEventTypes.SUBMITTED, LoanEventTypes.TOPIC_LOAN_APPLICATION, loan.getReferenceNumber(), data);
        audit.record(user.email(), "LOAN_SUBMITTED", "LoanApplication", loan.getReferenceNumber(), null);
        return detail(loan, user);
    }

    @Transactional
    public LoanDetail cancel(AuthenticatedUser user, Long id, String reason) {
        LoanApplication loan = access.ownedAndEditable(id, user);
        workflow.transition(loan, LoanStatus.CANCELLED, user.email(),
                reason == null || reason.isBlank() ? "Cancelled by applicant" : reason.trim());
        audit.record(user.email(), "LOAN_CANCELLED", "LoanApplication", loan.getReferenceNumber(), null);
        return detail(loan, user);
    }

    @Transactional(readOnly = true)
    public List<TimelineEntry> timeline(AuthenticatedUser user, Long id) {
        LoanApplication loan = access.readable(id, user);
        return history.findByLoanApplicationIdOrderByChangedAtAscIdAsc(loan.getId()).stream()
                .map(LoanMapper::timeline).toList();
    }

    public LoanDetail detail(LoanApplication loan, AuthenticatedUser user) {
        Checklist checklist = progress.checklist(loan);
        Applicant applicant = loan.getApplicant();
        EmiCalculator.EmiEstimate emi = loan.isLoanDetailsComplete()
                ? EmiCalculator.estimate(loan.getRequestedAmount(), loan.getTenureMonths(), loan.getInterestRate(),
                applicant.getMonthlyIncome())
                : null;
        return new LoanDetail(
                LoanMapper.summary(loan),
                loan.getPurposeNote(),
                loan.getDecisionReason(),
                loan.getDecidedAt(),
                ApplicantService.toResponse(applicant),
                emi,
                documents.findByLoanApplicationIdOrderByUploadedAtAsc(loan.getId()).stream()
                        .map(LoanMapper::document).toList(),
                history.findByLoanApplicationIdOrderByChangedAtAscIdAsc(loan.getId()).stream()
                        .map(LoanMapper::timeline).toList(),
                checklist,
                loan.getStatus().isEditable() ? checklist.missingItems() : List.of(),
                allowedActions(loan, user, checklist));
    }

    private static List<String> allowedActions(LoanApplication loan, AuthenticatedUser user, Checklist checklist) {
        List<String> actions = new ArrayList<>();
        boolean owner = loan.getApplicant().getUserId().equals(user.id());
        LoanStatus s = loan.getStatus();
        if (owner && s.isEditable()) {
            actions.add("EDIT");
            actions.add("UPLOAD_DOCUMENTS");
            actions.add("CANCEL");
            if (checklist.readyForReview()) {
                actions.add("SUBMIT");
            }
        }
        if (user.isStaff()) {
            if (s == LoanStatus.SUBMITTED) {
                actions.add("START_REVIEW");
            }
            if (s == LoanStatus.VERIFICATION_IN_PROGRESS || s == LoanStatus.MANUAL_REVIEW) {
                actions.add("DECIDE");
            }
        }
        return actions;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
