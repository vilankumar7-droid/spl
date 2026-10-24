import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { problemOf } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthHeroComponent } from './auth-hero.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, AuthHeroComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-layout.scss',
  template: `
    <div class="auth">
      <app-auth-hero />
      <div class="panel">
        <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <h2>Create your account</h2>
            <p class="muted">It takes less than a minute. Use demo details only.</p>
          </div>
          @if (error()) { <div class="alert alert-danger" role="alert"><app-icon name="alert" /> {{ error() }}</div> }

          <div class="field">
            <label for="name">Full name</label>
            <input id="name" class="input" formControlName="displayName" placeholder="Asha Sharma" [class.invalid]="bad('displayName')" />
            @if (bad('displayName')) { <span class="error">Please enter your name</span> }
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" class="input" type="email" formControlName="email" placeholder="you@example.com" autocomplete="username" [class.invalid]="bad('email')" />
            @if (bad('email')) { <span class="error">Enter a valid email address</span> }
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" class="input" type="password" formControlName="password" autocomplete="new-password" [class.invalid]="bad('password')" />
            <div class="strength"><span [style.width.%]="strength().pct" [style.background]="strength().color"></span></div>
            <span class="hint">{{ strength().label }} · at least 8 characters with letters and numbers</span>
            @if (bad('password')) { <span class="error">Password must be 8+ characters and include letters and numbers</span> }
          </div>

          <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> Creating account… } @else { Create account }
          </button>
          <p class="muted" style="text-align:center">Already registered? <a routerLink="/login">Sign in</a></p>
        </form>
      </div>
    </div>`,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private submitted = false;

  readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]],
  });

  private readonly pw = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  readonly strength = computed(() => {
    const p = this.pw();
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Za-z]/.test(p) && /\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) score++;
    return [
      { pct: 8, color: 'var(--ink-300)', label: 'Too short' },
      { pct: 35, color: 'var(--danger)', label: 'Weak' },
      { pct: 70, color: 'var(--warning)', label: 'Good' },
      { pct: 100, color: 'var(--success)', label: 'Strong' },
    ][score];
  });

  bad(name: 'displayName' | 'email' | 'password') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted);
  }

  submit() {
    this.submitted = true;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.auth.register(v.displayName, v.email, v.password).subscribe({
      next: () => { this.toast.success('Account created', 'Let’s set up your first application.'); this.router.navigate(['/dashboard']); },
      error: err => { this.error.set(problemOf(err).detail); this.loading.set(false); },
    });
  }
}
