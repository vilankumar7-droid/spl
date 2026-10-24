/** Static description of the platform architecture shown on the Architecture page and module previews. */
export const LAYERS = [
  { name: 'Presentation', tech: 'Angular 18 · TypeScript · Reactive Forms', items: ['Personal Loan', 'Home Loan', 'Document Center', 'Background checks', 'Event operations'], status: 'live' },
  { name: 'API & security', tech: 'Spring Boot 3 · Spring Security · JWT', items: ['REST /api/v1', 'Role-based access', 'Ownership checks', 'Correlation IDs', 'Problem+JSON errors'], status: 'live' },
  { name: 'Domain & workflow', tech: 'Services · validated state machine', items: ['Loan workflow', 'Status history', 'EMI calculator', 'Reviewer decisions', 'Feature toggles'], status: 'live' },
  { name: 'Persistence', tech: 'Spring Data JPA · Hibernate · Flyway · PostgreSQL', items: ['Users & applicants', 'Loans & history', 'Document references', 'Outbox', 'Audit events'], status: 'live' },
  { name: 'Messaging', tech: 'Transactional outbox → Apache Kafka', items: ['loan-application-events', 'loan-status-events', 'document-events', 'verification-events'], status: 'partial' },
  { name: 'Processing agents', tech: 'Python FastAPI · PyMuPDF · SQLAlchemy', items: ['PDF validation', 'Text extraction', 'Retries & DLQ'], status: 'planned' },
  { name: 'Observability', tech: 'Actuator · JSON logs · Elastic Stack · Splunk', items: ['Health & metrics', 'Structured logs', 'Dashboards', 'Alerts'], status: 'partial' },
];

export const MODULES: Record<string, { title: string; feature: string; stage: string; icon: string; summary: string; bullets: string[] }> = {
  'home-loan': {
    title: 'Home Loan', feature: 'home-loan', stage: 'B', icon: 'home',
    summary: 'A mortgage-style workflow with property details, loan-to-value estimates and a property review stage.',
    bullets: ['Property type, declared value and non-sensitive location label', 'Loan-to-value and EMI estimate', 'Property document review stage', 'home-loan.application.submitted events'],
  },
  'document-center': {
    title: 'Document Center', feature: 'pdf-processing-agent', stage: 'C', icon: 'folder',
    summary: 'Asynchronous PDF processing by a Python agent: signature, size, page count, encryption and text extraction.',
    bullets: ['Java metadata API with ownership checks', 'Python FastAPI worker consuming document-events', 'UPLOADED → QUEUED → PROCESSING → VALIDATED', 'Bounded retries and dead-letter handling'],
  },
  'background-verification': {
    title: 'Background Verification', feature: 'background-verification', stage: 'E', icon: 'search',
    summary: 'Simulated identity, address and employment checks with manual review and full case timelines.',
    bullets: ['Verification cases and check results', 'Evidence references kept separate from files', 'Reviewer-only decision endpoints', 'verification.completed events back into the loan workflow'],
  },
};
