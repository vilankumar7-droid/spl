import { FormBuilder, Validators } from '@angular/forms';
import { EmploymentType } from '../../core/models';

/** Shared reactive form definition for the applicant profile (used by Profile page and wizard step 1). */
export function buildProfileForm(fb: FormBuilder) {
  return fb.group({
    fullName: fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    phone: fb.nonNullable.control('', [Validators.required, Validators.pattern(/^\+?[0-9 -]{7,20}$/)]),
    city: fb.nonNullable.control('', [Validators.maxLength(80)]),
    employmentType: fb.control<EmploymentType | null>(null, Validators.required),
    institutionName: fb.nonNullable.control('', [Validators.maxLength(120)]),
    monthlyIncome: fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(10000000)]),
  });
}

export type ProfileForm = ReturnType<typeof buildProfileForm>;
