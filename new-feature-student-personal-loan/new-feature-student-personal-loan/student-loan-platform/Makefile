.PHONY: help db student-personal-loan-service student-personal-loan-service-dev event-service document-processor loan-process-ui test-student-personal-loan-service test-loan-process-ui test-document-processor test-event-service build up down

help:            ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

db:              ## Start only PostgreSQL in Docker
	docker compose --env-file .env -f infrastructure/docker-compose.yml up -d postgres

student-personal-loan-service: ## Run the core loan service against PostgreSQL (needs .env values exported)
	cd apps/services/student-personal-loan-service && mvn spring-boot:run

student-personal-loan-service-dev: ## Run the core service with in-memory H2 (no Docker needed)
	cd apps/services/student-personal-loan-service && mvn spring-boot:run -Dspring-boot.run.profiles=dev

event-service:   ## Run the Gradle event service (requires core PostgreSQL and Kafka)
	cd apps/services/event-service && sh ./gradlew bootRun

document-processor: ## Run the FastAPI document processor
	cd apps/services/document-processor && python -m uvicorn app:app --reload --port 8000

loan-process-ui: ## Run the Angular loan process UI on http://localhost:4200 (proxies /api to :8080)
	cd apps/ui/loan-process-ui && npm install && npx ng serve

test-student-personal-loan-service: ## Run core service JUnit + MockMvc tests
	cd apps/services/student-personal-loan-service && mvn test

test-loan-process-ui: ## Run loan process UI unit tests in headless Chrome
	cd apps/ui/loan-process-ui && npx ng test --watch=false --browsers=ChromeHeadless

test-document-processor: ## Run FastAPI document verification tests
	cd apps/services/document-processor && python -m pip install -r requirements-dev.txt && python -m pytest

test-event-service: ## Run Gradle event service tests
	cd apps/services/event-service && sh ./gradlew test

build:           ## Build all three services and the UI
	cd apps/services/student-personal-loan-service && mvn -B package
	cd apps/services/event-service && sh ./gradlew build
	docker build -t student-loan-document-processor:local apps/services/document-processor
	cd apps/ui/loan-process-ui && npx ng build

up:              ## Run the whole stack in Docker
	docker compose --env-file .env -f infrastructure/docker-compose.yml up --build

down:            ## Stop the Docker stack
	docker compose --env-file .env -f infrastructure/docker-compose.yml down
