import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { JOURNEY, journeyStep } from '../../core/labels';
import { LoanStatus } from '../../core/models';
import { IconComponent } from './icon.component';

/** Horizontal journey tracker: Profile → … → Decision. */
@Component({
  selector: 'app-loan-progress',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="steps" [class.compact]="compact()">
      @for (label of steps; track label; let i = $index) {
        <li [class.done]="i < current()" [class.current]="i === current()" [class.bad]="i === current() && isBad()">
          <span class="dot">
            @if (i < current() || (i === current() && isFinalGood())) { <app-icon name="check" [size]="14" /> }
            @else if (i === current() && isBad()) { <app-icon name="x" [size]="14" /> }
            @else { {{ i + 1 }} }
          </span>
          @if (!compact()) { <span class="label">{{ i === 6 ? decisionLabel() : label }}</span> }
        </li>
      }
    </ol>`,
  styles: [`
    .steps { list-style: none; margin: 0; padding: 0; display: flex; }
    li { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; font-size: 12px; color: var(--ink-500); text-align: center; }
    li:not(:first-child)::before { content: ''; position: absolute; top: 14px; right: 50%; width: 100%; height: 2px; background: var(--ink-200); z-index: 0; }
    li.done::before, li.current::before { background: var(--brand-500); }
    .dot { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: #fff; border: 2px solid var(--ink-200); font-weight: 600; z-index: 1; color: var(--ink-500); }
    li.done .dot { background: var(--brand-600); border-color: var(--brand-600); color: #fff; }
    li.current .dot { border-color: var(--brand-600); color: var(--brand-600); box-shadow: 0 0 0 4px var(--brand-100); }
    li.current .label { color: var(--ink-900); font-weight: 600; }
    li.current.bad .dot { border-color: var(--danger); color: var(--danger); box-shadow: 0 0 0 4px var(--danger-bg); }
    .compact .dot { width: 20px; height: 20px; font-size: 10px; } .compact li::before { top: 9px; }`],
})
export class LoanProgressComponent {
  readonly status = input.required<LoanStatus>();
  readonly compact = input(false);
  readonly steps = JOURNEY;
  readonly current = computed(() => Math.min(journeyStep(this.status()), 6));
  readonly isBad = computed(() => ['REJECTED', 'CANCELLED', 'NEEDS_CORRECTION'].includes(this.status()));
  readonly isFinalGood = computed(() => this.status() === 'APPROVED');
  readonly decisionLabel = computed(() =>
    ({ APPROVED: 'Approved', REJECTED: 'Rejected', CANCELLED: 'Cancelled' } as Record<string, string>)[this.status()] ?? 'Decision');
}
