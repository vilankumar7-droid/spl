package com.studentloan.eventservice.outbox;

public enum OutboxStatus {
    PENDING,
    PUBLISHED,
    FAILED
}
