package com.studentloan.personal.workflow;

import com.studentloan.personal.common.exception.ApiException;
import com.studentloan.personal.loan.LoanApplication;
import com.studentloan.personal.loan.LoanStatus;
import com.studentloan.personal.messaging.LoanEventTypes;
import com.studentloan.personal.messaging.OutboxService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import static com.studentloan.personal.loan.LoanStatus.*;

/** The single place where loan status changes happen. Validates transitions and records history + events. */
@Service
public class WorkflowService {

    private static final Map<LoanStatus, Set<LoanStatus>> ALLOWED = new EnumMap<>(LoanStatus.class);

    static {
        ALLOWED.put(DRAFT, EnumSet.of(DETAILS_PENDING, DOCUMENTS_PENDING, CANCELLED));
        ALLOWED.put(DETAILS_PENDING, EnumSet.of(DOCUMENTS_PENDING, READY_FOR_REVIEW, CANCELLED));
        ALLOWED.put(DOCUMENTS_PENDING, EnumSet.of(DETAILS_PENDING, DOCUMENTS_PROCESSING, READY_FOR_REVIEW, CANCELLED));
        ALLOWED.put(DOCUMENTS_PROCESSING, EnumSet.of(DOCUMENTS_PENDING, READY_FOR_REVIEW, CANCELLED));
        ALLOWED.put(READY_FOR_REVIEW, EnumSet.of(DETAILS_PENDING, DOCUMENTS_PENDING, SUBMITTED, CANCELLED));
        ALLOWED.put(SUBMITTED, EnumSet.of(VERIFICATION_IN_PROGRESS));
        ALLOWED.put(VERIFICATION_IN_PROGRESS, EnumSet.of(MANUAL_REVIEW, APPROVED, REJECTED, NEEDS_CORRECTION));
        ALLOWED.put(MANUAL_REVIEW, EnumSet.of(APPROVED, REJECTED, NEEDS_CORRECTION));
        ALLOWED.put(NEEDS_CORRECTION, EnumSet.of(DETAILS_PENDING, DOCUMENTS_PENDING, READY_FOR_REVIEW, CANCELLED));
        ALLOWED.put(APPROVED, EnumSet.noneOf(LoanStatus.class));
        ALLOWED.put(REJECTED, EnumSet.noneOf(LoanStatus.class));
        ALLOWED.put(CANCELLED, EnumSet.noneOf(LoanStatus.class));
    }

    private final LoanStatusHistoryRepository history;
    private final OutboxService outbox;

    public WorkflowService(LoanStatusHistoryRepository history, OutboxService outbox) {
        this.history = history;
        this.outbox = outbox;
    }

    public static boolean canTransition(LoanStatus from, LoanStatus to) {
        return ALLOWED.getOrDefault(from, Set.of()).contains(to);
    }

    public static Set<LoanStatus> allowedFrom(LoanStatus from) {
        return ALLOWED.getOrDefault(from, Set.of());
    }

    @Transactional
    public void recordCreated(LoanApplication loan, String actor) {
        history.save(new LoanStatusHistory(loan.getId(), null, loan.getStatus(), actor, "Application draft created"));
    }

    @Transactional
    public void transition(LoanApplication loan, LoanStatus target, String actor, String reason) {
        LoanStatus from = loan.getStatus();
        if (!canTransition(from, target)) {
            throw ApiException.conflict("INVALID_TRANSITION",
                    "An application cannot move from %s to %s".formatted(label(from), label(target)));
        }
        loan.changeStatus(target);
        history.save(new LoanStatusHistory(loan.getId(), from, target, actor, reason));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("fromStatus", from.name());
        data.put("toStatus", target.name());
        data.put("reason", reason);
        outbox.record(LoanEventTypes.STATUS_CHANGED, LoanEventTypes.TOPIC_LOAN_STATUS, loan.getReferenceNumber(), data);
    }

    private static String label(LoanStatus status) {
        return status.name().replace('_', ' ').toLowerCase();
    }
}
