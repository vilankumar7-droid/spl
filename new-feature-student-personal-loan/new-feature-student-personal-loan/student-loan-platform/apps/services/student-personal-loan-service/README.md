# StudentPersonalLoan (Application 1)

A student personal loan portal. Applicants create an application, upload supporting PDFs, submit it and follow
every stage. A demo reviewer verifies it and records an explained decision.

## Features

- **Auth:** register, log in, JWT access tokens (HS256, short-lived), roles `STUDENT`, `REVIEWER`, `ADMIN`
- **4-step form:** profile → loan details (live EMI and affordability) → documents → review and submit
- **Workflow:** a `LoanStatus` enum with a validated transition table (`WorkflowService`); every change is
  stored in `loan_status_history` with the actor and reason
- **Documents:** PDF signature and size checks, generated storage keys, ownership-checked download; optional
  deep PDF parsing through the private FastAPI document processor (`FEATURE_PDF_AGENT=true`)
- **Reviewer:** queue, start verification, then approve / reject / request correction / escalate (reason required)
- **Outbox events:** `loan.application.updated`, `loan.application.submitted`, `loan.status.changed`
- **Event operations page:** outbox status, retries, dead-letter state and the audit trail
- **Feature toggles:** `platform.features.*`, enforced on the server and shown read-only in the UI
- **Observability:** `X-Correlation-Id` on every request and in logs, events and error responses;
  Actuator health; JSON logs through the `json-logs` profile

## Run

Prerequisites: Java 17+ and Maven 3.9+ for this service; Gradle 8.x wrapper and Java 17+ for
[`event-service`](../event-service/README.md); Python 3.11+ for the
[`document-processor`](../document-processor/README.md); Node 20+ for the UI; Docker for the full stack.

```bash
# Run this command from apps/services/student-personal-loan-service:
mvn spring-boot:run
# Or run without Docker using in-memory H2:
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

From separate terminals, run `.\gradlew.bat bootRun` in `apps/services/event-service` on Windows (or `./gradlew bootRun`
on Unix, after core migrations and Kafka are available), and run `python -m pip install -r requirements.txt`
followed by `uvicorn app:app --port 8000` in
`apps/services/document-processor`. Start the Loan Process UI from `apps/ui/loan-process-ui` with
`npm install && npx ng serve`.

The event service owns the transaction tracker API but reads the core service's shared outbox and audit tables.
It also consumes Kafka messages into its event tracking table. The document processor is called by the core API
over private HTTP; its feature toggle is `FEATURE_PDF_AGENT` (disabled for a standalone Maven run by default).

## Test

```bash
cd apps/services/student-personal-loan-service && mvn test                # JUnit + MockMvc (H2)
cd apps/ui/loan-process-ui && npx ng test --watch=false --browsers=ChromeHeadless # Karma/Jasmine
```

Service tests cover: 401 without a token, input validation, duplicate email, wrong password, the full workflow
(draft → documents → submit → review → approve), invalid transitions, reviewer-only endpoints, cross-student
access returning 404, non-PDF rejection, and outbox publishing.

## API

| Method | Endpoint | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | public | Create a student account |
| POST | `/api/v1/auth/login` | public | Get an access token |
| GET | `/api/v1/auth/me` | any | Current user |
| GET/PUT | `/api/v1/applicants/me` | any | Applicant profile |
| GET/POST | `/api/v1/loans` | owner | List / create draft |
| GET/PATCH | `/api/v1/loans/{id}` | owner (staff read) | Details / update draft |
| POST | `/api/v1/loans/{id}/submit` | owner | Validate and submit |
| POST | `/api/v1/loans/{id}/cancel` | owner | Cancel |
| GET | `/api/v1/loans/{id}/timeline` | owner, staff | Status history |
| GET/POST | `/api/v1/loans/{id}/documents` | owner (staff read) | List / upload PDF (`type`, `file`) |
| GET/DELETE | `/api/v1/loans/{id}/documents/{docId}[/file]` | owner (staff read) | Download / remove |
| GET | `/api/v1/review/loans[?all=true]` | reviewer, admin | Review queue |
| POST | `/api/v1/review/loans/{id}/start` | reviewer, admin | Start verification |
| POST | `/api/v1/review/loans/{id}/decision` | reviewer, admin | `{decision, reason}` |
| GET | `/api/v1/dashboard` | any | Stats and recent activity |
| GET | `/api/v1/features`, `/api/v1/calculator/emi` | public | Toggles, EMI estimate |

The Event Service is the sole owner of `/api/v1/operations`, exposed through the UI origin and requiring a
reviewer/admin bearer token. Deep PDF checks are called by the core API internally; the document processor
is not directly exposed to browsers.

Example:

```bash
TOKEN=$(curl -s -X POST localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"student@demo.local","password":"Password@123"}' | jq -r .accessToken)
curl -s localhost:8080/api/v1/loans -H "Authorization: Bearer $TOKEN"
```

Errors use RFC 7807 problem JSON with a stable `code`, `fieldErrors` for validation, and the `correlationId`.

## Workflow

```
DRAFT → DETAILS_PENDING ⇄ DOCUMENTS_PENDING ⇄ READY_FOR_REVIEW → SUBMITTED → VERIFICATION_IN_PROGRESS
                                                                    ├→ APPROVED | REJECTED
                                                                    ├→ MANUAL_REVIEW → APPROVED | REJECTED | NEEDS_CORRECTION
                                                                    └→ NEEDS_CORRECTION → (edit) → READY_FOR_REVIEW → SUBMITTED
Any editable status → CANCELLED
```

Preparation stages are worked out from completeness (`LoanProgressService`). Applications are never approved
automatically.
