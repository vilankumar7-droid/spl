import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FeatureStatus } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icon.component';
import { LAYERS } from './platform-data';

const STAGES: Record<string, string> = {
  A: 'Authentication & Personal Loan', B: 'Home Loan & shared UI', C: 'Document processing (Python)',
  D: 'Kafka events & dashboard', E: 'Background verification', F: 'Elastic, Splunk & integration',
};

@Component({
  selector: 'app-platform',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Architecture & features</h1><p class="muted">How the platform is layered, and which capabilities are switched on in this environment.</p></div>
      </div>

      <div class="grid grid-main">
        <div class="card">
          <div class="card-header"><div><h2>Platform layers</h2><p class="muted small">Each layer has one responsibility. The browser never talks to Kafka or the database directly.</p></div></div>
          <div class="card-body layers">
            @for (l of layers; track l.name) {
              <div class="layer {{ l.status }}">
                <div class="lhead">
                  <div><div class="strong">{{ l.name }}</div><div class="muted small">{{ l.tech }}</div></div>
                  <span class="badge" [class.tone-success]="l.status === 'live'" [class.tone-warning]="l.status === 'partial'" [class.tone-neutral]="l.status === 'planned'">
                    {{ l.status === 'live' ? 'Live' : l.status === 'partial' ? 'Partially live' : 'Planned' }}</span>
                </div>
                <div class="row wrap">@for (i of l.items; track i) { <span class="chip">{{ i }}</span> }</div>
              </div>
            }
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <div class="card-header"><div><h2>Feature toggles</h2><p class="muted small">{{ enabledCount() }} of {{ features().length }} enabled · enforced by the backend</p></div><app-icon name="toggle" /></div>
            <div class="card-body stack-sm">
              @for (f of features(); track f.key) {
                <div class="feature">
                  <span class="switch" [class.on]="f.enabled" role="img" [attr.aria-label]="f.enabled ? 'Enabled' : 'Disabled'"><span></span></span>
                  <div class="spacer"><div class="strong">{{ f.label }}</div><div class="muted small">{{ f.description }}</div></div>
                  <span class="chip">Stage {{ f.stage }}</span>
                </div>
              }
              <p class="muted small" style="margin-top:8px">Toggles come from server configuration (<span class="mono">platform.features.*</span>). Changing browser state cannot enable a feature.</p>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h2>Delivery stages</h2></div>
            <div class="card-body">
              <ol class="stages">
                @for (s of stageList(); track s.key) {
                  <li [class.done]="s.done"><span class="sk">{{ s.key }}</span><div><div class="strong">{{ s.label }}</div><div class="muted small">{{ s.done ? 'Enabled' : 'Not started / disabled' }}</div></div></li>
                }
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  styles: [`
    .layers { display: flex; flex-direction: column; gap: 10px; }
    .layer { border: 1px solid var(--ink-200); border-left: 4px solid var(--success); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
    .layer.partial { border-left-color: var(--warning); } .layer.planned { border-left-color: var(--ink-300); background: var(--ink-50); }
    .lhead { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .feature { display: flex; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--ink-100); }
    .feature:last-of-type { border-bottom: none; }
    .switch { width: 36px; height: 20px; border-radius: 99px; background: var(--ink-300); position: relative; flex-shrink: 0; }
    .switch span { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left .2s; box-shadow: var(--shadow-sm); }
    .switch.on { background: var(--success); } .switch.on span { left: 18px; }
    .stages { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .stages li { display: flex; gap: 12px; align-items: center; }
    .sk { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; font-weight: 700; background: var(--ink-100); color: var(--ink-500); }
    .stages li.done .sk { background: var(--success); color: #fff; }`],
})
export class PlatformComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly layers = LAYERS;
  readonly features = signal<FeatureStatus[]>([]);
  readonly enabledCount = computed(() => this.features().filter(f => f.enabled).length);
  readonly stageList = computed(() => Object.entries(STAGES).map(([key, label]) => {
    const fs = this.features().filter(f => f.stage === key);
    return { key, label, done: fs.length > 0 && fs.every(f => f.enabled) };
  }));

  ngOnInit() { this.api.features().subscribe(f => this.features.set(f)); }
}
