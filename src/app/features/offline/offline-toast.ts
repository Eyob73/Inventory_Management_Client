import { Component, inject, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConnectionService } from '../../services/connection.service';

@Component({
  selector: 'app-offline-toast',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVisible()) {
      <div class="offline-toast" [class.toast-server-issue]="isApiUnreachable()" role="alert" aria-live="assertive">
        <div class="toast-card">
          <!-- Icon with pulsing dot -->
          <div class="icon-wrap">
            <span class="pulsing-dot"></span>
            <mat-icon>{{ isApiUnreachable() ? 'cloud_off' : 'wifi_off' }}</mat-icon>
          </div>

          <!-- Main message content -->
          <div class="toast-body">
            <div class="toast-title-row">
              <span class="toast-title">{{ title() }}</span>
              <span class="toast-badge">{{ isApiUnreachable() ? 'Server Issue' : 'Offline' }}</span>
            </div>
            <p class="toast-desc">{{ description() }}</p>
          </div>

          <!-- Actions -->
          <div class="toast-actions">
            <button
              type="button"
              class="retry-btn"
              [disabled]="isChecking()"
              (click)="retry()"
              title="Retry connection now">
              @if (isChecking()) {
                <mat-spinner diameter="14" class="inline-spinner"></mat-spinner>
                <span>Checking…</span>
              } @else {
                <mat-icon class="retry-icon">refresh</mat-icon>
                <span>Retry</span>
              }
            </button>

            <a routerLink="/offline" class="details-link" title="Open full diagnostics">
              Details
            </a>

            <button type="button" class="dismiss-btn" (click)="dismiss()" aria-label="Dismiss offline message">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .offline-toast {
      position: fixed;
      top: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10001;
      width: calc(100% - 2rem);
      max-width: 540px;
      pointer-events: auto;
      animation: toastSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .toast-card {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem 1rem;
      background: var(--surface, #ffffff);
      border: 1px solid rgba(220, 38, 38, 0.35);
      border-radius: 14px;
      box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.16), 0 4px 10px -2px rgba(220, 38, 38, 0.12);
      color: var(--ink, #0a0a0a);
      transition: all 0.2s ease;

      @media (max-width: 520px) {
        flex-wrap: wrap;
        gap: 0.65rem;
        padding: 0.75rem 0.85rem;
      }
    }

    .toast-server-issue .toast-card {
      border-color: rgba(217, 119, 6, 0.4);
      box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.16), 0 4px 10px -2px rgba(217, 119, 6, 0.12);
    }

    .icon-wrap {
      position: relative;
      width: 38px;
      height: 38px;
      min-width: 38px;
      border-radius: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }
    }

    .toast-server-issue .icon-wrap {
      background: #fffbeb;
      border-color: #fde68a;
      color: #d97706;
    }

    .pulsing-dot {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #dc2626;
      box-shadow: 0 0 0 2px var(--surface, #ffffff);
      animation: pulseAlert 1.8s infinite ease-in-out;
    }

    .toast-server-issue .pulsing-dot {
      background: #d97706;
    }

    .toast-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;

      .toast-title-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .toast-title {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--ink, #0a0a0a);
        line-height: 1.25;
      }

      .toast-badge {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        padding: 0.1rem 0.45rem;
        border-radius: 4px;
        background: #fee2e2;
        color: #991b1b;
      }

      .toast-desc {
        font-size: 0.775rem;
        color: var(--slate, #6b6b6b);
        margin: 0;
        line-height: 1.35;
        white-space: normal;
      }
    }

    .toast-server-issue .toast-badge {
      background: #fef3c7;
      color: #92400e;
    }

    .toast-actions {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      flex-shrink: 0;

      @media (max-width: 520px) {
        width: 100%;
        justify-content: flex-end;
        padding-top: 0.25rem;
        border-top: 1px solid var(--line, #e1e1df);
      }
    }

    .retry-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.35rem 0.7rem;
      font-size: 0.775rem;
      font-weight: 600;
      background: var(--moss, #5b7553);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease;

      &:hover:not(:disabled) {
        background: #4a6143;
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .retry-icon {
        font-size: 0.95rem;
        width: 0.95rem;
        height: 0.95rem;
      }

      .inline-spinner {
        display: inline-block;
      }
    }

    .details-link {
      font-size: 0.775rem;
      font-weight: 500;
      color: var(--slate, #6b6b6b);
      text-decoration: underline;
      padding: 0.25rem 0.4rem;
      border-radius: 6px;
      transition: color 0.15s ease;

      &:hover {
        color: var(--ink, #0a0a0a);
      }
    }

    .dismiss-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--slate, #6b6b6b);
      padding: 0.25rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, color 0.15s ease;

      &:hover {
        background: var(--paper, #f5f5f4);
        color: var(--ink, #0a0a0a);
      }

      mat-icon {
        font-size: 1.05rem;
        width: 1.05rem;
        height: 1.05rem;
      }
    }

    @keyframes toastSlideDown {
      from {
        opacity: 0;
        transform: translate(-50%, -18px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
      }
    }

    @keyframes pulseAlert {
      0%, 100% {
        transform: scale(0.9);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.4);
        opacity: 0.3;
      }
    }
  `],
})
export class OfflineToastComponent {
  protected readonly connectionService = inject(ConnectionService);

  private readonly isDismissed = signal<boolean>(false);

  readonly isApiUnreachable = computed(() => this.connectionService.isApiUnreachable());
  readonly isChecking = computed(() => this.connectionService.isChecking());

  readonly isVisible = computed(() => {
    return this.connectionService.isDisconnected() && !this.isDismissed();
  });

  readonly title = computed(() => {
    return this.isApiUnreachable() ? 'Server Unreachable' : "You're Offline";
  });

  readonly description = computed(() => {
    return this.isApiUnreachable()
      ? 'Application server is temporarily unavailable. Retrying...'
      : 'Internet connection lost. Changes may not be saved.';
  });

  constructor() {
    // Whenever status changes, reset dismissed state so new connection drops are always shown
    effect(() => {
      const status = this.connectionService.status();
      if (status !== 'online') {
        this.isDismissed.set(false);
      }
    });
  }

  async retry(): Promise<void> {
    await this.connectionService.checkConnectivity(true);
  }

  dismiss(): void {
    this.isDismissed.set(true);
  }
}
