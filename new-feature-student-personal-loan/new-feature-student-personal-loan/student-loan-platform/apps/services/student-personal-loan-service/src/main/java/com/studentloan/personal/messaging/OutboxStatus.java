package com.studentloan.personal.messaging;

public enum OutboxStatus {
    PENDING,
    PUBLISHED,
    /** Publishing failed repeatedly; acts as the dead-letter state until an operator retries it. */
    FAILED
}
