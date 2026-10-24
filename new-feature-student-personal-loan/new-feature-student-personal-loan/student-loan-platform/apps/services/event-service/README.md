# Kafka Event / Transaction Service

Spring Boot event and transaction tracker built with Gradle 8.x and Java 17.

## Data ownership

The service **consumes** `loan-application-events` and `loan-status-events` from Kafka and records each
consumed envelope once in `tracked_event`. The `/api/v1/operations` endpoints read the core service's
transactional outbox and audit tables from the **shared PostgreSQL database**. This keeps publish status,
retry, and audit history authoritative in one place. An admin retry publishes the failed outbox payload to
Kafka and marks the shared outbox record published in the same transaction. The service owns a dedicated
Flyway history table and its `tracked_event` table, but does not own or migrate core loan tables.

In Docker it uses the same PostgreSQL database as the core API. For local runs, start the core database and
apply the core Flyway migrations first, then configure `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.

## Run

Prerequisites: Java 17+ and the included Gradle wrapper (Gradle 8.x).

```powershell
$env:DB_URL = 'jdbc:postgresql://localhost:5432/personal_loan'
$env:DB_USERNAME = 'studentloan'
$env:DB_PASSWORD = '<local database password>'
$env:JWT_SECRET = '<same 32+ character secret used by the core API>'
$env:KAFKA_BOOTSTRAP_SERVERS = 'localhost:9094'
.\gradlew.bat bootRun
```

On Unix, use `./gradlew bootRun`. The Compose stack starts Kafka and connects the event service to the core
database.

## API

Every `/api/v1/**` endpoint requires a core API bearer token with `REVIEWER` or `ADMIN` role. Retrying a failed
event additionally requires `ADMIN`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/operations/summary` | Outbox totals by delivery status |
| GET | `/api/v1/operations/events?limit=200` | Recent outbox event details |
| POST | `/api/v1/operations/events/{eventId}/retry` | Retry publishing a failed outbox event to Kafka |
| GET | `/api/v1/operations/audit?limit=100` | Recent core audit entries |
| GET | `/api/v1/operations/consumed-events?limit=200` | Events observed on Kafka |
| GET | `/actuator/health` | Container health check |
