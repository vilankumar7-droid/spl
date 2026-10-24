import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; kind: 'success' | 'error' | 'info'; title: string; message?: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private next = 1;

  success(title: string, message?: string) { this.push('success', title, message); }
  error(title: string, message?: string) { this.push('error', title, message, 7000); }
  info(title: string, message?: string) { this.push('info', title, message); }

  dismiss(id: number) { this.toasts.update(list => list.filter(t => t.id !== id)); }

  private push(kind: Toast['kind'], title: string, message?: string, ttl = 4500) {
    const id = this.next++;
    this.toasts.update(list => [...list, { id, kind, title, message }]);
    setTimeout(() => this.dismiss(id), ttl);
  }
}
