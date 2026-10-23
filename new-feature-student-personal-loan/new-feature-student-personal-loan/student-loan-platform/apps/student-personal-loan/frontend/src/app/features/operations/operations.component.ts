import { DatePipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { AuditEntry, EventView, OperationsSummary } from '../../core/models';
import { ApiService, problemOf } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { TimeAgoPipe } from '../../shared/pipes/format.pipes';

/** Event Operations dashboard: outbox events (future Kafka messages), publish status, retries and audit trail. */
@Component({
  selector: 'app-operations',
  standalone: true,
  imports: [FormsModule, DatePipe, JsonPipe, IconComponent, EmptyStateComponent, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Event operations</h1><p class="muted">Every business event recorded through the transactional outbox, its delivery status and the audit trail.</p></div>
        <div class="row">
          <label class="checkbox small"><input type="checkbox" [(ngModel)]="autoRefresh" /> Auto-refresh</label>
          <button class="btn btn-secondary" (click)="load()"><app-icon name="refresh" [size]="16" /> Refresh</button>
        </div>
      </div>

      <div class="grid grid-4">
        <div class="card stat"><div class="muted small">Events recorded</div><div class="v">{{ summary()?.total ?? '—' }}</div></div>
        <div class="card stat"><div class="muted small">Published</div><div class="v ok">{{ summary()?.published ?? '—' }}</div></div>
        <div class="card stat"><div class="muted small">Pending</div><div class="v warn">{{ summary()?.pending ?? '—' }}</div></div>
        <div class="card stat"><div class="muted small">Failed (dead-letter)</div><div class="v bad">{{ summary()?.failed ?? '—' }}</div></div>
      </div>
      @if (summary()?.destination === 'log') {
        <div class="alert alert-info" style="margin-top:16px"><app-icon name="info" />
          <div>Kafka is not enabled yet (Stage D), so events are published to the structured application log. The outbox, envelope and retry logic are the same ones Kafka will use.</div></div>
      }

      <div class="tabs" style="margin-top:20px">
        <button class="tab" [class.active]="tab() === 'events'" (click)="tab.set('events')">Events</button>
        <button class="tab" [class.active]="tab() === 'audit'" (click)="tab.set('audit')">Audit trail</button>
      </div>

      @if (tab() === 'events') {
        <div class="card">
          <div class="toolbar">
            <div class="input-group search"><span class="prefix"><app-icon name="search" [size]="15" /></span>
              <input class="input" placeholder="Filter by application, event type or correlation ID" [ngModel]="query()" (ngModelChange)="query.set($event)" /></div>
            <select class="select" style="width:180px" [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
              <option value="">All statuses</option><option value="PUBLISHED">Published</option><option value="PENDING">Pending</option><option value="FAILED">Failed</option>
            </select>
          </div>
          @if (!filtered().length) {
            <app-empty-state icon="activity" title="No events yet" message="Create or submit an application and its events will show up here." />
          } @else {
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Event</th><th>Topic</th><th>Application</th><th>Correlation ID</th><th>Status</th><th>Occurred</th></tr></thead>
                <tbody>
                  @for (e of filtered(); track e.eventId) {
                    <tr class="clickable" (click)="toggle(e.eventId)">
                      <td><div class="strong mono">{{ e.eventType }}</div><div class="muted small mono">{{ e.eventId }} · v{{ e.eventVersion }}</div></td>
                      <td><span class="chip mono">{{ e.topic }}</span></td>
                      <td class="strong">{{ e.applicationId }}</td>
                      <td class="mono muted">{{ shortCorr(e.correlationId) }}</td>
                      <td>
                        <span class="badge" [class.tone-success]="e.status === 'PUBLISHED'" [class.tone-warning]="e.status === 'PENDING'" [class.tone-danger]="e.status === 'FAILED'">{{ e.status }}</span>
                        @if (e.attempts > 1) { <div class="muted small">{{ e.attempts }} attempts</div> }
                      </td>
                      <td class="muted">{{ e.occurredAt | ago }}</td>
                    </tr>
                    @if (expanded() === e.eventId) {
                      <tr class="payload-row"><td colspan="6">
                        <div class="row small muted" style="margin-bottom:8px">Occurred {{ e.occurredAt | date: 'medium' }} @if (e.publishedAt) { · published {{ e.publishedAt | date: 'medium' }} }
                          @if (e.lastError) { · <span style="color:var(--danger)">{{ e.lastError }}</span> }
                          <span class="spacer"></span>
                          @if (e.status === 'FAILED' && auth.isAdmin()) { <button class="btn btn-secondary btn-sm" (click)="retry(e, $event)">Retry</button> }
                        </div>
                        <pre>{{ parse(e.payload) | json }}</pre>
                      </td></tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      } @else {
        <div class="card">
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Correlation ID</th></tr></thead>
              <tbody>
                @for (a of audit(); track a.id) {
                  <tr>
                    <td class="muted">{{ a.occurredAt | date: 'd MMM, h:mm:ss a' }}</td>
                    <td>{{ a.actor }}</td>
                    <td><span class="chip mono" [class.fail]="a.action.includes('FAILED')">{{ a.action }}</span></td>
                    <td>{{ a.targetType ?? '' }} <span class="strong">{{ a.targetId ?? '' }}</span> @if (a.details) { <span class="muted small">· {{ a.details }}</span> }</td>
                    <td class="mono muted">{{ shortCorr(a.correlationId) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>`,
  styles: [`
    .stat { padding: 18px; } .v { font-size: 26px; font-weight: 700; margin-top: 4px; }
    .ok { color: var(--success); } .warn { color: var(--warning); } .bad { color: var(--danger); }
    .toolbar { display: flex; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--ink-100); flex-wrap: wrap; }
    .search { flex: 1; min-width: 240px; } .search .input, .select { height: 38px; }
    .payload-row td { background: var(--ink-50); }
    pre { margin: 0; padding: 14px; background: #0f172a; color: #e2e8f0; border-radius: 10px; font-size: 12px; overflow-x: auto; }
    .chip.fail { background: var(--danger-bg); color: var(--danger); }`],
})
export class OperationsComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly summary = signal<OperationsSummary | null>(null);
  readonly events = signal<EventView[]>([]);
  readonly audit = signal<AuditEntry[]>([]);
  readonly tab = signal<'events' | 'audit'>('events');
  readonly query = signal('');
  readonly statusFilter = signal('');
  readonly expanded = signal<string | null>(null);
  autoRefresh = true;
  private timer?: ReturnType<typeof setInterval>;

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const s = this.statusFilter();
    return this.events().filter(e => (!s || e.status === s) &&
      (!q || [e.applicationId, e.eventType, e.correlationId ?? '', e.eventId].some(v => v.toLowerCase().includes(q))));
  });

  ngOnInit() {
    this.load();
    this.timer = setInterval(() => this.autoRefresh && this.load(), 5000);
  }
  ngOnDestroy() { clearInterval(this.timer); }

  load() {
    this.api.opsSummary().subscribe({ next: s => this.summary.set(s), error: e => this.toast.error('Could not load summary', problemOf(e).detail) });
    this.api.opsEvents().subscribe({ next: e => this.events.set(e), error: () => {} });
    this.api.audit().subscribe({ next: a => this.audit.set(a), error: () => {} });
  }

  toggle(id: string) { this.expanded.set(this.expanded() === id ? null : id); }
  parse(p: string) { try { return JSON.parse(p); } catch { return p; } }
  shortCorr(c: string | null) { return c ? (c.length > 18 ? c.slice(0, 18) + '…' : c) : '—'; }

  retry(e: EventView, ev: Event) {
    ev.stopPropagation();
    this.api.retryEvent(e.eventId).subscribe({
      next: () => { this.toast.success('Event re-queued'); this.load(); },
      error: err => this.toast.error('Retry failed', problemOf(err).detail),
    });
  }
}
