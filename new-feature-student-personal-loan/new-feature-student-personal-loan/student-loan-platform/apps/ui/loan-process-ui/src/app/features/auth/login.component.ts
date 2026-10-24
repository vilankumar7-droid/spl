import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { problemOf } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthHeroComponent } from './auth-hero.component';

@Component({
  selector: 'app-login',
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
            <h2>Welcome back</h2>
            <p class="muted">Sign in to continue your application.</p>
          </div>

          @if (reason() === 'expired') {
            <div class="alert alert-warning"><app-icon name="clock" /> Your session expired. Please sign in again.</div>
          }
          @if (error()) { <div class="alert alert-danger" role="alert"><app-icon name="alert" /> {{ error() }}</div> }

          <div class="field">
            <label for="email">Email</label>
            <input id="email" class="input" type="email" formControlName="email" autocomplete="username" placeholder="you@example.com"
                   [class.invalid]="showError('email')" />
            @if (showError('email')) { <span class="error">Enter a valid email address</span> }
          </div>
          <div class="field">
            <label for="password">Password</label>
            <div class="pw">
              <input id="password" class="input" [type]="showPw() ? 'text' : 'password'" formControlName="password"
                     autocomplete="current-password" placeholder="••••••••" [class.invalid]="showError('password')" />
              <button type="button" (click)="showPw.set(!showPw())">{{ showPw() ? 'Hide' : 'Show' }}</button>
            </div>
            @if (showError('password')) { <span class="error">Password is required</span> }
          </div>

          <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> Signing in… } @else { Sign in <app-icon name="arrowRight" [size]="16" /> }
          </button>

          <p class="muted" style="text-align:center">New here? <a routerLink="/register">Create a student account</a></p>

          <div class="demo">
            <div class="strong small">Try a demo account</div>
            <div class="muted small">Synthetic users for exploring each role.</div>
            <div class="demo-buttons">
              <button type="button" class="btn btn-secondary btn-sm" (click)="useDemo('student@demo.local')"><app-icon name="user" [size]="14" /> Student</button>
              <button type="button" class="btn btn-secondary btn-sm" (click)="useDemo('reviewer@demo.local')"><app-icon name="shield" [size]="14" /> Reviewer</button>
              <button type="button" class="btn btn-secondary btn-sm" (click)="useDemo('admin@demo.local')"><app-icon name="toggle" [size]="14" /> Admin</button>
            </div>
          </div>
        </form>
      </div>
    </div>`,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly returnUrl = input<string>();
  readonly reason = input<string>();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPw = signal(false);
  private submitted = false;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  showError(name: 'email' | 'password') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted);
  }

  useDemo(email: string) {
    this.form.setValue({ email, password: 'Password@123' });
    this.submit();
  }

  submit() {
    this.submitted = true;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl() || '/dashboard'),
      error: err => { this.error.set(problemOf(err).detail); this.loading.set(false); },
    });
  }
}
