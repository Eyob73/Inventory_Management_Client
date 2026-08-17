import {
  Component,
  signal,
  HostListener,
  ChangeDetectionStrategy,
  computed,
  inject,
  OnInit,
  OnDestroy,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';

// Services
import { NavigationService, NavGroup } from '../../services/navigation-service';
import { SearchDialogComponent } from '../../component/search-dialog-component/search-dialog-component';
import { ThemeService } from '../../services/theme-service';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatMenuModule,
    MatProgressBarModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit, OnDestroy {
  private router = inject(Router);
  private navigation = inject(NavigationService);
  protected themeService = inject(ThemeService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  // ========== State ==========
  isCollapsed = signal(false);
  isScrolled = signal(false);
  isLoading = signal(false);
  pageTitle = signal('Dashboard');
  navGroups = signal<NavGroup[]>(this.navigation.getNavGroups());
  isMobile = signal(false);

  // computed
  readonly sidenavWidth = computed(() =>
    this.isMobile() ? '100%' : this.isCollapsed() ? '56px' : '248px'
  );
  readonly isCollapsedOrMobile = computed(() => this.isCollapsed() || this.isMobile());
  readonly mode = computed(() => (this.isMobile() ? 'over' : 'side'));

  private routerSub?: Subscription;

  constructor() {
    // Set page title on navigation
    this.routerSub = this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url;
        const title = this.navigation.getTitleForUrl(url);
        this.pageTitle.set(title);
      });

    // Watch mobile breakpoint (injected service uses BreakpointObserver)
    this.themeService.isMobile$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isMobile) => {
      this.isMobile.set(isMobile);
      if (isMobile) {
        this.isCollapsed.set(false); // force expanded on mobile
      }
    });

    // Show loading bar on route changes
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.isLoading.set(false);
      });

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        // close side-nav on mobile after navigation
        if (this.isMobile()) {
          // Sidenav is controlled by template; we'll handle via a reference
        }
      });
  }

  ngOnInit() {
    // Initialize theme (dark/light) from stored preference
    this.themeService.initializeTheme();
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  // ========== Host Listeners ==========
  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 8);
  }

  @HostListener('window:keydown.control.k', ['$event'])
  @HostListener('window:keydown.meta.k', ['$event'])
  openSearch(event: Event): void {
    event.preventDefault();
    this.dialog.open(SearchDialogComponent, {
      width: '540px',
      panelClass: 'search-dialog-panel',
      autoFocus: true,
    });
  }

  // ========== Actions ==========
  toggleCollapse(): void {
    if (!this.isMobile()) {
      this.isCollapsed.update((v) => !v);
    } else {
      // On mobile, toggling would open/close the overlay; we'll manage via mat-sidenav
      // We'll use a template reference variable instead of state
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}