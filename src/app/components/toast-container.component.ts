import { Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" role="status">
          <app-icon [name]="toastIcon(toast.type)" [size]="16" />
          <span class="toast__message">{{ toast.message }}</span>
          <button
            type="button"
            class="toast__dismiss"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Fechar notificação"
          >
            <app-icon name="x-icon" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid transparent;
      background: #ffffff;
      box-shadow: 0 8px 24px rgba(15,23,42,0.14);
      font-size: 14px;
      font-weight: 600;
      pointer-events: all;
      animation: toast-in 200ms ease;
    }
    .toast--success { border-color: #b7dfbb; color: #1f6b34; background: #f0faf2; }
    .toast--error   { border-color: #f5c0b8; color: #9e2f20; background: #fdf3f1; }
    .toast--warning { border-color: #f5d88a; color: #735200; background: #fffbeb; }
    .toast--info    { border-color: #9dd1db; color: #005f78; background: #f0fafc; }
    .toast__message { flex: 1; line-height: 1.4; }
    .toast__dismiss {
      display: inline-flex;
      align-items: center;
      padding: 2px;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      opacity: 0.55;
      flex-shrink: 0;
    }
    .toast__dismiss:hover { opacity: 1; }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  protected toastIcon(type: ToastType): string {
    const icons: Record<ToastType, string> = {
      success: 'check',
      error: 'alert',
      warning: 'alert',
      info: 'clock',
    };
    return icons[type];
  }
}
