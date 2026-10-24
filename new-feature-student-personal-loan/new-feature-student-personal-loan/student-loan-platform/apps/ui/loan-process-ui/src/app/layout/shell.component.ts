import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { FeatureStatus } from '../core/models';
import { ApiService } from '../core/services/api.service';
import { IconComponent } from '../shared/components/icon.component';

interface NavItem { label: string; icon: string; link: string; feature?: string; staffOnly?: boolean; exact?: boolean; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout" [class.nav-open]="navOpen()">
      <aside class="sidebar">
        <a class="brand" routerLink="/dashboard">
          <span class="logo"><app-icon name="school" [size]="20" /></span>
          <span><strong>Student Finance</strong><small>Loan Platform · Demo</small></span>
        </a>

        <nav>
          <div class="section">Personal Loan</div>
          @for (item of mainNav; track item.link) {
            <a [routerLink]="item.link" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: !!item.exact }" class="nav-item">
              <app-icon [name]="item.icon" /> {{ item.label }}
            </a>
          }

          @if (auth.isStaff()) {
            <div class="section">Operations</div>
            @for (item of staffNav; track item.link) {
              <a [routerLink]="item.link" routerLinkActive="active" class="nav-item"><app-icon [name]="item.icon" /> {{ item.label }}</a>
            }
          }

          <div class="section">Platform modules</div>
          @for (item of moduleNav; track item.link) {
            <a [routerLink]="item.link" routerLinkActive="active" class="nav-item">
              <app-icon [name]="item.icon" /> {{ item.label }}
              @if (!isEnabled(item.feature)) { <span class="soon">Soon</span> }
            </a>
          }
          <a routerLink="/platform" routerLinkActive="active" class="nav-item"><app-icon name="layers" /> Architecture & features</a>
        </nav>

        <div class="user-card">
          <div class="avatar">{{ initials() }}</div>
          <div class="who">
            <div class="name">{{ auth.user()?.displayName }}</div>
            <div class="role">{{ roleLabel() }}</div>
          </div>
          <button class="btn btn-ghost btn-sm icon-btn" (click)="auth.logout()" title="Sign out" aria-label="Sign out"><app-icon name="logout" [size]="16" /></button>
        </div>
      </aside>

      <div class="backdrop" (click)="navOpen.set(false)"></div>

      <div class="main">
        <header class="topbar">
          <button class="btn btn-ghost btn-sm menu" (click)="navOpen.set(!navOpen())" aria-label="Menu"><app-icon name="menu" /></button>
          <div class="demo"><app-icon name="info" [size]="14" /> Educational demo · all data is synthetic · decisions are simulated</div>
          <span class="spacer"></span>
          @if (!auth.isStaff()) {
            <a class="btn btn-primary btn-sm" routerLink="/loans/new"><app-icon name="plus" [size]="16" /> New application</a>
          }
        </header>
        <main><router-outlet /></main>
      </div>
    </div>`,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: var(--sidebar-w); background: #0f172a; color: #cbd5e1; display: flex; flex-direction: column; position: fixed; inset: 0 auto 0 0; z-index: 50; transition: transform .2s; }
    .brand { display: flex; gap: 12px; align-items: center; padding: 22px 20px; color: #fff; text-decoration: none !important; }
    .brand small { display: block; color: #94a3b8; font-size: 12px; }
    .logo { width: 38px; height: 38px; border-radius: 11px; background: linear-gradient(135deg, #6d8bff, #3b54d9); display: grid; place-items: center; color: #fff; }
    nav { flex: 1; overflow-y: auto; padding: 4px 12px; }
    .section { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; padding: 18px 10px 8px; font-weight: 600; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 9px 10px; border-radius: 9px; color: #cbd5e1; font-weight: 500; text-decoration: none !important; margin-bottom: 2px; }
    .nav-item:hover { background: rgba(255,255,255,.06); color: #fff; }
    .nav-item.active { background: rgba(109,139,255,.18); color: #fff; box-shadow: inset 3px 0 0 #6d8bff; }
    .soon { margin-left: auto; font-size: 10.5px; padding: 1px 7px; border-radius: 99px; background: rgba(255,255,255,.08); color: #94a3b8; font-weight: 600; }
    .user-card { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-top: 1px solid rgba(255,255,255,.08); }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: #334155; color: #fff; display: grid; place-items: center; font-weight: 600; font-size: 13px; }
    .who { flex: 1; min-width: 0; } .name { color: #fff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .role { font-size: 12px; color: #94a3b8; }
    .icon-btn { color: #94a3b8; } .icon-btn:hover { background: rgba(255,255,255,.08) !important; color: #fff; }
    .main { flex: 1; margin-left: var(--sidebar-w); min-width: 0; display: flex; flex-direction: column; }
    .topbar { height: 60px; display: flex; align-items: center; gap: 12px; padding: 0 32px; background: rgba(255,255,255,.85); backdrop-filter: blur(8px); border-bottom: 1px solid var(--ink-200); position: sticky; top: 0; z-index: 40; }
    .demo { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--ink-500); background: var(--ink-100); padding: 5px 10px; border-radius: 99px; }
    .menu { display: none; } .backdrop { display: none; }
    @media (max-width: 900px) {
      .sidebar { transform: translateX(-100%); } .nav-open .sidebar { transform: none; }
      .nav-open .backdrop { display: block; position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 45; }
      .main { margin-left: 0; } .menu { display: inline-flex; } .topbar { padding: 0 16px; } .demo { display: none; }
    }`],
})
export class ShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly navOpen = signal(false);
  readonly features = signal<FeatureStatus[]>([]);

  readonly mainNav: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', link: '/dashboard' },
    { label: 'My applications', icon: 'file', link: '/loans', exact: true },
    { label: 'My profile', icon: 'user', link: '/profile' },
  ];
  readonly staffNav: NavItem[] = [
    { label: 'Review queue', icon: 'shield', link: '/review' },
    { label: 'Event operations', icon: 'activity', link: '/operations' },
  ];
  readonly moduleNav: NavItem[] = [
    { label: 'Home Loan', icon: 'home', link: '/modules/home-loan', feature: 'home-loan' },
    { label: 'Document Center', icon: 'folder', link: '/modules/document-center', feature: 'pdf-processing-agent' },
    { label: 'Background checks', icon: 'search', link: '/modules/background-verification', feature: 'background-verification' },
  ];

  readonly initials = computed(() =>
    (this.auth.user()?.displayName ?? '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase());
  readonly roleLabel = computed(() =>
    ({ STUDENT: 'Student applicant', REVIEWER: 'Loan reviewer', ADMIN: 'Platform admin' } as Record<string, string>)[this.auth.user()?.role ?? ''] ?? '');

  ngOnInit() {
    this.api.features().subscribe({ next: f => this.features.set(f), error: () => {} });
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.navOpen.set(false));
  }

  isEnabled(key?: string) {
    return !key || !!this.features().find(f => f.key === key)?.enabled;
  }
}
