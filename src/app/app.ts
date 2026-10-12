import { ChangeDetectionStrategy, Component, signal, computed, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { routeFadeAnimation } from './animations/fade.animation';
import { ConnectionService } from './services/connection.service';
import { OfflineComponent } from './features/offline/offline';
import { ReconnectedBannerComponent } from './features/offline/reconnected-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OfflineComponent, ReconnectedBannerComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.scss',
  animations: [routeFadeAnimation],
})
export class App implements OnInit {
  protected readonly title = signal('Inventory Management');
  protected readonly connectionService = inject(ConnectionService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly currentUrl = signal(this.router.url);

  readonly isOfflineRoute = computed(() => {
    const url = this.currentUrl();
    return url === '/offline' || url.startsWith('/offline?');
  });

  readonly showOfflineOverlay = computed(() => {
    return this.connectionService.isDisconnected() && !this.isOfflineRoute();
  });

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects || e.url);
      });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', (event) => {
        // Find the scrolling element (fallback to document.documentElement if document itself is scrolling)
        let target = event.target as HTMLElement | Document;
        if (target === document) {
          target = document.documentElement;
        }
        
        const el = target as HTMLElement;
        if (!el || typeof el.classList === 'undefined') return;

        el.classList.add('is-scrolling');

        // Reset the timeout on every scroll event
        if ((el as any)._scrollTimeout) {
          clearTimeout((el as any)._scrollTimeout);
        }

        // Hide scrollbar immediately after scrolling stops
        (el as any)._scrollTimeout = setTimeout(() => {
          el.classList.remove('is-scrolling');
        }, 1000);
      }, true); // Use capture phase to catch all scroll events
    }
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.isActivated && outlet.activatedRoute
      ? outlet.activatedRoute.snapshot.url.join('/') || outlet.activatedRoute.snapshot.routeConfig?.path || ''
      : '';
  }
}
