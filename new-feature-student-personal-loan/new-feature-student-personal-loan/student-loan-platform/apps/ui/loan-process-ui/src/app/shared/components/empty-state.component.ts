import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <div class="icon"><app-icon [name]="icon()" [size]="26" /></div>
      <h3>{{ title() }}</h3>
      <p class="muted">{{ message() }}</p>
      <div class="actions"><ng-content /></div>
    </div>`,
  styles: [`
    .empty { text-align: center; padding: 48px 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .icon { width: 56px; height: 56px; border-radius: 16px; background: var(--brand-50); color: var(--brand-600); display: grid; place-items: center; margin-bottom: 6px; }
    p { max-width: 380px; } .actions { margin-top: 12px; }`],
})
export class EmptyStateComponent {
  readonly icon = input('file');
  readonly title = input.required<string>();
  readonly message = input('');
}
