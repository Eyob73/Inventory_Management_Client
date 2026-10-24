import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ConnectionService } from '../../services/connection.service';

@Component({
  selector: 'app-reconnected-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="reconnected-banner" role="status" aria-live="polite">
      <div class="banner-pill">
        <div class="icon-wrap">
          <mat-icon>cloud_done</mat-icon>
        </div>
        <div class="banner-content">
          <span class="banner-title">Back Online</span>
          <span class="banner-subtitle">Connection restored.</span>
        </div>
        <button type="button" class="dismiss-btn" (click)="dismiss()" aria-label="Dismiss">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .reconnected-banner {
      position: fixed;
      top: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10001;
      pointer-events: auto;
      animation: bannerSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .banner-pill {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.85rem 0.5rem 0.65rem;
      background: var(--surface, #ffffff);
      border: 1px solid var(--moss, #5b7553);
      border-radius: 9999px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(91, 117, 83, 0.15);
      color: var(--ink, #0a0a0a);
    }

    .icon-wrap {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--moss-soft, #eaefe6);
      color: var(--moss, #5b7553);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
      }
    }

    .banner-content {
      display: flex;
      flex-direction: column;
      line-height: 1.2;

      .banner-title {
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--moss, #5b7553);
      }

      .banner-subtitle {
        font-size: 0.7125rem;
        color: var(--slate, #6b6b6b);
      }
    }

    .dismiss-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--slate, #6b6b6b);
      padding: 0.2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, color 0.15s ease;

      &:hover {
        background: var(--paper, #f5f5f4);
        color: var(--ink, #0a0a0a);
      }

      mat-icon {
        font-size: 0.95rem;
        width: 0.95rem;
        height: 0.95rem;
      }
    }

    @keyframes bannerSlideDown {
      from {
        opacity: 0;
        transform: translate(-50%, -20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
      }
    }
  `],
})
export class ReconnectedBannerComponent {
  private readonly connectionService = inject(ConnectionService);

  dismiss(): void {
    this.connectionService.showReconnectedBanner.set(false);
  }
}
