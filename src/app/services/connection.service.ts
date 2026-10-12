import { Injectable, signal, computed, inject, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export type ConnectionStatus = 'online' | 'offline' | 'api_unreachable';

export interface DiagnosticsState {
  browserOnline: boolean;
  apiReachable: boolean;
  lastChecked: Date | null;
  lastOnline: Date | null;
  failureCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ── State Signals ──────────────────────────────────────────────────────────
  readonly status = signal<ConnectionStatus>(
    this.isBrowser && !navigator.onLine ? 'offline' : 'online'
  );
  readonly isChecking = signal<boolean>(false);
  readonly lastChecked = signal<Date | null>(null);
  readonly lastOnline = signal<Date | null>(new Date());
  readonly showReconnectedBanner = signal<boolean>(false);
  readonly consecutiveFailures = signal<number>(0);
  readonly lastErrorMessage = signal<string | null>(null);

  // ── Computed Convenience Signals ───────────────────────────────────────────
  readonly isOnline = computed(() => this.status() === 'online');
  readonly isOffline = computed(() => this.status() === 'offline');
  readonly isApiUnreachable = computed(() => this.status() === 'api_unreachable');
  readonly isDisconnected = computed(() => this.status() !== 'online');

  // Diagnostic details for user transparency
  readonly diagnostics = computed<DiagnosticsState>(() => ({
    browserOnline: this.isBrowser ? navigator.onLine : true,
    apiReachable: this.status() === 'online',
    lastChecked: this.lastChecked(),
    lastOnline: this.lastOnline(),
    failureCount: this.consecutiveFailures(),
  }));

  private periodicTimer: any = null;
  private reconnectedTimer: any = null;
  private lastReportedErrorTime = 0;
  private isCheckingInFlight = false;

  constructor() {
    if (this.isBrowser) {
      this.initEventListeners();
      // Perform initial check in background after startup
      setTimeout(() => {
        this.checkConnectivity(false);
      }, 1000);
    }
  }

  private initEventListeners(): void {
    const onlineHandler = () => {
      console.log('[ConnectionService] Browser online event detected.');
      // When browser reports online, immediately verify full API connectivity
      this.checkConnectivity(false);
    };

    const offlineHandler = () => {
      console.warn('[ConnectionService] Browser offline event detected.');
      this.status.set('offline');
      this.startPeriodicCheck();
    };

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
      this.stopPeriodicCheck();
      if (this.reconnectedTimer) {
        clearTimeout(this.reconnectedTimer);
      }
    });
  }

  /**
   * Actively checks network and API connectivity.
   * Distinguishes between device offline vs. backend API unreachable.
   */
  async checkConnectivity(isManual = false): Promise<boolean> {
    if (!this.isBrowser || this.isCheckingInFlight) {
      return this.status() === 'online';
    }

    this.isCheckingInFlight = true;
    this.isChecking.set(true);

    try {
      // Step 1: Check browser network indicator
      if (!navigator.onLine) {
        this.handleDisconnectedState('offline', 'Device is offline');
        return false;
      }

      // Step 2: Test backend health endpoint
      const healthUrl = `${environment.apiUrl}/health?_ts=${Date.now()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(healthUrl, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });
        clearTimeout(timeoutId);

        if (response.ok || (response.status >= 200 && response.status < 400)) {
          this.handleConnectedState();
          return true;
        } else if (response.status >= 500) {
          // Backend is returning 500+ error, so server is up but in error/unhealthy state
          this.handleDisconnectedState(
            'api_unreachable',
            `Server responded with error status ${response.status}`
          );
          return false;
        }
      } catch (apiErr: any) {
        clearTimeout(timeoutId);
        // API fetch failed (e.g. connection refused, network timeout, CORS error due to server down)
        // Step 3: Check if general internet connection works
        const internetReachable = await this.probePublicInternet();

        if (internetReachable) {
          this.handleDisconnectedState(
            'api_unreachable',
            'Internet is active, but the API backend is unreachable.'
          );
        } else {
          this.handleDisconnectedState(
            'offline',
            'No internet connection available.'
          );
        }
        return false;
      }

      return false;
    } finally {
      this.lastChecked.set(new Date());
      this.isCheckingInFlight = false;
      this.isChecking.set(false);
    }
  }

  /**
   * Probes public internet by pinging a lightweight external asset
   * to verify whether the device has WAN connectivity.
   */
  private async probePublicInternet(): Promise<boolean> {
    if (!this.isBrowser || !navigator.onLine) {
      return false;
    }

    try {
      // Use standard DNS resolution ping or no-cors favicon fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return true;
    } catch {
      // If external probe fails, fallback to navigator.onLine check
      return navigator.onLine;
    }
  }

  /**
   * Called when connection is confirmed active.
   */
  private handleConnectedState(): void {
    const previousStatus = this.status();
    const wasDown = previousStatus !== 'online';

    this.status.set('online');
    this.consecutiveFailures.set(0);
    this.lastErrorMessage.set(null);
    this.lastOnline.set(new Date());
    this.stopPeriodicCheck();

    if (wasDown) {
      console.log('[ConnectionService] Connection successfully restored!');
      this.triggerReconnectedBanner();
    }
  }

  /**
   * Called when connectivity or API is unavailable.
   */
  private handleDisconnectedState(newStatus: 'offline' | 'api_unreachable', reason: string): void {
    this.status.set(newStatus);
    this.consecutiveFailures.update((c) => c + 1);
    this.lastErrorMessage.set(reason);
    console.warn(`[ConnectionService] Disconnected state (${newStatus}): ${reason}`);

    this.startPeriodicCheck();
  }

  /**
   * Reports an HTTP error from the HTTP interceptor to detect sudden network drops.
   * Debounces to avoid rapid successive reports when multiple requests fail together.
   */
  reportHttpError(status: number, url: string, message?: string): void {
    if (!this.isBrowser) return;

    // Ignore health check calls themselves
    if (url.includes('/health')) return;

    // Ignore ordinary client errors (400, 401, 403, 404, 409, 422)
    if (status >= 400 && status < 500 && status !== 408) {
      return;
    }

    const now = Date.now();
    // Throttle reports to at most once per 2 seconds
    if (now - this.lastReportedErrorTime < 2000) {
      return;
    }
    this.lastReportedErrorTime = now;

    // Status 0 represents network failure, CORS block due to unreachable server, or connection drop
    if (status === 0 || status === 408 || status === 502 || status === 503 || status === 504) {
      if (!navigator.onLine) {
        this.status.set('offline');
        this.startPeriodicCheck();
      } else {
        // Trigger a background verification
        this.checkConnectivity(false);
      }
    }
  }

  /**
   * Shows a brief celebratory "Back Online" notification banner.
   */
  private triggerReconnectedBanner(): void {
    this.showReconnectedBanner.set(true);

    if (this.reconnectedTimer) {
      clearTimeout(this.reconnectedTimer);
    }

    this.reconnectedTimer = setTimeout(() => {
      this.showReconnectedBanner.set(false);
    }, 4000);
  }

  /**
   * Automatically polls in the background while disconnected
   * to recover seamlessly without requiring user intervention.
   */
  private startPeriodicCheck(): void {
    if (this.periodicTimer || !this.isBrowser) return;

    // Check every 12 seconds while disconnected
    this.periodicTimer = setInterval(() => {
      if (this.status() !== 'online') {
        this.checkConnectivity(false);
      } else {
        this.stopPeriodicCheck();
      }
    }, 12000);
  }

  private stopPeriodicCheck(): void {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }
  }

  /**
   * Form and state preservation utilities.
   */
  saveFormDraft(formId: string, data: unknown): void {
    if (!this.isBrowser) return;
    try {
      sessionStorage.setItem(`ims_draft_${formId}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('[ConnectionService] Could not cache form draft', e);
    }
  }

  getFormDraft<T>(formId: string): T | null {
    if (!this.isBrowser) return null;
    try {
      const item = sessionStorage.getItem(`ims_draft_${formId}`);
      if (!item) return null;
      const parsed = JSON.parse(item);
      return parsed.data as T;
    } catch {
      return null;
    }
  }

  clearFormDraft(formId: string): void {
    if (!this.isBrowser) return;
    try {
      sessionStorage.removeItem(`ims_draft_${formId}`);
    } catch {
      // ignore
    }
  }
}
