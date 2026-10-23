package com.studentloan.personal.document;

/** Processing states. QUEUED/PROCESSING are used once the Python document agent is enabled (Stage C). */
public enum DocumentStatus {
    UPLOADED,
    QUEUED,
    PROCESSING,
    VALIDATED,
    FAILED,
    NEEDS_MANUAL_REVIEW
}
