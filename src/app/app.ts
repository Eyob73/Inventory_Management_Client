import { ChangeDetectionStrategy, Component, signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { routeFadeAnimation } from './animations/fade.animation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.scss',
  animations: [routeFadeAnimation],
})
export class App implements OnInit {
  protected readonly title = signal('Inventory Management');

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

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
