import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
export class App {
  protected readonly title = signal('Inventory Management');

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.isActivated && outlet.activatedRoute
      ? outlet.activatedRoute.snapshot.url.join('/') || outlet.activatedRoute.snapshot.routeConfig?.path || ''
      : '';
  }
}
  