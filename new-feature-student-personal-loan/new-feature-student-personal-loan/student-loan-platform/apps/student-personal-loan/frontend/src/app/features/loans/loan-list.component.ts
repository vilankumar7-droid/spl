import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoanStatus, LoanSummary } from '../../core/models';
import { ApiService, problemOf } from '../../core/services/api.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { FORMAT_PIPES } from '../../shared/pipes/format.pipes';

type Filter = 'all' | 'active' | 'review' | 'closed';
const GROUPS: Record<Exclude<Filter, 'all'>, LoanStatus[]> = {
  active: ['DRAFT', 'DETAILS_PENDING', 'DOCUMENTS_PENDING', 'DOCUMENTS_PROCESSING', 'READY_FOR_REVIEW', 'NEEDS_CORRECTION'],
  review: ['SUBMITTED', 'VERIFICATION_IN_PROGRESS', 'MANUAL_REVIEW'],
  closed: ['APPROVED', 'REJECTED', 'CANCELLED'],
};

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [RouterLink, FormsModule, IconComponent, StatusBadgeComponent, EmptyStateComponent, ...FORMAT_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>My applications</h1><p class="muted">Track, continue or review every personal loan application.</p></div>
        <a class="btn btn-primary" routerLink="/loans/new"><app-icon name="plus" [size]="16" /> New application</a>
      </div>

      <div class="card">
        <div class="toolbar">
          <div class="seg">
            @for (f of filters; track f.key) {
              <button [class.active]="filter() === f.key" (click)="filter.set(f.key)">{{ f.label }} <span class="count">{{ count(f.key) }}</span></button>
            }
          </div>
          <div class="search input-group">
            <span class="prefix"><app-icon name="search" [size]="15" /></span>
            <input class="input" placeholder="Search by reference" [ngModel]="query()" (ngModelChange)="query.set($event)" />
          </div>
        </div>

        @if (loading()) {
          <div class="card-body stack">@for (i of [1,2,3,4]; track i) { <div class="skeleton" style="height:48px"></div> }</div>
        } @else if (error()) {
          <div class="card-body"><div class="alert alert-danger"><app-icon name="alert" /> {{ error() }}</div></div>
        } @else if (!loans().length) {
          <app-empty-state icon="file" title="You have no applications yet" message="Start a personal loan application — it only takes a few minutes and you can save your progress.">
            <a class="btn btn-primary" routerLink="/loans/new"><app-icon name="plus" [size]="16" /> Start now</a>
          </app-empty-state>
        } @else if (!visible().length) {
          <app-empty-state icon="search" title="No matches" message="Try another filter or search term." />
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Reference</th><th>Purpose</th><th>Amount</th><th>EMI (est.)</th><th>Status</th><th>Updated</th><th></th></tr></thead>
              <tbody>
                @for (l of visible(); track l.id) {
                  <tr class="clickable" (click)="open(l)">
                    <td class="strong">{{ l.referenceNumber }}</td>
                    <td>{{ l.purpose | purpose }}</td>
                    <td>{{ l.requestedAmount | inr }}<div class="muted small">{{ l.tenureMonths }} months · {{ l.interestRate }}%</div></td>
                    <td>{{ l.monthlyInstallment | inr }}</td>
                    <td><app-status-badge [status]="l.status" /></td>
                    <td class="muted">{{ l.updatedAt | ago }}</td>
                    <td style="text-align:right"><app-icon name="arrowRight" [size]="16" class="muted" /></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>`,
  styles: [`
    .toolbar { display: flex; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--ink-100); flex-wrap: wrap; align-items: center; justify-content: space-between; }
    .seg { display: inline-flex; background: var(--ink-100); border-radius: 10px; padding: 3px; gap: 2px; flex-wrap: wrap; }
    .seg button { border: none; background: none; padding: 7px 12px; border-radius: 8px; font: inherit; font-weight: 600; color: var(--ink-500); cursor: pointer; }
    .seg button.active { background: #fff; color: var(--ink-900); box-shadow: var(--shadow-sm); }
    .count { font-size: 11px; background: var(--ink-200); padding: 1px 6px; border-radius: 99px; margin-left: 4px; }
    .search { width: 260px; } .search .input { height: 38px; }`],
})
export class LoanListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly loans = signal<LoanSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filter = signal<Filter>('all');
  readonly query = signal('');
  readonly filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'active', label: 'In progress' }, { key: 'review', label: 'In review' }, { key: 'closed', label: 'Closed' },
  ];

  readonly visible = computed(() => {
    const f = this.filter();
    const q = this.query().trim().toLowerCase();
    return this.loans().filter(l => (f === 'all' || GROUPS[f].includes(l.status)) && (!q || l.referenceNumber.toLowerCase().includes(q)));
  });

  ngOnInit() {
    this.api.loans().subscribe({
      next: l => { this.loans.set(l); this.loading.set(false); },
      error: e => { this.error.set(problemOf(e).detail); this.loading.set(false); },
    });
  }

  count(f: Filter) { return f === 'all' ? this.loans().length : this.loans().filter(l => GROUPS[f].includes(l.status)).length; }
  open(l: LoanSummary) { this.router.navigate(['/loans', l.id]); }
}
