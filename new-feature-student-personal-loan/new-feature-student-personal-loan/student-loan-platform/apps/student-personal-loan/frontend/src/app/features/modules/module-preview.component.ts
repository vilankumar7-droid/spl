import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeatureStatus } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icon.component';
import { MODULES } from '../platform/platform-data';

/** Landing page for platform modules that are planned for later stages (controlled by feature toggles). */
@Component({
  selector: 'app-module-preview',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" style="max-width:860px">
      @if (module(); as m) {
        <div class="card hero">
          <div class="ic"><app-icon [name]="m.icon" [size]="28" /></div>
          <div class="row"><h1>{{ m.title }}</h1>
            <span class="badge" [class.tone-success]="enabled()" [class.tone-neutral]="!enabled()">{{ enabled() ? 'Enabled' : 'Coming in Stage ' + m.stage }}</span></div>
          <p class="muted lead">{{ m.summary }}</p>
          <ul>@for (b of m.bullets; track b) { <li><app-icon name="check" [size]="16" /> {{ b }}</li> }</ul>
          @if (!enabled()) {
            <div class="alert alert-info"><app-icon name="lock" />
              <div>This module is switched off by the <span class="mono">{{ m.feature }}</span> feature toggle. It will be built after the Personal Loan application is completed and tagged, following the incremental delivery plan.</div></div>
          }
          <div class="row"><a class="btn btn-secondary" routerLink="/platform"><app-icon name="layers" [size]="16" /> View architecture</a>
            <a class="btn btn-primary" routerLink="/dashboard">Back to dashboard</a></div>
        </div>
      } @else {
        <div class="alert alert-warning">Unknown module.</div>
      }
    </div>`,
  styles: [`
    .hero { padding: 36px; display: flex; flex-direction: column; gap: 16px; }
    .ic { width: 60px; height: 60px; border-radius: 16px; background: var(--brand-50); color: var(--brand-600); display: grid; place-items: center; }
    .lead { font-size: 15px; }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    li { display: flex; gap: 10px; align-items: center; } li app-icon { color: var(--success); }`],
})
export class ModulePreviewComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly key = input.required<string>();
  readonly features = signal<FeatureStatus[]>([]);
  readonly module = computed(() => MODULES[this.key()]);
  readonly enabled = computed(() => !!this.features().find(f => f.key === this.module()?.feature)?.enabled);
  ngOnInit() { this.api.features().subscribe(f => this.features.set(f)); }
}
