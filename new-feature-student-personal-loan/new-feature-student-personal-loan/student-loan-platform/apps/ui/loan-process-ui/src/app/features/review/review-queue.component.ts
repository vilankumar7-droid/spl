import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoanSummary } from '../../core/models';
import { ApiService, problemOf } from '../../core/services/api.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { FORMAT_PIPES } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-review-queue',
  standalone: true,
  imports: [IconComponent, StatusBadgeComponent, EmptyStateComponent, ...FORMAT_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Review queue</h1><p class="muted">Submitted applications waiting for verification or a decision, oldest first.</p></div>
        <button class="btn btn-secondary" (click)="load()"><app-icon name="refresh" [size]="16" /> Refresh</button>
      </div>
      <div class="tabs">
        <button class="tab" [class.active]="!all()" (click)="setAll(false)">Awaiting action</button>
        <button class="tab" [class.active]="all()" (click)="setAll(true)">All applications</button>
      </div>
      <div class="card">
        @if (loading()) {
          <div class="card-body stack">@for (i of [1,2,3]; track i) { <div class="skeleton" style="height:48px"></div> }</div>
        } @else if (error()) {
          <div class="card-body"><div class="alert alert-danger"><app-icon name="alert" /> {{ error() }}</div></div>
        } @else if (!loans().length) {
          <app-empty-state icon="shield" title="Queue is clear" message="No applications are waiting for review right now. New submissions will appear here." />
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Reference</th><th>Applicant</th><th>Amount</th><th>Purpose</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
              <tbody>
                @for (l of loans(); track l.id) {
                  <tr class="clickable" (click)="router.navigate(['/loans', l.id])">
                    <td class="strong">{{ l.referenceNumber }}</td>
                    <td>{{ l.applicantName }}</td>
                    <td>{{ l.requestedAmount | inr }}<div class="muted small">{{ l.tenureMonths }} mo · EMI {{ l.monthlyInstallment | inr }}</div></td>
                    <td>{{ l.purpose | purpose }}</td>
                    <td><app-status-badge [status]="l.status" /></td>
                    <td class="muted">{{ l.submittedAt | ago }}</td>
                    <td style="text-align:right"><span class="btn btn-secondary btn-sm">Open</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>`,
})
export class ReviewQueueComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly router = inject(Router);
  readonly loans = signal<LoanSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly all = signal(false);

  ngOnInit() { this.load(); }
  setAll(v: boolean) { this.all.set(v); this.load(); }
  load() {
    this.loading.set(true);
    this.api.reviewQueue(this.all()).subscribe({
      next: l => { this.loans.set(l); this.loading.set(false); this.error.set(null); },
      error: e => { this.error.set(problemOf(e).detail); this.loading.set(false); },
    });
  }
}
