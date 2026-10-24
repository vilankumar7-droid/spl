# Architecture

## Services

| Service | Responsibility | Build tool | Data / communication |
| --- | --- | --- | --- |
| `StudentPersonalLoanService` | Authentication, loan workflow, review, dashboard, document endpoints, and transactional outbox | Maven (`apps/services/student-personal-loan-service/pom.xml`) | Owns the shared PostgreSQL schema and publishes versioned events to Kafka; calls the processor over private HTTP |
| Event Service | Consumes loan events and solely exposes staff-only outbox, retry, audit, and consumed-event APIs | Gradle 8.x (`apps/services/event-service/build.gradle`) | Shares core PostgreSQL for authoritative outbox/audit; stores Kafka-consumed event records in an isolated table |
| Document Processor | Strict PDF parsing, encryption and text extraction checks; routes uncertain files to manual review | Python 3.11 / FastAPI (`apps/services/document-processor`) | In-memory file processing; private multipart HTTP endpoint; uploaded file bytes are not retained |

The browser calls the core API for loan workflows. `/api/v1/operations` is reverse-proxied to the Event Service.
The document processor and Kafka broker are never exposed to browser clients. The core service remains Maven
with its existing `pom.xml`.

## Core API layers

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Presentation | Angular 18, standalone components, signals, Reactive Forms | Screens, client checks, route guards (UX only) |
| API & security | Spring Boot 3.3, Spring Security, JWT (jjwt) | Authentication, roles, ownership checks, problem JSON errors |
| Domain & workflow | Services, `WorkflowService` state machine | Business rules, valid transitions, EMI calculation |
| Persistence | Spring Data JPA, Hibernate, Flyway, PostgreSQL 16 | Entities, migrations (`ddl-auto=validate`) |
| Messaging | Transactional outbox, `EventPublisher` interface, Kafka publisher | Reliable event delivery from the core API to the tracker consumer |
| Observability | Actuator, correlation IDs, Logstash JSON encoder | Health, traceable logs ready for Elastic/Splunk |

## Core backend packages (`com.studentloan.personal`)

`auth` (JWT, users) · `applicant` · `loan` (entity, service, controller, EMI) · `workflow` (state machine,
history, progress) · `document` · `review` · `messaging` (outbox, publisher, operations API) · `audit` ·
`feature` (toggles) · `dashboard` · `common` (errors, correlation) · `config`.

Rule: controllers handle HTTP, services enforce rules, repositories access data, messaging publishes events.

## Frontend structure (`src/app`)

`core/` (auth service, interceptor, guards, API service, toasts, models, labels) · `shared/` (icon,
status badge, progress tracker, EMI calculator, document upload, empty state, dialogs, pipes) · `layout/`
(sidebar shell) · `features/` (auth, dashboard, loans, profile, review, operations, platform, modules).

## Key decisions

- **Transactional outbox:** events are saved with the loan change, then the core publisher sends them to Kafka.
  The Gradle Event Service reads delivery state from the shared outbox and stores consumed envelopes by event ID.
- **Separate document processor:** the core API retains ownership and storage of documents; the FastAPI
  service receives bytes for technical checks only and does not retain them or assert authenticity.
- **Independent build tools:** keep the core `pom.xml`; use Gradle only for `apps/services/event-service` and Python
  dependency manifests only for the document processor.
- **404 for loans you don't own:** this avoids revealing that another student's application exists.
- **Short-lived session token:** stored in `sessionStorage` for the student version. The brief suggests
  moving to HttpOnly cookies (with CSRF protection) or an identity provider for an advanced version.
- **H2 `dev` profile:** lets you run the API without Docker. Tests use H2 in PostgreSQL mode, and the same
  Flyway migrations run on both databases.

## Local ports

| Service | Host port |
| --- | ---: |
| Angular UI | 4200 |
| StudentPersonalLoanService | 8080 |
| Event Service | 8081 |
| Kafka external listener | 9094 |
| Core PostgreSQL | 5432 |
| PostgreSQL (shared core/outbox) | 5432 |

The FastAPI processor listens on port 8000 only inside the Compose network.
