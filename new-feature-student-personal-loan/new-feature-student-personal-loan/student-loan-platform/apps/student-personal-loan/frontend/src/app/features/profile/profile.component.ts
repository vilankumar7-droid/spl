import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Applicant } from '../../core/models';
import { ApiService, problemOf } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon.component';
import { buildProfileForm } from './profile-form';
import { ProfileFieldsComponent } from './profile-fields.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, ProfileFieldsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" style="max-width:880px">
      <div class="page-header">
        <div><h1>My profile</h1><p class="muted">Used to pre-fill your applications. Please use synthetic demo details only.</p></div>
        @if (applicant()) {
          <span class="badge" [class.tone-success]="applicant()!.profileComplete" [class.tone-warning]="!applicant()!.profileComplete">
            {{ applicant()!.profileComplete ? 'Profile complete' : 'Profile incomplete' }}
          </span>
        }
      </div>
      <form class="card" (ngSubmit)="save()">
        <div class="card-body">
          @if (loading()) { <div class="skeleton" style="height:260px"></div> }
          @else { <app-profile-fields [form]="form" [submitted]="submitted()" /> }
        </div>
        <div class="card-header" style="border-top:1px solid var(--ink-100);border-bottom:none;justify-content:flex-end">
          <button class="btn btn-primary" type="submit" [disabled]="saving() || loading()">
            @if (saving()) { <span class="spinner"></span> Saving… } @else { <app-icon name="check" [size]="16" /> Save profile }
          </button>
        </div>
      </form>
    </div>`,
})
export class ProfileComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly form = buildProfileForm(inject(FormBuilder));
  readonly applicant = signal<Applicant | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly submitted = signal(false);

  ngOnInit() {
    this.api.myApplicant().subscribe({
      next: a => { this.applicant.set(a); this.form.patchValue(a as never); this.loading.set(false); },
      error: e => { this.toast.error('Could not load profile', problemOf(e).detail); this.loading.set(false); },
    });
  }

  save() {
    this.submitted.set(true);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.api.saveApplicant(this.form.getRawValue() as Partial<Applicant>).subscribe({
      next: a => { this.applicant.set(a); this.saving.set(false); this.toast.success('Profile saved'); },
      error: e => { this.saving.set(false); this.toast.error('Could not save profile', problemOf(e).detail); },
    });
  }
}
