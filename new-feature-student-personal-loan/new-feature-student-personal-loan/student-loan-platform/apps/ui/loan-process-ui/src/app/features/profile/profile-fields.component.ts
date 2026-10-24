import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EMPLOYMENT_LABELS } from '../../core/labels';
import { EmploymentType } from '../../core/models';
import { ProfileForm } from './profile-form';

@Component({
  selector: 'app-profile-fields',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="grid grid-2" [formGroup]="form()">
      <div class="field">
        <label for="fullName">Full name *</label>
        <input id="fullName" class="input" formControlName="fullName" [class.invalid]="bad('fullName')" />
        @if (bad('fullName')) { <span class="error">Full name is required</span> }
      </div>
      <div class="field">
        <label for="phone">Phone number *</label>
        <input id="phone" class="input" formControlName="phone" placeholder="+91 98765 43210" [class.invalid]="bad('phone')" />
        @if (bad('phone')) { <span class="error">Enter a valid phone number</span> }
      </div>
      <div class="field">
        <label for="city">City</label>
        <input id="city" class="input" formControlName="city" placeholder="e.g. Pune" />
      </div>
      <div class="field">
        <label for="institution">College / university</label>
        <input id="institution" class="input" formControlName="institutionName" placeholder="e.g. Demo Institute of Technology" />
      </div>
      <div class="field full">
        <label>Employment status *</label>
        <div class="options">
          @for (e of employmentTypes; track e.value) {
            <label class="option" [class.selected]="form().controls.employmentType.value === e.value">
              <input type="radio" formControlName="employmentType" [value]="e.value" /> {{ e.label }}
            </label>
          }
        </div>
        @if (bad('employmentType')) { <span class="error">Select your employment status</span> }
      </div>
      <div class="field">
        <label for="income">Monthly income (₹) *</label>
        <div class="input-group">
          <span class="prefix">₹</span>
          <input id="income" class="input" type="number" min="0" formControlName="monthlyIncome" placeholder="0" [class.invalid]="bad('monthlyIncome')" />
        </div>
        <span class="hint">Include stipend, part-time pay or allowance. Enter 0 if none.</span>
        @if (bad('monthlyIncome')) { <span class="error">Enter your monthly income (0 or more)</span> }
      </div>
    </div>`,
  styles: [`
    .full { grid-column: 1 / -1; }
    .options { display: flex; flex-wrap: wrap; gap: 8px; }
    .option { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border: 1px solid var(--ink-300); border-radius: 10px; cursor: pointer; font-weight: 500 !important; color: var(--ink-700); background: #fff; }
    .option input { accent-color: var(--brand-600); }
    .option.selected { border-color: var(--brand-500); background: var(--brand-50); color: var(--brand-700); }`],
})
export class ProfileFieldsComponent {
  readonly form = input.required<ProfileForm>();
  readonly submitted = input(false);
  readonly employmentTypes = (Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map(value => ({ value, label: EMPLOYMENT_LABELS[value] }));

  bad(name: keyof ProfileForm['controls']) {
    const c = this.form().controls[name];
    return c.invalid && (c.touched || this.submitted());
  }
}
