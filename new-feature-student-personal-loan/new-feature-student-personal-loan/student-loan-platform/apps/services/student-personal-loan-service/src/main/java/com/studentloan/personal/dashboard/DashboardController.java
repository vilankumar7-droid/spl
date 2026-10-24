package com.studentloan.personal.dashboard;

import com.studentloan.personal.auth.AuthenticatedUser;
import com.studentloan.personal.auth.CurrentUser;
import com.studentloan.personal.loan.LoanApplication;
import com.studentloan.personal.loan.LoanMapper;
import com.studentloan.personal.loan.LoanRepository;
import com.studentloan.personal.loan.LoanStatus;
import com.studentloan.personal.loan.dto.LoanDtos.LoanSummary;
import com.studentloan.personal.workflow.LoanStatusHistory;
import com.studentloan.personal.workflow.LoanStatusHistoryRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    public record Stats(long total, long inProgress, long inReview, long approved, long needsAttention,
                        BigDecimal totalRequested) {
    }

    public record Activity(String referenceNumber, Long loanId, LoanStatus fromStatus, LoanStatus toStatus,
                           String actor, String reason, Instant changedAt) {
    }

    public record Dashboard(Stats stats, List<LoanSummary> recentApplications, List<Activity> recentActivity) {
    }

    private final LoanRepository loans;
    private final LoanStatusHistoryRepository history;

    public DashboardController(LoanRepository loans, LoanStatusHistoryRepository history) {
        this.loans = loans;
        this.history = history;
    }

    /** Students see their own applications; reviewers and admins see platform-wide numbers. */
    @GetMapping
    @Transactional(readOnly = true)
    public Dashboard dashboard() {
        AuthenticatedUser user = CurrentUser.get();
        List<LoanApplication> scope = user.isStaff() ? loans.findAllWithApplicant() : loans.findAllForUser(user.id());

        Stats stats = new Stats(
                scope.size(),
                scope.stream().filter(l -> l.getStatus().isEditable() && l.getStatus() != LoanStatus.NEEDS_CORRECTION).count(),
                scope.stream().filter(l -> LoanStatus.IN_REVIEW.contains(l.getStatus())).count(),
                scope.stream().filter(l -> l.getStatus() == LoanStatus.APPROVED).count(),
                scope.stream().filter(l -> l.getStatus() == LoanStatus.NEEDS_CORRECTION
                        || (user.isStaff() && l.getStatus() == LoanStatus.SUBMITTED)).count(),
                scope.stream().filter(l -> l.getStatus() != LoanStatus.CANCELLED)
                        .map(LoanApplication::getRequestedAmount).reduce(BigDecimal.ZERO, BigDecimal::add));

        Map<Long, LoanApplication> byId = scope.stream()
                .collect(Collectors.toMap(LoanApplication::getId, Function.identity()));
        List<Activity> activity = byId.isEmpty() ? List.of()
                : history.findRecentForLoans(byId.keySet(), PageRequest.of(0, 8)).stream()
                .map(h -> toActivity(h, byId.get(h.getLoanApplicationId()))).toList();

        return new Dashboard(stats, scope.stream().limit(5).map(LoanMapper::summary).toList(), activity);
    }

    private static Activity toActivity(LoanStatusHistory h, LoanApplication loan) {
        return new Activity(loan.getReferenceNumber(), loan.getId(), h.getFromStatus(), h.getToStatus(), h.getActor(),
                h.getReason(), h.getChangedAt());
    }
}
