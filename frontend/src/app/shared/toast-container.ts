import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [],
  template: `
    <div class="toast-stack" role="status" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class.toast-error]="toast.type === 'error'">
          <span>{{ toast.message }}</span>
          <button type="button" aria-label="Cerrar" (click)="toastService.dismiss(toast.id)">&times;</button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-container.css',
})
export class ToastContainer {
  protected toastService = inject(ToastService);
}
