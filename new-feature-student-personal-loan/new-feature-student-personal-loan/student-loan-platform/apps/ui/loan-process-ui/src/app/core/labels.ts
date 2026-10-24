import { DocumentType, EmploymentType, LoanPurpose, LoanStatus } from './models';

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent';

export const STATUS_META: Record<LoanStatus, { label: string; tone: Tone; help: string }> = {
  DRAFT: { label: 'Draft', tone: 'neutral', help: 'Your application has been started. Continue filling in the details.' },
  DETAILS_PENDING: { label: 'Details pending', tone: 'warning', help: 'Some applicant or loan details are still missing.' },
  DOCUMENTS_PENDING: { label: 'Documents pending', tone: 'warning', help: 'Upload your identity proof and income proof (PDF) to continue.' },
  DOCUMENTS_PROCESSING: { label: 'Processing documents', tone: 'info', help: 'Your documents are being checked. This usually takes a moment.' },
  READY_FOR_REVIEW: { label: 'Ready to submit', tone: 'accent', help: 'Everything is in place. Review your application and submit it.' },
  SUBMITTED: { label: 'Submitted', tone: 'info', help: 'Submitted successfully. A reviewer will pick it up shortly.' },
  VERIFICATION_IN_PROGRESS: { label: 'In verification', tone: 'info', help: 'A reviewer is checking your details and documents.' },
  MANUAL_REVIEW: { label: 'Manual review', tone: 'info', help: 'Your application needs a closer look by a senior reviewer.' },
  APPROVED: { label: 'Approved', tone: 'success', help: 'Approved by the demo reviewer. (Simulated decision — not a real loan offer.)' },
  REJECTED: { label: 'Rejected', tone: 'danger', help: 'Not approved by the demo reviewer. See the reviewer note for details.' },
  NEEDS_CORRECTION: { label: 'Needs correction', tone: 'danger', help: 'The reviewer asked for changes. Update the application and submit again.' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', help: 'This application was cancelled and can no longer be changed.' },
};

export const PURPOSE_META: Record<LoanPurpose, { label: string; icon: string }> = {
  TUITION_FEES: { label: 'Tuition fees', icon: 'school' },
  LAPTOP_AND_EQUIPMENT: { label: 'Laptop & equipment', icon: 'laptop' },
  ACCOMMODATION: { label: 'Accommodation', icon: 'home' },
  COURSE_MATERIALS: { label: 'Course materials', icon: 'book' },
  TRAVEL_FOR_STUDY: { label: 'Study travel', icon: 'plane' },
  OTHER: { label: 'Other', icon: 'dots' },
};

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  FULL_TIME_STUDENT: 'Full-time student',
  PART_TIME_EMPLOYED: 'Part-time job',
  FULL_TIME_EMPLOYED: 'Full-time job',
  SELF_EMPLOYED: 'Self-employed / freelance',
  INTERNSHIP: 'Internship',
};

export const DOCUMENT_META: Record<DocumentType, { label: string; help: string; required: boolean }> = {
  IDENTITY_PROOF: { label: 'Identity proof', help: 'Student ID card or a sample ID document', required: true },
  INCOME_PROOF: { label: 'Income proof', help: 'Stipend letter, payslip or scholarship letter', required: true },
  ADMISSION_LETTER: { label: 'Admission letter', help: 'Optional — helps the reviewer', required: false },
  OTHER: { label: 'Other supporting document', help: 'Optional', required: false },
};

/** The applicant-facing journey shown in progress trackers. */
export const JOURNEY = ['Profile', 'Loan details', 'Documents', 'Review', 'Submitted', 'Verification', 'Decision'];

export function journeyStep(status: LoanStatus): number {
  switch (status) {
    case 'DRAFT':
    case 'DETAILS_PENDING': return 1;
    case 'DOCUMENTS_PENDING':
    case 'DOCUMENTS_PROCESSING': return 2;
    case 'READY_FOR_REVIEW':
    case 'NEEDS_CORRECTION': return 3;
    case 'SUBMITTED': return 4;
    case 'VERIFICATION_IN_PROGRESS':
    case 'MANUAL_REVIEW': return 5;
    case 'APPROVED':
    case 'REJECTED':
    case 'CANCELLED': return 7;
  }
}
