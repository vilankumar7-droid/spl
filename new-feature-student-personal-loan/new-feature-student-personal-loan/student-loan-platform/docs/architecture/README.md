# Architecture

## Layers

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Presentation | Angular 18, standalone components, signals, Reactive Forms | Screens, client checks, route guards (UX only) |
| API & security | Spring Boot 3.3, Spring Security, JWT (jjwt) | Authentication, roles, ownership checks, problem JSON errors |
| Domain & workflow | Services, `WorkflowService` state machine | Business rules, valid transitions, EMI calculation |
| Persistence | Spring Data JPA, Hibernate, Flyway, PostgreSQL 16 | Entities, migrations (`ddl-auto=validate`) |
| Messaging | Transactional outbox, `EventPublisher` interface | Reliable events; Kafka implementation in Stage D |
| Observability | Actuator, correlation IDs, Logstash JSON encoder | Health, traceable logs ready for Elastic/Splunk |

## Backend packages (`com.studentloan.personal`)

`auth` (JWT, users) · `applicant` · `loan` (entity, service, controller, EMI) · `workflow` (state machine,
history, progress) · `document` · `review` · `messaging` (outbox, publisher, operations API) · `audit` ·
`feature` (toggles) · `dashboard` · `common` (errors, correlation) · `config`.

Rule: controllers handle HTTP, services enforce rules, repositories access data, messaging publishes events.

## Frontend structure (`src/app`)

`core/` (auth service, interceptor, guards, API service, toasts, models, labels) · `shared/` (icon,
status badge, progress tracker, EMI calculator, document upload, empty state, dialogs, pipes) · `layout/`
(sidebar shell) · `features/` (auth, dashboard, loans, profile, review, operations, platform, modules).

## Key decisions

- **Outbox before Kafka:** events are saved in the same transaction as the change, so adding Kafka later
  won't change any business code. Only a new `EventPublisher` is needed.
- **404 for loans you don't own:** this avoids revealing that another student's application exists.
- **Bearer token in `sessionStorage`:** a simple, short-lived token for the student version. The brief suggests
  moving to HttpOnly cookies (with CSRF protection) or an identity provider for an advanced version.
- **H2 `dev` profile:** lets you run the API without Docker. Tests use H2 in PostgreSQL mode, and the same
  Flyway migrations run on both databases.
