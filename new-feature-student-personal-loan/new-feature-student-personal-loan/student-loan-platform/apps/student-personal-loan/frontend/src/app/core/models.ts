export type Role = 'STUDENT' | 'REVIEWER' | 'ADMIN';

export type LoanStatus =
  | 'DRAFT' | 'DETAILS_PENDING' | 'DOCUMENTS_PENDING' | 'DOCUMENTS_PROCESSING' | 'READY_FOR_REVIEW'
  | 'SUBMITTED' | 'VERIFICATION_IN_PROGRESS' | 'MANUAL_REVIEW' | 'APPROVED' | 'REJECTED'
  | 'NEEDS_CORRECTION' | 'CANCELLED';

export type LoanPurpose =
  | 'TUITION_FEES' | 'LAPTOP_AND_EQUIPMENT' | 'ACCOMMODATION' | 'COURSE_MATERIALS' | 'TRAVEL_FOR_STUDY' | 'OTHER';

export type EmploymentType =
  | 'FULL_TIME_STUDENT' | 'PART_TIME_EMPLOYED' | 'FULL_TIME_EMPLOYED' | 'SELF_EMPLOYED' | 'INTERNSHIP';

export type DocumentType = 'IDENTITY_PROOF' | 'INCOME_PROOF' | 'ADMISSION_LETTER' | 'OTHER';
export type DocumentStatus = 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'VALIDATED' | 'FAILED' | 'NEEDS_MANUAL_REVIEW';
export type ReviewDecision = 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION' | 'ESCALATE_TO_MANUAL_REVIEW';
export type LoanAction = 'EDIT' | 'UPLOAD_DOCUMENTS' | 'CANCEL' | 'SUBMIT' | 'START_REVIEW' | 'DECIDE';

export interface User { id: number; email: string; displayName: string; role: Role; }
export interface AuthResponse { accessToken: string; tokenType: string; expiresAt: string; user: User; }

export interface Applicant {
  id: number; fullName: string | null; phone: string | null; city: string | null;
  employmentType: EmploymentType | null; institutionName: string | null; monthlyIncome: number | null;
  profileComplete: boolean;
}

export interface EmiEstimate {
  monthlyInstallment: number; totalPayable: number; totalInterest: number;
  incomeRatio: number | null; affordability: 'COMFORTABLE' | 'MANAGEABLE' | 'STRETCHED' | 'UNKNOWN';
  disclaimer: string;
}

export interface LoanSummary {
  id: number; referenceNumber: string; applicantName: string | null; requestedAmount: number; tenureMonths: number;
  interestRate: number; purpose: LoanPurpose; status: LoanStatus; monthlyInstallment: number | null;
  submittedAt: string | null; createdAt: string; updatedAt: string;
}

export interface LoanDocument {
  id: string; documentType: DocumentType; originalFilename: string; sizeBytes: number;
  status: DocumentStatus; validationMessage: string | null; uploadedAt: string;
}

export interface TimelineEntry {
  fromStatus: LoanStatus | null; toStatus: LoanStatus; actor: string; reason: string | null; changedAt: string;
}

export interface Checklist {
  profileComplete: boolean; loanDetailsComplete: boolean; identityProofUploaded: boolean;
  incomeProofUploaded: boolean; documentsProcessing: boolean;
}

export interface LoanDetail {
  loan: LoanSummary; purposeNote: string | null; decisionReason: string | null; decidedAt: string | null;
  applicant: Applicant; emi: EmiEstimate | null; documents: LoanDocument[]; timeline: TimelineEntry[];
  checklist: Checklist; missingItems: string[]; allowedActions: LoanAction[];
}

export interface LoanRequest {
  requestedAmount: number; tenureMonths: number; interestRate: number; purpose: LoanPurpose; purposeNote?: string | null;
}

export interface DashboardData {
  stats: { total: number; inProgress: number; inReview: number; approved: number; needsAttention: number; totalRequested: number; };
  recentApplications: LoanSummary[];
  recentActivity: {
    referenceNumber: string; loanId: number; fromStatus: LoanStatus | null; toStatus: LoanStatus;
    actor: string; reason: string | null; changedAt: string;
  }[];
}

export interface FeatureStatus { key: string; label: string; description: string; stage: string; enabled: boolean; }

export interface EventView {
  eventId: string; eventType: string; eventVersion: number; topic: string; applicationId: string;
  correlationId: string | null; status: 'PENDING' | 'PUBLISHED' | 'FAILED'; attempts: number; lastError: string | null;
  occurredAt: string; publishedAt: string | null; payload: string;
}

export interface OperationsSummary { total: number; pending: number; published: number; failed: number; destination: string; }

export interface AuditEntry {
  id: number; actor: string; action: string; targetType: string | null; targetId: string | null;
  details: string | null; correlationId: string | null; occurredAt: string;
}

export interface ApiProblem { status: number; detail: string; code?: string; correlationId?: string; fieldErrors?: Record<string, string>; }
