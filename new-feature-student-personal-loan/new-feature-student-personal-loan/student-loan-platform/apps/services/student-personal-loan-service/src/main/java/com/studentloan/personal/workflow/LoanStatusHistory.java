package com.studentloan.personal.workflow;

import com.studentloan.personal.loan.LoanStatus;
import jakarta.persistence.*;

import java.time.Instant;

/** Immutable record of a single status change. */
@Entity
@Table(name = "loan_status_history")
public class LoanStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loan_application_id", nullable = false, updatable = false)
    private Long loanApplicationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", updatable = false)
    private LoanStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, updatable = false)
    private LoanStatus toStatus;

    @Column(nullable = false, updatable = false)
    private String actor;

    @Column(updatable = false)
    private String reason;

    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;

    protected LoanStatusHistory() {
    }

    public LoanStatusHistory(Long loanApplicationId, LoanStatus fromStatus, LoanStatus toStatus, String actor,
                             String reason) {
        this.loanApplicationId = loanApplicationId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.actor = actor;
        this.reason = reason;
        this.changedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Long getLoanApplicationId() { return loanApplicationId; }
    public LoanStatus getFromStatus() { return fromStatus; }
    public LoanStatus getToStatus() { return toStatus; }
    public String getActor() { return actor; }
    public String getReason() { return reason; }
    public Instant getChangedAt() { return changedAt; }
}
