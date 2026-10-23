# Event catalog

All events share the envelope in [`shared/event-contracts/event-envelope.v1.schema.json`](../../shared/event-contracts/event-envelope.v1.schema.json).
Events are written to the `outbox_event` table in the **same transaction** as the business change, then
published by `OutboxPublisher` (to the log today, to Kafka from Stage D).

| Event | Topic | Producer | When |
| --- | --- | --- | --- |
| `loan.application.updated` | `loan-application-events` | Personal Loan API | Draft created, details edited, document uploaded |
| `loan.application.submitted` | `loan-application-events` | Personal Loan API | Applicant submits a complete application |
| `loan.status.changed` | `loan-status-events` | Personal Loan API | Every validated workflow transition |

Planned (later stages): `home-loan.application.submitted`, `document.uploaded`, `document.validation.completed`,
`document.validation.failed`, `verification.requested`, `verification.completed`, `verification.review.required`.

Example:

```json
{
  "eventId": "evt-3f0c0d8e-6c1a-4bb2-9d55-4a9f1f7e2c10",
  "eventType": "loan.application.submitted",
  "eventVersion": 1,
  "correlationId": "corr-6a3c5b0e-2a1f-4d0e-9a54-0f2b8f3e9d11",
  "applicationId": "PLN-2026-0001",
  "occurredAt": "2026-10-20T10:00:00Z",
  "data": { "loanType": "PERSONAL", "requestedAmount": 150000, "tenureMonths": 24, "purpose": "TUITION_FEES" }
}
```

Kafka offsets show consumption progress only; business completion is tracked by `loan_application.status`.
