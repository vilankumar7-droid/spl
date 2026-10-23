import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { authGuard, staffGuard } from './guards';

describe('route guards', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  });

  it('redirects anonymous users to /login with a return URL', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/loans' } as never)) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?returnUrl=%2Floans');
  });

  it('keeps students out of staff pages', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.isStaff()).toBeFalse();
    const result = TestBed.runInInjectionContext(() => staffGuard({} as never, {} as never)) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/dashboard');
  });
});
