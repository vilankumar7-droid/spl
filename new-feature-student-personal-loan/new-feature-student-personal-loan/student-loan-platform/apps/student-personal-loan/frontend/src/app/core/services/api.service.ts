import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Applicant, ApiProblem, AuditEntry, DashboardData, DocumentType, EmiEstimate, EventView, FeatureStatus,
  LoanDetail, LoanDocument, LoanRequest, LoanSummary, OperationsSummary, ReviewDecision, TimelineEntry,
} from '../models';

/** Centralised access to the StudentPersonalLoan REST API. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1';

  dashboard(): Observable<DashboardData> { return this.http.get<DashboardData>(`${this.base}/dashboard`); }
  features(): Observable<FeatureStatus[]> { return this.http.get<FeatureStatus[]>(`${this.base}/features`); }

  myApplicant(): Observable<Applicant> { return this.http.get<Applicant>(`${this.base}/applicants/me`); }
  saveApplicant(body: Partial<Applicant>): Observable<Applicant> {
    return this.http.put<Applicant>(`${this.base}/applicants/me`, body);
  }

  loans(): Observable<LoanSummary[]> { return this.http.get<LoanSummary[]>(`${this.base}/loans`); }
  loan(id: number): Observable<LoanDetail> { return this.http.get<LoanDetail>(`${this.base}/loans/${id}`); }
  createLoan(body: LoanRequest): Observable<LoanDetail> { return this.http.post<LoanDetail>(`${this.base}/loans`, body); }
  updateLoan(id: number, body: Partial<LoanRequest>): Observable<LoanDetail> {
    return this.http.patch<LoanDetail>(`${this.base}/loans/${id}`, body);
  }
  submitLoan(id: number): Observable<LoanDetail> { return this.http.post<LoanDetail>(`${this.base}/loans/${id}/submit`, {}); }
  cancelLoan(id: number, reason?: string): Observable<LoanDetail> {
    return this.http.post<LoanDetail>(`${this.base}/loans/${id}/cancel`, { reason });
  }
  timeline(id: number): Observable<TimelineEntry[]> { return this.http.get<TimelineEntry[]>(`${this.base}/loans/${id}/timeline`); }

  uploadDocument(loanId: number, type: DocumentType, file: File): Observable<LoanDocument> {
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    return this.http.post<LoanDocument>(`${this.base}/loans/${loanId}/documents`, form);
  }
  deleteDocument(loanId: number, documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/loans/${loanId}/documents/${documentId}`);
  }
  downloadDocument(loanId: number, documentId: string): Observable<Blob> {
    return this.http.get(`${this.base}/loans/${loanId}/documents/${documentId}/file`, { responseType: 'blob' });
  }

  emi(amount: number, tenureMonths: number, annualRate: number, monthlyIncome?: number | null): Observable<EmiEstimate> {
    const params: Record<string, string> = { amount: String(amount), tenureMonths: String(tenureMonths), annualRate: String(annualRate) };
    if (monthlyIncome) params['monthlyIncome'] = String(monthlyIncome);
    return this.http.get<EmiEstimate>(`${this.base}/calculator/emi`, { params });
  }

  reviewQueue(all = false): Observable<LoanSummary[]> {
    return this.http.get<LoanSummary[]>(`${this.base}/review/loans`, { params: { all } });
  }
  startReview(id: number): Observable<LoanDetail> { return this.http.post<LoanDetail>(`${this.base}/review/loans/${id}/start`, {}); }
  decide(id: number, decision: ReviewDecision, reason: string): Observable<LoanDetail> {
    return this.http.post<LoanDetail>(`${this.base}/review/loans/${id}/decision`, { decision, reason });
  }

  opsSummary(): Observable<OperationsSummary> { return this.http.get<OperationsSummary>(`${this.base}/operations/summary`); }
  opsEvents(): Observable<EventView[]> { return this.http.get<EventView[]>(`${this.base}/operations/events`); }
  retryEvent(eventId: string): Observable<EventView> {
    return this.http.post<EventView>(`${this.base}/operations/events/${eventId}/retry`, {});
  }
  audit(): Observable<AuditEntry[]> { return this.http.get<AuditEntry[]>(`${this.base}/operations/audit`); }
}

/** Extracts a friendly message (and field errors) from an API error response. */
export function problemOf(err: unknown): ApiProblem {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object' && 'detail' in body) return body as ApiProblem;
    if (err.status === 0) return { status: 0, detail: 'Cannot reach the server. Check that the backend is running.' };
    return { status: err.status, detail: err.message };
  }
  return { status: -1, detail: 'Unexpected error' };
}
