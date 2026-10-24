package com.studentloan.personal.messaging;

/** Versioned event contract names. See shared/event-contracts for the JSON schemas. */
public final class LoanEventTypes {

    public static final String TOPIC_LOAN_APPLICATION = "loan-application-events";
    public static final String TOPIC_LOAN_STATUS = "loan-status-events";

    public static final String SUBMITTED = "loan.application.submitted";
    public static final String UPDATED = "loan.application.updated";
    public static final String STATUS_CHANGED = "loan.status.changed";

    private LoanEventTypes() {
    }
}
