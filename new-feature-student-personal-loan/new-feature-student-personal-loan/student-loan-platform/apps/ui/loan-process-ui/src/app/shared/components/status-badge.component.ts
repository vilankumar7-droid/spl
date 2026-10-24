import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STATUS_META } from '../../core/labels';
import { LoanStatus } from '../../core/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge tone-{{ meta().tone }}" [attr.title]="meta().help">{{ meta().label }}</span>`,
})
export class StatusBadgeComponent {
  readonly status = input.required<LoanStatus>();
  readonly meta = computed(() => STATUS_META[this.status()]);
}
