import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast {{ t.kind }}" role="status">
          <span class="ic"><app-icon [name]="t.kind === 'success' ? 'check' : t.kind === 'error' ? 'alert' : 'info'" [size]="16" /></span>
          <div class="body"><div class="title">{{ t.title }}</div>@if (t.message) { <div class="msg">{{ t.message }}</div> }</div>
          <button class="close" (click)="toast.dismiss(t.id)" aria-label="Dismiss"><app-icon name="x" [size]="14" /></button>
        </div>
      }
    </div>`,
  styles: [`
    .toasts { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 10px; z-index: 1000; width: min(380px, calc(100vw - 32px)); }
    .toast { display: flex; gap: 12px; align-items: flex-start; background: #fff; border: 1px solid var(--ink-200); border-radius: 12px; padding: 12px 14px; box-shadow: 0 10px 30px rgba(17,24,39,.12); animation: in .2s ease-out; }
    @keyframes in { from { transform: translateY(8px); opacity: 0; } }
    .ic { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; flex-shrink: 0; }
    .success .ic { background: var(--success-bg); color: var(--success); } .error .ic { background: var(--danger-bg); color: var(--danger); } .info .ic { background: var(--info-bg); color: var(--info); }
    .body { flex: 1; } .title { font-weight: 600; } .msg { color: var(--ink-500); font-size: 13px; margin-top: 2px; }
    .close { border: none; background: none; color: var(--ink-400); cursor: pointer; padding: 2px; }`],
})
export class ToastContainerComponent {
  readonly toast = inject(ToastService);
}
