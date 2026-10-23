.PHONY: help db backend backend-dev frontend test-backend test-frontend build up down

help:            ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

db:              ## Start only PostgreSQL in Docker
	docker compose --env-file .env -f infrastructure/docker-compose.yml up -d postgres

backend:         ## Run the Personal Loan API against PostgreSQL (needs .env values exported)
	cd apps/student-personal-loan/backend && mvn spring-boot:run

backend-dev:     ## Run the API with in-memory H2 (no Docker needed)
	cd apps/student-personal-loan/backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev

frontend:        ## Run the Angular dev server on http://localhost:4200 (proxies /api to :8080)
	cd apps/student-personal-loan/frontend && npm install && npx ng serve

test-backend:    ## Run JUnit + MockMvc tests
	cd apps/student-personal-loan/backend && mvn test

test-frontend:   ## Run Angular unit tests in headless Chrome
	cd apps/student-personal-loan/frontend && npx ng test --watch=false --browsers=ChromeHeadless

build:           ## Production builds for API and UI
	cd apps/student-personal-loan/backend && mvn -B package
	cd apps/student-personal-loan/frontend && npx ng build

up:              ## Run the whole stack in Docker
	docker compose --env-file .env -f infrastructure/docker-compose.yml up --build

down:            ## Stop the Docker stack
	docker compose --env-file .env -f infrastructure/docker-compose.yml down
