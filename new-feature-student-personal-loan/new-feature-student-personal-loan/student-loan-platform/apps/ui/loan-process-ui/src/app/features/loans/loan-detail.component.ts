import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DOCUMENT_META, STATUS_META } from '../../core/labels';
import { DocumentType, LoanDetail, ReviewDecision } from '../../core/models';
import { ApiService, problemOf } from '../../core/services/api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { DocumentUploadComponent } from '../../shared/components/document-upload.component';
import { IconComponent } from '../../shared/components/icon.component';
import { LoanProgressComponent } from '../../shared/components/loan-progress.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { FORMAT_PIPES } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, IconComponent, StatusBadgeComponent, LoanProgressComponent, DocumentUploadComponent, ...FORMAT_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      @if (loading()) {
        <div class="stack"><div class="skeleton" style="height:60px"></div><div class="skeleton" style="height:120px"></div><div class="skeleton" style="height:300px"></div></div>
      } @else if (error()) {
        <div class="alert alert-danger"><app-icon name="alert" /> {{ error() }}</div>
      } @else if (detail()) {
        @let d = detail()!;
        <div class="page-header">
          <div>
            <a [routerLink]="auth.isStaff() ? '/review' : '/loans'" class="back"><app-icon name="arrowLeft" [size]="14" /> {{ auth.isStaff() ? 'Review queue' : 'My applications' }}</a>
            <div class="row"><h1>{{ d.loan.referenceNumber }}</h1><app-status-badge [status]="d.loan.status" /></div>
            <p class="muted">{{ d.loan.purpose | purpose }} · {{ d.loan.requestedAmount | inr }} over {{ d.loan.tenureMonths }} months · created {{ d.loan.createdAt | ago }}</p>
          </div>
          <div class="row wrap">
            @if (can('CANCEL')) { <button class="btn btn-secondary" (click)="cancel()"><app-icon name="x" [size]="16" /> Cancel application</button> }
            @if (can('EDIT')) { <a class="btn btn-secondary" [routerLink]="['/loans', d.loan.id, 'edit']"><app-icon name="edit" [size]="16" /> Continue editing</a> }
            @if (can('SUBMIT')) { <a class="btn btn-success" [routerLink]="['/loans', d.loan.id, 'edit']" [queryParams]="{ step: 3 }"><app-icon name="send" [size]="16" /> Review & submit</a> }
            @if (can('START_REVIEW')) { <button class="btn btn-primary" (click)="startReview()" [disabled]="busy()"><app-icon name="shield" [size]="16" /> Start verification</button> }
          </div>
        </div>

        <div class="card card-body progress-card">
          <app-loan-progress [status]="d.loan.status" />
          <div class="stage tone-{{ meta().tone }}">
            <app-icon [name]="meta().tone === 'success' ? 'check' : meta().tone === 'danger' ? 'alert' : 'info'" [size]="18" />
            <div><strong>{{ meta().label }}.</strong> {{ meta().help }}
              @if (d.missingItems.length) { <div class="small" style="margin-top:4px">Next: {{ d.missingItems.join(' · ') }}</div> }
            </div>
          </div>
          @if (d.decisionReason) {
            <div class="reviewer-note"><div class="small strong">Reviewer note</div><p>{{ d.decisionReason }}</p><div class="muted small">{{ d.decidedAt | ago }}</div></div>
          }
        </div>

        @if (can('DECIDE')) {
          <div class="card decision">
            <div class="card-header"><div><h2>Record a decision</h2><p class="muted small">Simulated reviewer decision — explain it clearly so the applicant understands.</p></div></div>
            <div class="card-body stack">
              <div class="decisions">
                @for (o of decisionOptions(); track o.value) {
                  <button type="button" class="decision-opt tone-{{ o.tone }}" [class.selected]="decision() === o.value" (click)="decision.set(o.value)">
                    <app-icon [name]="o.icon" /> <span><strong>{{ o.label }}</strong><span class="small">{{ o.help }}</span></span>
                  </button>
                }
              </div>
              <div class="field">
                <label for="reason">Explanation for the applicant *</label>
                <textarea id="reason" class="input" [(ngModel)]="reason" maxlength="1000" placeholder="e.g. Income proof is clear and repayments are within the affordability guideline."></textarea>
              </div>
              <div class="row"><span class="spacer"></span>
                <button class="btn btn-primary" (click)="decide()" [disabled]="busy() || !decision() || !reason.trim()">
                  @if (busy()) { <span class="spinner"></span> } Record decision
                </button>
              </div>
            </div>
          </div>
        }

        <div class="grid grid-main" style="margin-top:20px">
          <div class="stack">
            <div class="grid grid-2">
              <div class="card">
                <div class="card-header"><h2>Loan details</h2></div>
                <div class="card-body">
                  <dl class="kv">
                    <dt>Amount</dt><dd>{{ d.loan.requestedAmount | inr }}</dd>
                    <dt>Tenure</dt><dd>{{ d.loan.tenureMonths }} months</dd>
                    <dt>Declared rate</dt><dd>{{ d.loan.interestRate }}% p.a.</dd>
                    <dt>Purpose</dt><dd>{{ d.loan.purpose | purpose }}</dd>
                    @if (d.purposeNote) { <dt>Note</dt><dd>{{ d.purposeNote }}</dd> }
                    @if (d.loan.submittedAt) { <dt>Submitted</dt><dd>{{ d.loan.submittedAt | ago }}</dd> }
                  </dl>
                </div>
              </div>
              <div class="card">
                <div class="card-header"><h2>Repayment estimate</h2></div>
                <div class="card-body">
                  @if (d.emi; as e) {
                    <div class="emi">{{ e.monthlyInstallment | inr }}<span class="muted small"> /month</span></div>
                    <dl class="kv small" style="margin-top:10px">
                      <dt>Total interest</dt><dd>{{ e.totalInterest | inr }}</dd>
                      <dt>Total payable</dt><dd>{{ e.totalPayable | inr }}</dd>
                      @if (e.incomeRatio !== null) { <dt>Share of income</dt><dd>{{ (e.incomeRatio * 100).toFixed(0) }}% · {{ e.affordability.toLowerCase() }}</dd> }
                    </dl>
                    <p class="muted small" style="margin-top:10px">{{ e.disclaimer }}</p>
                  }
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><div><h2>Documents</h2><p class="muted small">Files are private to you and authorised reviewers.</p></div></div>
              <div class="card-body grid grid-2">
                @for (t of shownDocTypes(); track t) {
                  <app-document-upload [loanId]="d.loan.id" [type]="t" [doc]="docOf(t)" [editable]="can('UPLOAD_DOCUMENTS')" (changed)="load()" />
                }
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h2>Applicant</h2></div>
              <div class="card-body">
                <dl class="kv">
                  <dt>Name</dt><dd>{{ d.applicant.fullName }}</dd>
                  <dt>Phone</dt><dd>{{ d.applicant.phone ?? '—' }}</dd>
                  <dt>City</dt><dd>{{ d.applicant.city ?? '—' }}</dd>
                  <dt>Institution</dt><dd>{{ d.applicant.institutionName ?? '—' }}</dd>
                  <dt>Employment</dt><dd>{{ d.applicant.employmentType | employment }}</dd>
                  <dt>Monthly income</dt><dd>{{ d.applicant.monthlyIncome | inr }}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div class="card timeline-card">
            <div class="card-header"><div><h2>Timeline</h2><p class="muted small">Every status change, who made it and why</p></div></div>
            <div class="card-body">
              <ol class="timeline">
                @for (t of reversedTimeline(); track $index) {
                  <li>
                    <span class="tdot tone-{{ tone(t.toStatus) }}"></span>
                    <div>
                      <div class="strong">{{ t.toStatus | statusLabel }}</div>
                      @if (t.reason) { <div class="small">{{ t.reason }}</div> }
                      <div class="muted small">{{ t.actor }} · {{ t.changedAt | date: 'd MMM, h:mm a' }}</div>
                    </div>
                  </li>
                }
              </ol>
            </div>
          </div>
        </div>
      }
    </div>`,
  styles: [`
    .back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--ink-500); }
    .progress-card { display: flex; flex-direction: column; gap: 18px; padding: 24px; }
    .stage { display: flex; gap: 12px; padding: 12px 14px; border-radius: 12px; align-items: flex-start; }
    .reviewer-note { border-left: 3px solid var(--brand-500); padding: 8px 14px; background: var(--ink-50); border-radius: 0 10px 10px 0; }
    .decision { margin-top: 20px; border-color: var(--brand-200); box-shadow: 0 0 0 4px var(--brand-50); }
    .decisions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    @media (max-width: 700px) { .decisions { grid-template-columns: 1fr; } }
    .decision-opt { display: flex; gap: 12px; align-items: flex-start; text-align: left; padding: 12px 14px; border-radius: 12px; border: 2px solid transparent; font: inherit; cursor: pointer; }
    .decision-opt span span { display: block; opacity: .85; } .decision-opt.selected { border-color: currentColor; }
    .emi { font-size: 26px; font-weight: 700; color: var(--brand-700); }
    .timeline { list-style: none; margin: 0; padding: 0; position: relative; }
    .timeline li { display: flex; gap: 14px; padding-bottom: 18px; position: relative; }
    .timeline li:not(:last-child)::before { content: ''; position: absolute; left: 5px; top: 16px; bottom: 0; width: 2px; background: var(--ink-200); }
    .tdot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; background: currentColor; box-shadow: 0 0 0 3px #fff; z-index: 1; }
    .timeline-card { align-self: start; position: sticky; top: 80px; }`],
})
export class LoanDetailComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  readonly id = input.required<string>();
  readonly detail = signal<LoanDetail | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly decision = signal<ReviewDecision | null>(null);
  reason = '';

  readonly meta = computed(() => STATUS_META[this.detail()!.loan.status]);
  readonly reversedTimeline = computed(() => [...(this.detail()?.timeline ?? [])].reverse());
  readonly shownDocTypes = computed(() => {
    const d = this.detail();
    const all = Object.keys(DOCUMENT_META) as DocumentType[];
    return d && !this.can('UPLOAD_DOCUMENTS') ? all.filter(t => DOCUMENT_META[t].required || d.documents.some(x => x.documentType === t)) : all;
  });
  readonly decisionOptions = computed(() => {
    const opts = [
      { value: 'APPROVE' as ReviewDecision, label: 'Approve', help: 'Everything checks out', icon: 'check', tone: 'success' },
      { value: 'REQUEST_CORRECTION' as ReviewDecision, label: 'Request correction', help: 'Applicant must fix something', icon: 'edit', tone: 'warning' },
      { value: 'ESCALATE_TO_MANUAL_REVIEW' as ReviewDecision, label: 'Escalate', help: 'Needs a senior manual review', icon: 'shield', tone: 'info' },
      { value: 'REJECT' as ReviewDecision, label: 'Reject', help: 'Does not meet the criteria', icon: 'x', tone: 'danger' },
    ];
    return this.detail()?.loan.status === 'MANUAL_REVIEW' ? opts.filter(o => o.value !== 'ESCALATE_TO_MANUAL_REVIEW') : opts;
  });

  ngOnInit() { this.load(); }

  load() {
    this.api.loan(Number(this.id())).subscribe({
      next: d => { this.detail.set(d); this.loading.set(false); },
      error: e => { this.error.set(problemOf(e).detail); this.loading.set(false); },
    });
  }

  can(action: string) { return !!this.detail()?.allowedActions.includes(action as never); }
  docOf(t: DocumentType) { return this.detail()?.documents.find(x => x.documentType === t); }
  tone(s: keyof typeof STATUS_META) { return STATUS_META[s].tone; }

  async cancel() {
    const r = await this.confirm.ask({ title: 'Cancel this application?', message: 'A cancelled application cannot be reopened. You can always start a new one.', confirmText: 'Yes, cancel it', danger: true, withReason: true });
    if (!r.confirmed) return;
    this.api.cancelLoan(this.detail()!.loan.id, r.reason).subscribe({
      next: d => { this.detail.set(d); this.toast.info('Application cancelled'); },
      error: e => this.toast.error('Could not cancel', problemOf(e).detail),
    });
  }

  startReview() {
    this.busy.set(true);
    this.api.startReview(this.detail()!.loan.id).subscribe({
      next: d => { this.detail.set(d); this.busy.set(false); this.toast.success('Verification started'); },
      error: e => { this.busy.set(false); this.toast.error('Could not start review', problemOf(e).detail); },
    });
  }

  decide() {
    const decision = this.decision();
    if (!decision) return;
    this.busy.set(true);
    this.api.decide(this.detail()!.loan.id, decision, this.reason.trim()).subscribe({
      next: d => { this.detail.set(d); this.busy.set(false); this.reason = ''; this.decision.set(null); this.toast.success('Decision recorded', `Status is now ${STATUS_META[d.loan.status].label}.`); },
      error: e => { this.busy.set(false); this.toast.error('Could not record decision', problemOf(e).detail); },
    });
  }
}
