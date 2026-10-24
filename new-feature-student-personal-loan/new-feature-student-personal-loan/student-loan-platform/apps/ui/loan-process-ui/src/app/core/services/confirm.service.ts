import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string; message: string; confirmText?: string; danger?: boolean; withReason?: boolean;
  resolve: (result: { confirmed: boolean; reason?: string }) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly current = signal<ConfirmRequest | null>(null);

  ask(opts: Omit<ConfirmRequest, 'resolve'>): Promise<{ confirmed: boolean; reason?: string }> {
    return new Promise(resolve => this.current.set({ ...opts, resolve }));
  }

  close(confirmed: boolean, reason?: string) {
    const req = this.current();
    this.current.set(null);
    req?.resolve({ confirmed, reason });
  }
}
