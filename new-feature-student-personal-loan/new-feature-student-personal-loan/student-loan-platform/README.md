# Student Loan Platform

An educational full-stack loan processing platform with three separately built backend services: a Maven
loan API, a Gradle Kafka event service, and a Python/FastAPI document processor.

> All applicants, documents and decisions are **synthetic**. Nothing here is a real credit decision,
> identity check or employment verification.

## Status

| Stage | Scope | Status |
| --- | --- | --- |
| A | JWT authentication + **StudentPersonalLoan** | Done: [`apps/services/student-personal-loan-service`](apps/services/student-personal-loan-service) |
| B | StudentHomeLoan + shared UI | Planned (feature toggle `home-loan`) |
| C | Document verification | FastAPI processor available (`pdf-processing-agent`) |
| D | Kafka events + transaction tracker | Gradle event service consumes loan events (`apps/services/event-service`) |
| E | StudentBackgroundVerification | Planned (`background-verification`) |
| F | Elastic Stack, Splunk, end-to-end integration | JSON logs ready; shipping planned |

## Architecture (layers)

```
Angular UI ──HTTPS/JSON + JWT──▶ StudentPersonalLoanService (Maven / Spring Boot)
     │                          auth · loans · review · dashboard · documents · outbox
     ├── /api/v1/operations───▶ Event Service (Gradle / Spring Boot)
     │                          shared outbox/audit API · Kafka consumer · transaction tracker
     └── upload through core ─▶ Document Processor (Python / FastAPI)
                                PDF parsing · encryption/text checks · no file retention

Core outbox publisher ──Kafka──▶ Event Service consumer
Core document API ──private HTTP──▶ Document Processor
```

The event service reads operational status from the shared core PostgreSQL database and stores consumed
Kafka events in its own table in that database. The browser never talks directly to Kafka, the document
processor, or a database. See [docs/architecture](docs/architecture/README.md).

## Quick start

Requirements: Java 17+ and Maven 3.9+ for the core API; Gradle 8.x wrapper for the event service;
Python 3.11+ for document processing; Node 20+ for the UI; Docker for the full stack.

```bash
cp .env.example .env              # then edit the secrets
make up                           # full Docker stack; UI on :4200, core API on :8080
```

For local development without the full Compose stack, use separate terminals after starting PostgreSQL and
Kafka:

```powershell
cd apps/services/student-personal-loan-service
mvn spring-boot:run
```

```powershell
cd apps/services/event-service
.\gradlew.bat bootRun
```

```powershell
cd apps/services/document-processor
python -m pip install -r requirements.txt
uvicorn app:app --port 8000
```

The event service shares the core outbox database and consumes its events from Kafka. Compose enables Kafka
publishing and PDF verification by default. `make build` builds the Maven core, Gradle event service, Python
processor image, and Angular UI.

Demo accounts (seeded, synthetic): `student@demo.local`, `reviewer@demo.local`, `admin@demo.local`,
password from `DEMO_USER_PASSWORD` (default `Password@123`).

## Repository layout

```
apps/ui/                      loan-process-ui/ (Angular)
apps/services/                student-personal-loan-service/ (Spring Boot, Maven)
                              event-service/ (Spring Boot, Gradle)
                              document-processor/ (Python / FastAPI)
shared/event-contracts/       versioned JSON schemas for events
infrastructure/               docker-compose.yml
docs/                         architecture, event catalog, API guide, security notes
```

## Git workflow

One feature branch per application (`feature/student-personal-loan`, `feature/event-service`,
`feature/document-processor`, …), merged through a pull request
after tests pass, then tagged (`student-personal-loan-v1.0.0`). Never commit `.env` or real data.
