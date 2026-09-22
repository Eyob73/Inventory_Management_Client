import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="unauth-page">
      <div class="unauth-card">
        <div class="unauth-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" class="unauth-icon" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
            <path d="M12 7v5M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>

        <div class="unauth-code">403</div>
        <h1 class="unauth-title">Access Denied</h1>
        <p class="unauth-message">
          You don't have permission to view this page.
          @if (role()) {
            Your current role is <strong class="role-badge">{{ role() }}</strong>.
          }
        </p>

        <div class="unauth-actions">
          <a routerLink="/dashboard" class="btn btn--primary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .unauth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-bg, #0f172a);
      padding: 2rem;
    }

    .unauth-card {
      text-align: center;
      max-width: 460px;
      width: 100%;
      background: var(--card-bg, #1e293b);
      border: 1px solid var(--border, rgba(255,255,255,0.08));
      border-radius: 20px;
      padding: 3rem 2.5rem;
      box-shadow: 0 24px 64px rgba(0,0,0,0.4);
    }

    .unauth-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.15);
      margin: 0 auto 1.5rem;
      color: #ef4444;
    }

    .unauth-icon {
      width: 36px;
      height: 36px;
    }

    .unauth-code {
      font-size: 5rem;
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, #ef4444, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.75rem;
      font-family: inherit;
    }

    .unauth-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary, #f1f5f9);
      margin: 0 0 1rem;
    }

    .unauth-message {
      color: var(--text-secondary, #94a3b8);
      font-size: 1rem;
      line-height: 1.6;
      margin: 0 0 2rem;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.15em 0.65em;
      border-radius: 999px;
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      font-size: 0.875em;
      font-weight: 600;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .unauth-actions {
      display: flex;
      justify-content: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-size: 0.9375rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }

    .btn--primary {
      background: var(--moss, #22c55e);
      color: #fff;
      box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);

      &:hover {
        background: var(--moss-dark, #16a34a);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
      }

      &:active {
        transform: translateY(0);
      }
    }
  `]
})
export class UnauthorizedComponent {
  private authStore = inject(AuthStore);
  readonly role = computed(() => this.authStore.userRole());
}
