import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User } from '../models';

const STORAGE_KEY = 'slp.session';

interface Session { token: string; expiresAt: string; user: User; }

/**
 * Holds the short-lived access token. sessionStorage (not localStorage) is used so the token
 * disappears when the tab closes. The backend remains the authority for every permission check.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = signal<Session | null>(this.restore());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly isStaff = computed(() => ['REVIEWER', 'ADMIN'].includes(this.user()?.role ?? ''));
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  get token(): string | null {
    const s = this.session();
    if (!s) return null;
    if (new Date(s.expiresAt).getTime() <= Date.now()) {
      this.clear();
      return null;
    }
    return s.token;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/v1/auth/login', { email, password }).pipe(tap(r => this.store(r)));
  }

  register(displayName: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/v1/auth/register', { displayName, email, password })
      .pipe(tap(r => this.store(r)));
  }

  logout(reason?: 'expired'): void {
    this.clear();
    this.router.navigate(['/login'], reason ? { queryParams: { reason } } : {});
  }

  private store(r: AuthResponse): void {
    const s: Session = { token: r.accessToken, expiresAt: r.expiresAt, user: r.user };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    this.session.set(s);
  }

  private clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  private restore(): Session | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const s = raw ? (JSON.parse(raw) as Session) : null;
      return s && new Date(s.expiresAt).getTime() > Date.now() ? s : null;
    } catch {
      return null;
    }
  }
}
