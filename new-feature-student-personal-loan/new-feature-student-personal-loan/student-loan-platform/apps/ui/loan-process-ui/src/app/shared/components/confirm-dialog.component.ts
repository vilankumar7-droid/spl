import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirm.current(); as c) {
      <div class="backdrop" (click)="close(false)">
        <div class="dialog card" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <h2>{{ c.title }}</h2>
          <p class="muted">{{ c.message }}</p>
          @if (c.withReason) {
            <textarea class="input" placeholder="Reason (optional)" [(ngModel)]="reason" maxlength="1000"></textarea>
          }
          <div class="row actions">
            <button class="btn btn-secondary" (click)="close(false)">Go back</button>
            <button class="btn" [class.btn-danger]="c.danger" [class.btn-primary]="!c.danger" (click)="close(true)">{{ c.confirmText ?? 'Confirm' }}</button>
          </div>
        </div>
      </div>
    }`,
  styles: [`
    .backdrop { position: fixed; inset: 0; background: rgba(17,24,39,.45); display: grid; place-items: center; z-index: 900; padding: 16px; animation: fade .15s; }
    @keyframes fade { from { opacity: 0; } }
    .dialog { width: min(440px, 100%); padding: 24px; display: flex; flex-direction: column; gap: 12px; }
    .actions { justify-content: flex-end; margin-top: 8px; }`],
})
export class ConfirmDialogComponent {
  readonly confirm = inject(ConfirmService);
  reason = '';
  close(ok: boolean) {
    const r = this.reason;
    this.reason = '';
    this.confirm.close(ok, r);
  }
}
