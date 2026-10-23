import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { DOCUMENT_META, PURPOSE_META } from '../../core/labels';
import { Applicant, DocumentType, LoanDetail, LoanPurpose, LoanRequest } from '../../core/models';
import { ApiService, problemOf } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { DocumentUploadComponent } from '../../shared/components/document-upload.component';
import { affordability, calculateEmi } from '../../shared/components/emi-calculator.component';
import { IconComponent } from '../../shared/components/icon.component';
import { FORMAT_PIPES } from '../../shared/pipes/format.pipes';
import { buildProfileForm } from '../profile/profile-form';
import { ProfileFieldsComponent } from '../profile/profile-fields.component';

const STEPS = [
  { title: 'Your profile', sub: 'About you' },
  { title: 'Loan details', sub: 'Amount & purpose' },
  { title: 'Documents', sub: 'Upload PDFs' },
  { title: 'Review & submit', sub: 'Final check' },
];

@Component({
  selector: 'app-loan-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, IconComponent, ProfileFieldsComponent, DocumentUploadComponent, ...FORMAT_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <a routerLink="{{ loanId() ? '/loans/' + loanId() : '/loans' }}" class="back"><app-icon name="arrowLeft" [size]="14" /> {{ loanId() ? 'Back to application' : 'My applications' }}</a>
          <h1>{{ detail()?.loan?.referenceNumber ? 'Application ' + detail()!.loan.referenceNumber : 'New personal loan application' }}</h1>
          <p class="muted">Your progress is saved at every step — you can leave and come back any time.</p>
        </div>
      </div>

      <div class="wizard">
        <aside class="card steps">
          @for (s of steps; track s.title; let i = $index) {
            <button class="step" [class.active]="step() === i" [class.done]="isStepDone(i)" [disabled]="!canGoTo(i)" (click)="goTo(i)">
              <span class="num">@if (isStepDone(i) && step() !== i) { <app-icon name="check" [size]="14" /> } @else { {{ i + 1 }} }</span>
              <span><span class="t">{{ s.title }}</span><span class="s">{{ s.sub }}</span></span>
            </button>
          }
          @if (detail()?.missingItems?.length) {
            <div class="todo">
              <div class="small strong">Still to do</div>
              @for (m of detail()!.missingItems; track m) { <div class="small muted">• {{ m }}</div> }
            </div>
          }
        </aside>

        <section class="card content">
          @if (loading()) {
            <div class="card-body"><div class="skeleton" style="height:320px"></div></div>
          } @else {
            @switch (step()) {
              @case (0) {
                <div class="card-header"><div><h2>Tell us about yourself</h2><p class="muted small">This is saved to your profile and reused for future applications.</p></div></div>
                <div class="card-body"><app-profile-fields [form]="profileForm" [submitted]="profileSubmitted()" /></div>
              }
              @case (1) {
                <div class="card-header"><div><h2>How much do you need?</h2><p class="muted small">Adjust the sliders — your estimated EMI updates instantly.</p></div></div>
                <div class="card-body loan-step" [formGroup]="loanForm">
                  <div class="stack">
                    <div class="field">
                      <div class="row"><label for="amount">Loan amount</label><span class="spacer"></span>
                        <div class="input-group small-input"><span class="prefix">₹</span><input id="amount" class="input" type="number" formControlName="requestedAmount" [class.invalid]="badLoan('requestedAmount')" /></div>
                      </div>
                      <input type="range" min="10000" max="2000000" step="5000" formControlName="requestedAmount" aria-label="Loan amount slider" />
                      <div class="row muted small"><span>₹10,000</span><span class="spacer"></span><span>₹20,00,000</span></div>
                      @if (badLoan('requestedAmount')) { <span class="error">Enter an amount between ₹10,000 and ₹20,00,000</span> }
                    </div>
                    <div class="field">
                      <div class="row"><label>Repayment tenure</label><span class="spacer"></span><span class="pill">{{ lv().tenureMonths }} months</span></div>
                      <input type="range" min="6" max="84" step="6" formControlName="tenureMonths" aria-label="Tenure" />
                      <div class="row muted small"><span>6 months</span><span class="spacer"></span><span>7 years</span></div>
                    </div>
                    <div class="field">
                      <div class="row"><label>Declared interest rate (p.a.)</label><span class="spacer"></span><span class="pill">{{ lv().interestRate }}%</span></div>
                      <input type="range" min="1" max="30" step="0.25" formControlName="interestRate" aria-label="Interest rate" />
                      <span class="hint">An example rate used only for the educational EMI estimate.</span>
                    </div>
                    <div class="field">
                      <label>What is the loan for?</label>
                      <div class="purposes">
                        @for (p of purposes; track p.value) {
                          <button type="button" class="purpose" [class.selected]="lv().purpose === p.value" (click)="loanForm.controls.purpose.setValue(p.value)">
                            <app-icon [name]="p.icon" [size]="20" /> {{ p.label }}
                          </button>
                        }
                      </div>
                      @if (badLoan('purpose')) { <span class="error">Choose a purpose</span> }
                    </div>
                    <div class="field">
                      <label for="note">Anything the reviewer should know? <span class="muted">(optional)</span></label>
                      <textarea id="note" class="input" formControlName="purposeNote" maxlength="500" placeholder="e.g. Laptop required for the final-year design project"></textarea>
                    </div>
                  </div>
                  <div class="summary">
                    <div class="emi-label">Estimated EMI</div>
                    <div class="emi">{{ emi().emi | inr }}<span class="muted small"> /month</span></div>
                    <dl class="kv small">
                      <dt>Principal</dt><dd>{{ lv().requestedAmount | inr }}</dd>
                      <dt>Total interest</dt><dd>{{ emi().interest | inr }}</dd>
                      <dt>Total payable</dt><dd>{{ emi().total | inr }}</dd>
                    </dl>
                    @if (afford(); as a) {
                      <div class="afford tone-{{ a.tone }}"><strong>{{ a.label }}</strong> — {{ (a.ratio * 100).toFixed(0) }}% of your monthly income. <span class="small">{{ a.text }}</span></div>
                    } @else {
                      <div class="muted small">Add your monthly income in step 1 to see an affordability guide.</div>
                    }
                    <p class="muted small">Educational estimate only — not a loan offer.</p>
                  </div>
                </div>
              }
              @case (2) {
                <div class="card-header"><div><h2>Upload your documents</h2><p class="muted small">PDF only, up to 5 MB each. Use sample documents — never real ID.</p></div></div>
                <div class="card-body grid grid-2">
                  @for (t of docTypes; track t) {
                    <app-document-upload [loanId]="loanId()!" [type]="t" [doc]="docOf(t)" (changed)="reload()" />
                  }
                </div>
              }
              @case (3) {
                <div class="card-header"><div><h2>Review your application</h2><p class="muted small">Check everything before submitting. You can still edit until you submit.</p></div></div>
                <div class="card-body stack">
                  @if (detail(); as d) {
                    <div class="checklist">
                      @for (c of checklist(); track c.label) {
                        <div class="check" [class.ok]="c.ok"><app-icon [name]="c.ok ? 'check' : 'alert'" [size]="16" /> {{ c.label }}
                          @if (!c.ok) { <button class="btn btn-ghost btn-sm" (click)="goTo(c.step)">Fix</button> }
                        </div>
                      }
                    </div>
                    <div class="grid grid-2">
                      <div class="review-box">
                        <div class="row"><h3>Applicant</h3><span class="spacer"></span><button class="btn btn-ghost btn-sm" (click)="goTo(0)"><app-icon name="edit" [size]="14" /> Edit</button></div>
                        <dl class="kv">
                          <dt>Name</dt><dd>{{ d.applicant.fullName }}</dd>
                          <dt>Phone</dt><dd>{{ d.applicant.phone }}</dd>
                          <dt>Employment</dt><dd>{{ d.applicant.employmentType | employment }}</dd>
                          <dt>Monthly income</dt><dd>{{ d.applicant.monthlyIncome | inr }}</dd>
                        </dl>
                      </div>
                      <div class="review-box">
                        <div class="row"><h3>Loan</h3><span class="spacer"></span><button class="btn btn-ghost btn-sm" (click)="goTo(1)"><app-icon name="edit" [size]="14" /> Edit</button></div>
                        <dl class="kv">
                          <dt>Amount</dt><dd>{{ d.loan.requestedAmount | inr }}</dd>
                          <dt>Tenure</dt><dd>{{ d.loan.tenureMonths }} months at {{ d.loan.interestRate }}%</dd>
                          <dt>Purpose</dt><dd>{{ d.loan.purpose | purpose }}</dd>
                          <dt>Est. EMI</dt><dd>{{ d.emi?.monthlyInstallment | inr }}</dd>
                        </dl>
                      </div>
                    </div>
                    <label class="checkbox consent">
                      <input type="checkbox" [(ngModel)]="consent" />
                      <span>I confirm the information and documents are <strong>synthetic demo data</strong> and understand that any decision in this platform is simulated.</span>
                    </label>
                  }
                </div>
              }
            }
            <div class="footer">
              @if (step() > 0) { <button class="btn btn-secondary" (click)="goTo(step() - 1)" [disabled]="busy()"><app-icon name="arrowLeft" [size]="16" /> Back</button> }
              <span class="spacer"></span>
              @if (step() < 3) {
                <button class="btn btn-primary" (click)="next()" [disabled]="busy()">
                  @if (busy()) { <span class="spinner"></span> Saving… } @else { {{ step() === 2 ? 'Continue to review' : 'Save & continue' }} <app-icon name="arrowRight" [size]="16" /> }
                </button>
              } @else {
                <button class="btn btn-success btn-lg" (click)="submit()" [disabled]="busy() || !consent || !detail()?.allowedActions?.includes('SUBMIT')">
                  @if (busy()) { <span class="spinner"></span> Submitting… } @else { <app-icon name="send" [size]="16" /> Submit application }
                </button>
              }
            </div>
          }
        </section>
      </div>
    </div>`,
  styles: [`
    .back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--ink-500); }
    .wizard { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 20px; align-items: start; }
    @media (max-width: 900px) { .wizard { grid-template-columns: 1fr; } }
    .steps { padding: 12px; display: flex; flex-direction: column; gap: 4px; position: sticky; top: 80px; }
    .step { display: flex; gap: 12px; align-items: center; padding: 10px; border-radius: 10px; border: none; background: none; text-align: left; font: inherit; cursor: pointer; }
    .step:disabled { cursor: not-allowed; opacity: .55; } .step:hover:not(:disabled) { background: var(--ink-50); }
    .step.active { background: var(--brand-50); }
    .num { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; border: 2px solid var(--ink-200); font-weight: 700; color: var(--ink-500); flex-shrink: 0; background: #fff; }
    .step.active .num { border-color: var(--brand-600); color: var(--brand-600); } .step.done .num { background: var(--brand-600); border-color: var(--brand-600); color: #fff; }
    .t { display: block; font-weight: 600; } .s { display: block; font-size: 12px; color: var(--ink-500); }
    .todo { margin-top: 10px; padding: 12px; border-radius: 10px; background: var(--warning-bg); display: flex; flex-direction: column; gap: 4px; }
    .content { min-height: 420px; display: flex; flex-direction: column; }
    .footer { display: flex; gap: 12px; padding: 16px 22px; border-top: 1px solid var(--ink-100); margin-top: auto; }
    .loan-step { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 28px; }
    @media (max-width: 1100px) { .loan-step { grid-template-columns: 1fr; } }
    .small-input { width: 170px; } .small-input .input { height: 36px; }
    .pill { font-weight: 700; color: var(--brand-700); background: var(--brand-50); padding: 3px 10px; border-radius: 99px; }
    .purposes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    @media (max-width: 640px) { .purposes { grid-template-columns: repeat(2, 1fr); } }
    .purpose { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 12px; border: 1px solid var(--ink-300); border-radius: 12px; background: #fff; font: inherit; font-weight: 600; color: var(--ink-700); cursor: pointer; text-align: left; }
    .purpose:hover { border-color: var(--brand-500); } .purpose.selected { border-color: var(--brand-600); background: var(--brand-50); color: var(--brand-700); box-shadow: 0 0 0 3px var(--brand-100); }
    .summary { background: linear-gradient(160deg, var(--brand-50), #fff 70%); border: 1px solid var(--brand-100); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 14px; align-self: start; position: sticky; top: 80px; }
    .emi-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-500); }
    .emi { font-size: 32px; font-weight: 700; color: var(--brand-700); letter-spacing: -.02em; }
    .afford { padding: 10px 12px; border-radius: 10px; font-size: 13px; }
    .checklist { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .check { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; background: var(--warning-bg); color: var(--warning); font-weight: 500; }
    .check.ok { background: var(--success-bg); color: var(--success); } .check .btn { margin-left: auto; }
    .review-box { border: 1px solid var(--ink-200); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .consent { padding: 14px; border-radius: 12px; background: var(--ink-50); border: 1px solid var(--ink-200); }`],
})
export class LoanWizardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly id = input<string>();
  readonly stepParam = input<string | undefined>(undefined, { alias: 'step' });

  readonly steps = STEPS;
  readonly docTypes = Object.keys(DOCUMENT_META) as DocumentType[];
  readonly purposes = (Object.keys(PURPOSE_META) as LoanPurpose[]).map(value => ({ value, ...PURPOSE_META[value] }));

  readonly step = signal(0);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly profileSubmitted = signal(false);
  readonly loanSubmitted = signal(false);
  readonly applicant = signal<Applicant | null>(null);
  readonly detail = signal<LoanDetail | null>(null);
  readonly loanId = computed(() => this.detail()?.loan.id ?? (this.id() ? Number(this.id()) : null));
  consent = false;

  readonly profileForm = buildProfileForm(this.fb);
  readonly loanForm = this.fb.nonNullable.group({
    requestedAmount: [150000, [Validators.required, Validators.min(10000), Validators.max(2000000)]],
    tenureMonths: [24, [Validators.required, Validators.min(6), Validators.max(84)]],
    interestRate: [10.5, [Validators.required, Validators.min(1), Validators.max(30)]],
    purpose: ['' as LoanPurpose | '', Validators.required],
    purposeNote: [''],
  });
  readonly lv = toSignal(this.loanForm.valueChanges, { initialValue: this.loanForm.getRawValue() });
  readonly emi = computed(() => calculateEmi(Number(this.lv().requestedAmount), Number(this.lv().tenureMonths), Number(this.lv().interestRate)));
  readonly afford = computed(() => affordability(this.emi().emi, this.applicant()?.monthlyIncome));

  readonly checklist = computed(() => {
    const c = this.detail()?.checklist;
    return [
      { label: 'Applicant profile complete', ok: !!c?.profileComplete, step: 0 },
      { label: 'Loan details complete', ok: !!c?.loanDetailsComplete, step: 1 },
      { label: 'Identity proof uploaded', ok: !!c?.identityProofUploaded, step: 2 },
      { label: 'Income proof uploaded', ok: !!c?.incomeProofUploaded, step: 2 },
    ];
  });

  ngOnInit() {
    const id = this.id() ? Number(this.id()) : null;
    forkJoin({ applicant: this.api.myApplicant(), detail: id ? this.api.loan(id) : of(null) }).subscribe({
      next: ({ applicant, detail }) => {
        this.applicant.set(applicant);
        this.profileForm.patchValue(applicant as never);
        if (detail) {
          if (!detail.allowedActions.includes('EDIT')) {
            this.toast.info('This application can no longer be edited');
            this.router.navigate(['/loans', detail.loan.id]);
            return;
          }
          this.setDetail(detail);
        }
        const requested = Number(this.stepParam() ?? NaN);
        this.step.set(!isNaN(requested) && this.canGoTo(requested) ? requested : applicant.profileComplete ? (detail ? 2 : 1) : 0);
        this.loading.set(false);
      },
      error: e => { this.toast.error('Could not load application', problemOf(e).detail); this.router.navigate(['/loans']); },
    });
  }

  private setDetail(d: LoanDetail) {
    this.detail.set(d);
    this.loanForm.patchValue({
      requestedAmount: d.loan.requestedAmount, tenureMonths: d.loan.tenureMonths, interestRate: d.loan.interestRate,
      purpose: d.loan.purpose, purposeNote: d.purposeNote ?? '',
    });
  }

  isStepDone(i: number) {
    const c = this.detail()?.checklist;
    if (i === 0) return !!this.applicant()?.profileComplete;
    if (i === 1) return !!c?.loanDetailsComplete;
    if (i === 2) return !!c?.identityProofUploaded && !!c?.incomeProofUploaded;
    return false;
  }

  canGoTo(i: number) {
    if (i <= 1) return i === 0 || !!this.applicant()?.profileComplete;
    return !!this.loanId() && !!this.applicant()?.profileComplete;
  }

  goTo(i: number) {
    if (!this.canGoTo(i)) return;
    this.step.set(i);
    if (this.loanId()) this.router.navigate(['/loans', this.loanId(), 'edit'], { queryParams: { step: i }, replaceUrl: true });
  }

  docOf(t: DocumentType) { return this.detail()?.documents.find(d => d.documentType === t); }

  badLoan(name: 'requestedAmount' | 'purpose') {
    const c = this.loanForm.controls[name];
    return c.invalid && (c.touched || this.loanSubmitted());
  }

  reload() {
    const id = this.loanId();
    if (id) this.api.loan(id).subscribe(d => this.detail.set(d));
  }

  next() {
    if (this.step() === 0) return this.saveProfile();
    if (this.step() === 1) return this.saveLoan();
    if (this.step() === 2) {
      const c = this.detail()?.checklist;
      if (!c?.identityProofUploaded || !c?.incomeProofUploaded) {
        this.toast.error('Required documents missing', 'Please upload both identity proof and income proof.');
        return;
      }
      this.goTo(3);
    }
  }

  private saveProfile() {
    this.profileSubmitted.set(true);
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); this.toast.error('Please fix the highlighted fields'); return; }
    this.busy.set(true);
    this.api.saveApplicant(this.profileForm.getRawValue() as Partial<Applicant>).subscribe({
      next: a => { this.applicant.set(a); this.busy.set(false); this.reload(); this.goTo(1); },
      error: e => { this.busy.set(false); this.toast.error('Could not save profile', problemOf(e).detail); },
    });
  }

  private saveLoan() {
    this.loanSubmitted.set(true);
    if (this.loanForm.invalid) { this.loanForm.markAllAsTouched(); this.toast.error('Please complete the loan details'); return; }
    const v = this.loanForm.getRawValue();
    const body: LoanRequest = {
      requestedAmount: Number(v.requestedAmount), tenureMonths: Number(v.tenureMonths), interestRate: Number(v.interestRate),
      purpose: v.purpose as LoanPurpose, purposeNote: v.purposeNote,
    };
    this.busy.set(true);
    const id = this.loanId();
    (id ? this.api.updateLoan(id, body) : this.api.createLoan(body)).subscribe({
      next: d => {
        this.busy.set(false);
        if (!id) this.toast.success(`Draft ${d.loan.referenceNumber} created`, 'Next, upload your documents.');
        this.setDetail(d);
        this.goTo(2);
      },
      error: e => { this.busy.set(false); this.toast.error('Could not save loan details', problemOf(e).detail); },
    });
  }

  submit() {
    const id = this.loanId();
    if (!id) return;
    this.busy.set(true);
    this.api.submitLoan(id).subscribe({
      next: d => { this.toast.success('Application submitted', `${d.loan.referenceNumber} is now with a reviewer.`); this.router.navigate(['/loans', id]); },
      error: e => { this.busy.set(false); this.toast.error('Submission failed', problemOf(e).detail); },
    });
  }
}
