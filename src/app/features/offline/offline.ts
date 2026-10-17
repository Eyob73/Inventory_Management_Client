import {
  Component,
  Input,
  signal,
  inject,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoService } from '@jsverse/transloco';
import { ConnectionService } from '../../services/connection.service';

@Component({
  selector: 'app-offline-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './offline.html',
  styleUrl: './offline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineComponent {
  @Input() isOverlay = false;

  protected readonly connectionService = inject(ConnectionService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly transloco = inject(TranslocoService, { optional: true });

  // UI state
  protected readonly showTroubleshooting = signal<boolean>(false);
  protected readonly isJustReconnected = signal<boolean>(false);

  // Status computation
  protected readonly isOffline = computed(() => this.connectionService.isOffline());
  protected readonly isApiUnreachable = computed(() => this.connectionService.isApiUnreachable());
  protected readonly isChecking = computed(() => this.connectionService.isChecking());
  protected readonly diagnostics = computed(() => this.connectionService.diagnostics());

  // Dynamic headings & descriptions based on offline vs api_unreachable
  protected readonly heading = computed(() => {
    if (this.isJustReconnected()) {
      const t = this.transloco?.translate('offline.backOnline');
      return t && t !== 'offline.backOnline' ? t : "You're Back Online!";
    }
    if (this.isApiUnreachable()) {
      const t = this.transloco?.translate('offline.serverUnavailable');
      return t && t !== 'offline.serverUnavailable' ? t : 'Server Unavailable';
    }
    const t = this.transloco?.translate('offline.title');
    return t && t !== 'offline.title' ? t : "You're Offline";
  });

  protected readonly message = computed(() => {
    if (this.isJustReconnected()) {
      const t = this.transloco?.translate('offline.reconnectedMessage');
      return t && t !== 'offline.reconnectedMessage' ? t : 'Network connection has been restored. Your session and data are ready.';
    }
    if (this.isApiUnreachable()) {
      const t = this.transloco?.translate('offline.serverMessage');
      return t && t !== 'offline.serverMessage' ? t : 'Your device is connected to the internet, but the TrackStack server is currently unreachable. Please check if the server is running or try again shortly.';
    }
    const t = this.transloco?.translate('offline.message');
    return t && t !== 'offline.message' ? t : 'Your internet connection has been lost. Please check your network and try again.';
  });

  async onRetry(): Promise<void> {
    const success = await this.connectionService.checkConnectivity(true);
    if (success) {
      this.isJustReconnected.set(true);
      setTimeout(() => {
        if (!this.isOverlay) {
          // If viewing on standalone /offline page, return to previous page or dashboard
          if (window.history.length > 1) {
            this.location.back();
          } else {
            this.router.navigate(['/dashboard']);
          }
        }
      }, 1200);
    }
  }

  toggleTroubleshooting(): void {
    this.showTroubleshooting.update((v) => !v);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return 'Not yet checked';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    }).format(new Date(date));
  }
}
