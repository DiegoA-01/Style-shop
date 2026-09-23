import { Injectable, signal } from '@angular/core';

// Cuenta cuántas peticiones HTTP hay en vuelo; isLoading() es true mientras haya al menos una.
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = signal(0);
  isLoading = signal(false);

  start(): void {
    this.pending.update(n => n + 1);
    this.isLoading.set(true);
  }

  stop(): void {
    this.pending.update(n => Math.max(0, n - 1));
    this.isLoading.set(this.pending() > 0);
  }
}
