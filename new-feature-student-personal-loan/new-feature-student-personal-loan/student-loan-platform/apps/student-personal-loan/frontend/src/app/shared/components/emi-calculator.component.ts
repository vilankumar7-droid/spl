import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InrPipe } from '../pipes/format.pipes';
import { IconComponent } from './icon.component';

/** Client-side EMI estimate with the same formula as the backend EmiCalculator. */
export function calculateEmi(principal: number, months: number, annualRate: number) {
  if (!principal || !months || principal <= 0 || months <= 0) return { emi: 0, total: 0, interest: 0 };
  const r = annualRate / 1200;
  const emi = r === 0 ? principal / months : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  const total = emi * months;
  return { emi, total, interest: Math.max(total - principal, 0) };
}

export function affordability(emi: number, income: number | null | undefined) {
  if (!income || income <= 0) return null;
  const ratio = emi / income;
  if (ratio <= 0.3) return { ratio, label: 'Comfortable', tone: 'success', text: 'Repayments are within 30% of your monthly income.' };
  if (ratio <= 0.5) return { ratio, label: 'Manageable', tone: 'warning', text: 'Repayments take 30–50% of your income. Budget carefully.' };
  return { ratio, label: 'Stretched', tone: 'danger', text: 'Repayments exceed half of your income. Consider a smaller amount or longer tenure.' };
}

@Component({
  selector: 'app-emi-calculator',
  standalone: true,
  imports: [FormsModule, InrPipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="calc">
      @if (showInputs()) {
        <div class="stack">
          <div class="field">
            <div class="row"><label>Loan amount</label><span class="spacer"></span><span class="value">{{ amount() | inr }}</span></div>
            <input type="range" min="10000" max="2000000" step="5000" [ngModel]="amount()" (ngModelChange)="amount.set(+$event)" aria-label="Loan amount" />
          </div>
          <div class="field">
            <div class="row"><label>Tenure</label><span class="spacer"></span><span class="value">{{ tenure() }} months</span></div>
            <input type="range" min="6" max="84" step="6" [ngModel]="tenure()" (ngModelChange)="tenure.set(+$event)" aria-label="Tenure" />
          </div>
          <div class="field">
            <div class="row"><label>Interest rate (p.a.)</label><span class="spacer"></span><span class="value">{{ rate() }}%</span></div>
            <input type="range" min="1" max="30" step="0.25" [ngModel]="rate()" (ngModelChange)="rate.set(+$event)" aria-label="Interest rate" />
          </div>
        </div>
      }
      <div class="result">
        <div class="emi-label">Estimated monthly EMI</div>
        <div class="emi">{{ result().emi | inr }}</div>
        <div class="split">
          <div><span class="dot principal"></span>Principal <strong>{{ amount() | inr }}</strong></div>
          <div><span class="dot interest"></span>Interest <strong>{{ result().interest | inr }}</strong></div>
        </div>
        <div class="bar"><span [style.width.%]="principalShare()"></span></div>
        <div class="muted small">Total payable {{ result().total | inr }}</div>
        @if (afford(); as a) {
          <div class="afford tone-{{ a.tone }}">
            <app-icon name="info" [size]="16" />
            <div><strong>{{ a.label }}</strong> · {{ (a.ratio * 100).toFixed(0) }}% of income<br /><span class="small">{{ a.text }}</span></div>
          </div>
        }
      </div>
      <p class="muted small disclaimer">Educational estimate only — not a credit decision or loan offer.</p>
    </div>`,
  styles: [`
    .calc { display: flex; flex-direction: column; gap: 18px; }
    .value { font-weight: 700; color: var(--brand-700); }
    .result { background: linear-gradient(135deg, var(--brand-50), #fff); border: 1px solid var(--brand-100); border-radius: var(--radius); padding: 18px; display: flex; flex-direction: column; gap: 10px; }
    .emi-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-500); }
    .emi { font-size: 30px; font-weight: 700; color: var(--brand-700); letter-spacing: -.02em; }
    .split { display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; color: var(--ink-700); }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
    .principal { background: var(--brand-600); } .interest { background: #f2a93b; }
    .bar { height: 8px; border-radius: 99px; background: #f2a93b; overflow: hidden; } .bar span { display: block; height: 100%; background: var(--brand-600); }
    .afford { display: flex; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); font-size: 13px; align-items: flex-start; }
    .disclaimer { text-align: center; }`],
})
export class EmiCalculatorComponent {
  readonly amount = model(200000);
  readonly tenure = model(36);
  readonly rate = model(10.5);
  readonly monthlyIncome = input<number | null>(null);
  readonly showInputs = input(true);
  readonly result = computed(() => calculateEmi(this.amount(), this.tenure(), this.rate()));
  readonly afford = computed(() => affordability(this.result().emi, this.monthlyIncome()));
  readonly principalShare = computed(() => {
    const r = this.result();
    return r.total ? (this.amount() / r.total) * 100 : 100;
  });
}
