import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { STATUS_META } from '../../core/labels';
import { Applicant, DashboardData } from '../../core/models';
import { ApiService, problemOf } from '../../core/services/api.service';
import { EmiCalculatorComponent } from '../../shared/components/emi-calculator.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { LoanProgressComponent } from '../../shared/components/loan-progress.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { FORMAT_PIPES } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent, StatusBadgeComponent, LoanProgressComponent, EmptyStateComponent, EmiCalculatorComponent, ...FORMAT_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>{{ greeting() }}, {{ firstName() }}</h1>
          <p class="muted">{{ auth.isStaff() ? 'Here is what is happening across the platform today.' : 'Here is an overview of your loan applications.' }}</p>
        </div>
        @if (auth.isStaff()) {
          <a class="btn btn-primary" routerLink="/review"><app-icon name="shield" [size]="16" /> Open review queue</a>
        }
      </div>

      @if (error()) { <div class="alert alert-danger"><app-icon name="alert" /> {{ error() }}</div> }

      @if (!auth.isStaff() && applicant() && !applicant()!.profileComplete) {
        <div class="alert alert-info onboarding">
          <app-icon name="sparkle" />
          <div class="spacer"><strong>Complete your profile to speed things up.</strong><br />We use it to pre-fill every application and estimate affordability.</div>
          <a class="btn btn-primary btn-sm" routerLink="/profile">Complete profile</a>
        </div>
      }

      <div class="grid grid-4 stats">
        @for (s of statCards(); track s.label) {
          <div class="card stat">
            <div class="stat-icon tone-{{ s.tone }}"><app-icon [name]="s.icon" /></div>
            <div>
              <div class="muted small">{{ s.label }}</div>
              @if (loading()) { <div class="skeleton" style="height:28px;width:60px;margin-top:4px"></div> }
              @else { <div class="stat-value">{{ s.value }}</div> }
            </div>
          </div>
        }
      </div>

      <div class="grid grid-main" style="margin-top:20px">
        <div class="stack">
          <div class="card">
            <div class="card-header">
              <div><h2>{{ auth.isStaff() ? 'Latest applications' : 'Your applications' }}</h2><p class="muted small">Most recently updated first</p></div>
              <a routerLink="{{ auth.isStaff() ? '/review' : '/loans' }}" class="btn btn-ghost btn-sm">View all <app-icon name="arrowRight" [size]="14" /></a>
            </div>
            @if (loading()) {
              <div class="card-body stack">@for (i of [1,2,3]; track i) { <div class="skeleton" style="height:64px"></div> }</div>
            } @else if (data()?.recentApplications?.length) {
              <div class="loan-list">
                @for (l of data()!.recentApplications; track l.id) {
                  <a class="loan-row" [routerLink]="['/loans', l.id]">
                    <div class="loan-main">
                      <div class="row"><span class="strong">{{ l.referenceNumber }}</span><app-status-badge [status]="l.status" /></div>
                      <div class="muted small">{{ l.purpose | purpose }} · {{ l.requestedAmount | inr }} · {{ l.tenureMonths }} months @if (auth.isStaff()) { · {{ l.applicantName }} }</div>
                    </div>
                    <div class="loan-progress"><app-loan-progress [status]="l.status" [compact]="true" /></div>
                    <app-icon name="arrowRight" [size]="16" class="chev" />
                  </a>
                }
              </div>
            } @else {
              <app-empty-state icon="file" title="No applications yet" message="Start your first personal loan application. You can save and come back any time.">
                @if (!auth.isStaff()) { <a class="btn btn-primary" routerLink="/loans/new"><app-icon name="plus" [size]="16" /> Start an application</a> }
              </app-empty-state>
            }
          </div>

          <div class="card">
            <div class="card-header"><div><h2>How it works</h2><p class="muted small">Seven clear stages from start to decision</p></div></div>
            <div class="card-body">
              <ol class="how">
                <li><span>1</span><div><strong>Profile & loan details</strong><p class="muted small">Tell us about yourself and how much you need. See your EMI instantly.</p></div></li>
                <li><span>2</span><div><strong>Upload documents</strong><p class="muted small">Identity proof and income proof as PDF. We run basic checks right away.</p></div></li>
                <li><span>3</span><div><strong>Review & submit</strong><p class="muted small">Double-check everything. Submission is recorded and published as an event.</p></div></li>
                <li><span>4</span><div><strong>Verification & decision</strong><p class="muted small">A reviewer verifies and records a decision with a clear explanation.</p></div></li>
              </ol>
            </div>
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <div class="card-header"><div><h2>Recent activity</h2><p class="muted small">Status changes with reasons</p></div></div>
            <div class="card-body">
              @if (data()?.recentActivity?.length) {
                <ul class="activity">
                  @for (a of data()!.recentActivity; track $index) {
                    <li>
                      <span class="adot tone-{{ tone(a.toStatus) }}"></span>
                      <div>
                        <div><a [routerLink]="['/loans', a.loanId]" class="strong">{{ a.referenceNumber }}</a> → {{ a.toStatus | statusLabel }}</div>
                        <div class="muted small">{{ a.reason }} · {{ a.changedAt | ago }}</div>
                      </div>
                    </li>
                  }
                </ul>
              } @else { <p class="muted small">Activity will appear here as your applications progress.</p> }
            </div>
          </div>

          <div class="card">
            <div class="card-header"><div><h2>EMI calculator</h2><p class="muted small">Plan before you apply</p></div><app-icon name="calculator" /></div>
            <div class="card-body"><app-emi-calculator [monthlyIncome]="applicant()?.monthlyIncome ?? null" /></div>
          </div>
        </div>
      </div>
    </div>`,
  styles: [`
    .onboarding { align-items: center; margin-bottom: 20px; }
    .stat { display: flex; gap: 14px; align-items: center; padding: 18px; }
    .stat-icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; }
    .stat-value { font-size: 26px; font-weight: 700; letter-spacing: -.02em; }
    .loan-list { display: flex; flex-direction: column; }
    .loan-row { display: flex; align-items: center; gap: 18px; padding: 16px 22px; border-bottom: 1px solid var(--ink-100); color: inherit; text-decoration: none !important; transition: background .1s; }
    .loan-row:last-child { border-bottom: none; } .loan-row:hover { background: var(--brand-50); }
    .loan-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .loan-progress { width: 220px; } .chev { color: var(--ink-400); }
    @media (max-width: 700px) { .loan-progress { display: none; } }
    .how { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
    .how li { display: flex; gap: 12px; } .how span { width: 28px; height: 28px; border-radius: 8px; background: var(--brand-50); color: var(--brand-700); display: grid; place-items: center; font-weight: 700; flex-shrink: 0; }
    @media (max-width: 640px) { .how { grid-template-columns: 1fr; } }
    .activity { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
    .activity li { display: flex; gap: 12px; } .adot { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; background: currentColor; }`],
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  readonly data = signal<DashboardData | null>(null);
  readonly applicant = signal<Applicant | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly firstName = computed(() => (this.auth.user()?.displayName ?? '').split(' ')[0]);
  readonly greeting = computed(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  });

  readonly statCards = computed(() => {
    const s = this.data()?.stats;
    const staff = this.auth.isStaff();
    return [
      { label: staff ? 'All applications' : 'Total applications', value: s?.total ?? 0, icon: 'file', tone: 'info' },
      { label: staff ? 'Awaiting review' : 'In review', value: s?.inReview ?? 0, icon: 'clock', tone: 'accent' },
      { label: 'Approved', value: s?.approved ?? 0, icon: 'check', tone: 'success' },
      { label: staff ? 'New submissions' : 'Needs your attention', value: s?.needsAttention ?? 0, icon: 'alert', tone: 'warning' },
    ];
  });

  ngOnInit() {
    this.api.dashboard().subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: e => { this.error.set(problemOf(e).detail); this.loading.set(false); },
    });
    if (!this.auth.isStaff()) {
      this.api.myApplicant().subscribe({ next: a => this.applicant.set(a), error: () => {} });
    }
  }

  tone(status: keyof typeof STATUS_META) { return STATUS_META[status].tone; }
}
