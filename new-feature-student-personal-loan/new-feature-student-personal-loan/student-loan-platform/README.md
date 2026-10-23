# Student Loan Platform

An educational, full-stack loan processing platform built incrementally: four Angular + Java applications,
a Python document agent, Kafka event tracking and centralised logging.

> All applicants, documents and decisions are **synthetic**. Nothing here is a real credit decision,
> identity check or employment verification.

## Status

| Stage | Scope | Status |
| --- | --- | --- |
| A | JWT authentication + **StudentPersonalLoan** | Done: [`apps/student-personal-loan`](apps/student-personal-loan) |
| B | StudentHomeLoan + shared UI | Planned (feature toggle `home-loan`) |
| C | StudentDocumentCenter + Python PDF agent | Planned (`pdf-processing-agent`) |
| D | Kafka events + operations dashboard | Outbox and dashboard done; Kafka publisher planned (`kafka-event-tracking`) |
| E | StudentBackgroundVerification | Planned (`background-verification`) |
| F | Elastic Stack, Splunk, end-to-end integration | JSON logs ready; shipping planned |

## Architecture (layers)

```
Angular UI  ──HTTPS/JSON + JWT──▶  Spring Boot API ──JPA/Hibernate──▶ PostgreSQL (Flyway)
(Reactive Forms, guards,           controllers → services → repositories
 interceptor, design system)       workflow state machine · audit · feature toggles
                                   transactional outbox ──▶ publisher (log today → Kafka in Stage D)
                                   correlation IDs · JSON logs ──▶ Elastic / Splunk (Stage F)
```

The browser never talks to Kafka or the database directly. See [docs/architecture](docs/architecture/README.md).

## Quick start

Requirements: Java 17+, Maven 3.9+, Node 20+, Docker.

```bash
cp .env.example .env              # then edit the secrets
make db                           # PostgreSQL in Docker
export $(grep -v '^#' .env | xargs) DB_PASSWORD=$POSTGRES_PASSWORD
make backend                      # API on http://localhost:8080 (Swagger: /swagger-ui.html)
make frontend                     # UI  on http://localhost:4200
```

No Docker? `make backend-dev` runs the API with in-memory H2.
Everything in Docker: `make up` (UI on :4200, API on :8080).

Demo accounts (seeded, synthetic): `student@demo.local`, `reviewer@demo.local`, `admin@demo.local`,
password from `DEMO_USER_PASSWORD` (default `Password@123`).

## Repository layout

```
apps/student-personal-loan/   frontend/ (Angular) · backend/ (Spring Boot)
shared/event-contracts/       versioned JSON schemas for events
infrastructure/               docker-compose.yml
docs/                         architecture, event catalog, API guide, security notes
```

## Git workflow

One feature branch per application (`feature/student-personal-loan`, …), merged through a pull request
after tests pass, then tagged (`student-personal-loan-v1.0.0`). Never commit `.env` or real data.
