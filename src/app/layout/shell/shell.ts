import {
  Component,
  signal,
  HostListener,
  ChangeDetectionStrategy,
  computed,
  inject,
  OnInit,
  AfterViewInit,
  OnDestroy,
  DestroyRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Material
import { MatSidenavModule, MatSidenavContainer, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

// Services & Animations
import { NavigationService, NavGroup } from '../../services/navigation-service';
import { SearchDialogComponent } from '../../component/search-dialog-component/search-dialog-component';
import { ThemeService } from '../../services/theme-service';
import { AuthStore } from '../../store/auth.store';
import { NotificationService } from '../../services/notification.service';
import { routeFadeAnimation } from '../../animations/fade.animation';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { ConfirmDialogComponent } from '../../ui/confirm-dialog/confirm-dialog';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

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
    MatProgressSpinnerModule,
    TranslocoDirective,
    TranslocoPipe
  ],
  animations: [routeFadeAnimation],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit, AfterViewInit, OnDestroy {
  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.isActivated && outlet.activatedRoute
      ? outlet.activatedRoute.snapshot.url.join('/') || outlet.activatedRoute.snapshot.routeConfig?.path || ''
      : '';
  }
  @ViewChild(MatSidenavContainer) sidenavContainer!: MatSidenavContainer;
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private router = inject(Router);
  private navigation = inject(NavigationService);
  protected themeService = inject(ThemeService);
  protected authStore = inject(AuthStore);
  protected notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private confirmService = inject(ConfirmDialogService);
    private destroyRef = inject(DestroyRef);
  private translocoService = inject(TranslocoService);

  getNavKey(label: string): string {
    const map: Record<string, string> = {
      'Dashboard': 'dashboard',
      'Bottle Dashboard': 'bottles-dashboard',
      'Bottle Types': 'bottles-types',
      'Bottle Inventory': 'bottles-inventory',
      'Customer Bottles': 'bottles-customers',
      'Bottle Transactions': 'bottles-transactions',
      'Bottle Reports': 'bottles-reports',
      'Bottle Settings': 'bottles-settings',
      'Products': 'products',
      'Categories': 'categories',
      'Inventory': 'inventory',
      'POS Terminal': 'pos',
      'Sales History': 'sales',
      'Customers': 'customers',
      'Suppliers': 'suppliers',
      'Purchases': 'purchases',
      'Reports': 'reports',
      'Users': 'users',
      'Settings': 'settings',
      'Payment Verification': 'paymentVerification',
    };
    return map[label] || label.toLowerCase().replace(/ /g, '');
  }

  getNavGroupKey(label: string): string {
    const map: Record<string, string> = {
      'Main': 'main',
      'Bottle Management': 'bottleManagement',
      'Transactions': 'transactions',
      'Analytics': 'analytics',
      'Administration': 'administration',
      'System Admin': 'systemAdmin',
    };
    return map[label] || label.toLowerCase().replace(/ /g, '');
  }

  // ========== Computed User Details ==========
  readonly userName = computed(() => {
    const u = this.authStore.user();
    if (!u) return 'User';
    if (u.firstName) {
      return u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName;
    }
    return u.userName || u.email?.split('@')[0] || 'User';
  });

  readonly userRole = computed(() => {
    return this.authStore.userRole();
  });

  readonly userEmail = computed(() => {
    return this.authStore.user()?.email || '';
  });

  readonly tenantName = computed(() => {
    return this.authStore.user()?.tenantName || 'TrackStack';
  });

  readonly userInitials = computed(() => {
    const u = this.authStore.user();
    if (u?.firstName) {
      const firstInitial = u.firstName.charAt(0);
      const lastInitial = u.lastName ? u.lastName.charAt(0) : '';
      return (firstInitial + lastInitial).toUpperCase() || firstInitial.toUpperCase();
    }
    const name = this.userName();
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  // ========== State ==========
  isCollapsed = signal(false);
  isScrolled = signal(false);
  isLoading = signal(false);
  pageTitle = signal('Dashboard');
  isMobile = signal(false);

  // Role-reactive nav groups: automatically updates when the role changes
  readonly navGroups = computed(() =>
    this.navigation.getNavGroups(this.authStore.userRole())
  );

  // Admin, Manager, Sales, and System Admin can access Settings
  readonly canAccessSettings = computed(() => {
    const role = (this.authStore.userRole() || '').toLowerCase();
    return role === 'admin' || role === 'manager' || role === 'sales' || role === 'systemadmin';
  });

  readonly settingsRoute = computed(() => {
    const role = (this.authStore.userRole() || '').toLowerCase();
    return role === 'systemadmin' ? '/system-admin/settings' : '/settings';
  });

  readonly isSystemAdmin = computed(() => {
    return (this.authStore.userRole() || '').toLowerCase() === 'systemadmin';
  });

  readonly mobileNavItems = computed(() => {
    if (this.isSystemAdmin()) {
      return [
        { labelKey: 'navigation.dashboard', path: '/system-admin/dashboard', icon: 'dashboard' },
        { labelKey: 'navigation.companies', path: '/system-admin/companies', icon: 'business' },
        { labelKey: 'navigation.activity', path: '/system-admin/activity', icon: 'trending_up' },
        { labelKey: 'navigation.settings', path: '/system-admin/settings', icon: 'settings' },
      ];
    }
    return [
      { labelKey: 'navigation.dashboard', path: '/dashboard', icon: 'dashboard' },
      { labelKey: 'navigation.products', path: '/products', icon: 'inventory_2' },
      { labelKey: 'navigation.sales', path: '/sales-history', icon: 'trending_up' },
      { labelKey: 'navigation.settings', path: this.settingsRoute(), icon: 'settings' },
    ];
  });

  readonly sidenavWidth = computed(() =>
    this.isCollapsed() && !this.isMobile() ? '48px' : '250px'
  );
  readonly isSidebarMini = computed(() => this.isCollapsed() && !this.isMobile());
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
          this.sidenav?.close();
        }
      });
  }

  ngOnInit() {
    // Initialize theme (dark/light) from stored preference
    this.themeService.initializeTheme();
    // Always enable device notifications for authenticated users
    this.notificationService.requestNotificationPermission();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.sidenavContainer?.updateContentMargins();
    }, 0);
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
      maxWidth: '95vw',
      panelClass: 'search-dialog-panel',
      autoFocus: true,
    });
  }

  // ========== Swipe Gesture Listeners (Mobile Sidebar) ==========
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private touchIgnored = false;

  @HostListener('window:touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (!this.isMobile() || event.touches.length !== 1) {
      this.touchIgnored = true;
      return;
    }

    if (this.dialog.openDialogs.length > 0) {
      this.touchIgnored = true;
      return;
    }

    const target = event.target as HTMLElement | null;
    if (this.isHorizontalScrollOrControl(target)) {
      this.touchIgnored = true;
      return;
    }

    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.touchIgnored = false;
  }

  @HostListener('window:touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (this.touchIgnored || !this.isMobile() || !event.changedTouches.length) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    const elapsed = Date.now() - this.touchStartTime;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Validate horizontal swipe:
    // 1. Quick flick (<350ms, >=40px) or deliberate swipe (<700ms, >=55px)
    // 2. Horizontal movement must be dominant over vertical movement (absX > absY * 1.4)
    const isValidSwipe = (elapsed < 350 && absX >= 40) || (elapsed < 700 && absX >= 55);

    if (isValidSwipe && absX > absY * 1.4) {
      // Swipe from left to right -> open sidebar
      if (deltaX > 0 && !this.sidenav?.opened) {
        this.sidenav?.open();
      }
      // Swipe from right to left -> close sidebar if open
      else if (deltaX < 0 && this.sidenav?.opened) {
        this.sidenav?.close();
      }
    }
  }

  @HostListener('window:touchcancel')
  onTouchCancel(): void {
    this.touchIgnored = true;
  }

  @HostListener('window:mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (!this.isMobile() || event.button !== 0) return;
    if (this.dialog.openDialogs.length > 0) return;

    const target = event.target as HTMLElement | null;
    if (this.isHorizontalScrollOrControl(target)) return;

    // For mouse testing on narrow desktop viewports: allow drag from left edge (<= 50px) or when sidebar is open
    if (!this.sidenav?.opened && event.clientX > 50) return;

    this.touchStartX = event.clientX;
    this.touchStartY = event.clientY;
    this.touchStartTime = Date.now();
    this.touchIgnored = false;
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (this.touchIgnored || !this.isMobile()) return;

    const deltaX = event.clientX - this.touchStartX;
    const deltaY = event.clientY - this.touchStartY;
    const elapsed = Date.now() - this.touchStartTime;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const isValidSwipe = (elapsed < 400 && absX >= 40) || (elapsed < 800 && absX >= 55);
    if (isValidSwipe && absX > absY * 1.4) {
      if (deltaX > 0 && !this.sidenav?.opened) {
        this.sidenav?.open();
      } else if (deltaX < 0 && this.sidenav?.opened) {
        this.sidenav?.close();
      }
    }
    this.touchIgnored = true;
  }

  private isHorizontalScrollOrControl(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;

    // Form inputs and sliders where dragging/sliding is part of standard input interaction
    if (
      target.closest(
        'input, textarea, select, mat-slider, [role="slider"], .mat-mdc-slide-toggle, canvas, .chartjs-render-monitor'
      )
    ) {
      return true;
    }

    // Explicit horizontal scroll containers in the app
    if (target.closest('.mobile-pill-nav, .mobile-bottom-nav, .table-responsive')) {
      return true;
    }

    // Check if target or any immediate parent has horizontal scrolling
    let el: HTMLElement | null = target;
    let depth = 0;
    while (el && el !== document.body && depth < 4) {
      const overflowX = window.getComputedStyle(el).overflowX;
      if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 20) {
        return true;
      }
      el = el.parentElement;
      depth++;
    }

    return false;
  }

  // ========== Actions ==========
  toggleCollapse(): void {
    if (!this.isMobile()) {
      this.isCollapsed.update((v) => !v);
    } else {
      this.sidenav?.toggle();
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getTranslatedNotificationTitle(title: string): string {
    if (!title) return '';
    const key = 'shell.notificationTitles.' + title.replace(/\s+/g, '');
    const translated = this.translocoService.translate(key);
    return translated === key ? title : translated;
  }

  logout(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.translocoService.translate('confirm.signOutTitle'),
        message: this.translocoService.translate('confirm.signOutMessage'),
        confirmText: this.translocoService.translate('confirm.signOut'),
        cancelText: this.translocoService.translate('common.cancel'),
        type: 'warning',
        icon: 'logout',
        isProcessing: this.authStore.isLoading,
        onConfirmCallback: () => {
          this.authStore.logout();
        }
      },
      width: '440px',
      panelClass: 'custom-confirm-dialog-panel',
      disableClose: true,
    });
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}