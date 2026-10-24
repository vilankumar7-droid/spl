import { Routes } from '@angular/router';
import { authGuard, guestGuard, staffGuard } from './core/guards/guards';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent), title: 'Sign in · Student Finance' },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent), title: 'Create account · Student Finance' },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), title: 'Dashboard · Student Finance' },
      { path: 'loans', loadComponent: () => import('./features/loans/loan-list.component').then(m => m.LoanListComponent), title: 'My applications · Student Finance' },
      { path: 'loans/new', loadComponent: () => import('./features/loans/loan-wizard.component').then(m => m.LoanWizardComponent), title: 'New application · Student Finance' },
      { path: 'loans/:id/edit', loadComponent: () => import('./features/loans/loan-wizard.component').then(m => m.LoanWizardComponent), title: 'Edit application · Student Finance' },
      { path: 'loans/:id', loadComponent: () => import('./features/loans/loan-detail.component').then(m => m.LoanDetailComponent), title: 'Application · Student Finance' },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent), title: 'My profile · Student Finance' },
      { path: 'review', canActivate: [staffGuard], loadComponent: () => import('./features/review/review-queue.component').then(m => m.ReviewQueueComponent), title: 'Review queue · Student Finance' },
      { path: 'operations', canActivate: [staffGuard], loadComponent: () => import('./features/operations/operations.component').then(m => m.OperationsComponent), title: 'Event operations · Student Finance' },
      { path: 'platform', loadComponent: () => import('./features/platform/platform.component').then(m => m.PlatformComponent), title: 'Architecture · Student Finance' },
      { path: 'modules/:key', loadComponent: () => import('./features/modules/module-preview.component').then(m => m.ModulePreviewComponent), title: 'Module · Student Finance' },
    ],
  },
  { path: '**', redirectTo: '' },
];
