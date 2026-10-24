import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoService, provideTransloco } from '@jsverse/transloco';

import { Shell, DEFAULT_SWIPE_CONFIG } from './shell';
import { ThemeService } from '../../services/theme-service';
import { NavigationService } from '../../services/navigation-service';
import { AuthStore } from '../../store/auth.store';
import { NotificationService } from '../../services/notification.service';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';

describe('Shell Component - Swipe Gestures and Horizontal Scroll Isolation', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;
  let isMobileSubject: BehaviorSubject<boolean>;
  let mockSidenav: { opened: boolean; open: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn>; toggle: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    isMobileSubject = new BehaviorSubject<boolean>(true);

    const mockThemeService = {
      isMobile$: isMobileSubject.asObservable(),
      initializeTheme: vi.fn(),
      toggleTheme: vi.fn(),
      theme: signal('dark'),
      isDark: signal(true),
    };

    const mockNavService = {
      getTitleForUrl: vi.fn().mockReturnValue('Dashboard'),
      getNavGroups: vi.fn().mockReturnValue([]),
    };

    const mockAuthStore = {
      user: signal(null),
      userRole: signal('admin'),
      isLoading: signal(false),
      logout: vi.fn(),
    };

    const mockNotificationService = {
      requestNotificationPermission: vi.fn(),
      unreadCount: signal(0),
      notifications: signal([]),
    };

    const mockConfirmDialogService = {};

    const mockMatDialog = {
      open: vi.fn(),
      openDialogs: [],
    };

    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
        { provide: ThemeService, useValue: mockThemeService },
        { provide: NavigationService, useValue: mockNavService },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialogService },
        { provide: MatDialog, useValue: mockMatDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;

    mockSidenav = {
      opened: false,
      open: vi.fn().mockImplementation(() => { mockSidenav.opened = true; }),
      close: vi.fn().mockImplementation(() => { mockSidenav.opened = false; }),
      toggle: vi.fn().mockImplementation(() => { mockSidenav.opened = !mockSidenav.opened; }),
    };

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 400 });

    component.isMobile.set(true);
    fixture.detectChanges();

    // Attach mock sidenav after initial change detection so ViewChild query does not overwrite it
    component.sidenav = mockSidenav as any;
  });

  describe('isHorizontallyScrollableComponent detection', () => {
    it('should detect standard table elements and table wrappers', () => {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      const table = document.createElement('table');
      const tbody = document.createElement('tbody');
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      const span = document.createElement('span');

      td.appendChild(span);
      tr.appendChild(td);
      tbody.appendChild(tr);
      table.appendChild(tbody);
      wrapper.appendChild(table);
      document.body.appendChild(wrapper);

      expect(component.isHorizontallyScrollableComponent(span)).toBe(true);
      expect(component.isHorizontallyScrollableComponent(td)).toBe(true);
      expect(component.isHorizontallyScrollableComponent(table)).toBe(true);
      expect(component.isHorizontallyScrollableComponent(wrapper)).toBe(true);

      document.body.removeChild(wrapper);
    });

    it('should detect table-responsive, tx-table-wrapper, items-table-wrapper and data grids', () => {
      const respWrapper = document.createElement('div');
      respWrapper.className = 'table-responsive';
      const cell = document.createElement('div');
      respWrapper.appendChild(cell);
      document.body.appendChild(respWrapper);

      expect(component.isHorizontallyScrollableComponent(cell)).toBe(true);
      document.body.removeChild(respWrapper);

      const gridWrapper = document.createElement('div');
      gridWrapper.className = 'data-grid';
      const gridCell = document.createElement('div');
      gridWrapper.appendChild(gridCell);
      document.body.appendChild(gridWrapper);

      expect(component.isHorizontallyScrollableComponent(gridCell)).toBe(true);
      document.body.removeChild(gridWrapper);
    });

    it('should detect carousels and card-carousels', () => {
      const carousel = document.createElement('div');
      carousel.className = 'card-carousel';
      const card = document.createElement('div');
      carousel.appendChild(card);
      document.body.appendChild(carousel);

      expect(component.isHorizontallyScrollableComponent(card)).toBe(true);
      document.body.removeChild(carousel);
    });

    it('should detect nested horizontal scroll containers via overflow-x style', () => {
      const parent = document.createElement('div');
      const nestedScroll = document.createElement('div');
      nestedScroll.style.overflowX = 'auto';
      const child = document.createElement('div');
      const grandchild = document.createElement('span');

      child.appendChild(grandchild);
      nestedScroll.appendChild(child);
      parent.appendChild(nestedScroll);
      document.body.appendChild(parent);

      expect(component.isHorizontallyScrollableComponent(grandchild)).toBe(true);
      expect(component.isHorizontallyScrollableComponent(child)).toBe(true);
      expect(component.isHorizontallyScrollableComponent(nestedScroll)).toBe(true);

      document.body.removeChild(parent);
    });

    it('should return false for regular page elements outside scroll containers', () => {
      const card = document.createElement('div');
      card.className = 'dashboard-card';
      const title = document.createElement('h2');
      title.textContent = 'Dashboard Overview';
      const p = document.createElement('p');
      p.textContent = 'Normal content';

      card.appendChild(title);
      card.appendChild(p);
      document.body.appendChild(card);

      expect(component.isHorizontallyScrollableComponent(p)).toBe(false);
      expect(component.isHorizontallyScrollableComponent(title)).toBe(false);
      expect(component.isHorizontallyScrollableComponent(card)).toBe(false);

      document.body.removeChild(card);
    });
  });

  describe('Sidebar opening gesture half-screen viewport restrictions', () => {
    it('should open sidebar when right-swipe starts within the left half of the viewport (<= 50% width)', () => {
      const normalEl = document.createElement('div');
      document.body.appendChild(normalEl);

      mockSidenav.opened = false;

      // Start touch at clientX = 120 (within left half of 400px screen, <= 200px)
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 120, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: normalEl });
      component.onTouchStart(touchStart);

      // Move right horizontally
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 190, clientY: 204 } as Touch],
      });
      component.onTouchMove(touchMove);

      // End touch (deltaX = +70px, deltaY = 4px, elapsed = 200ms)
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 190, clientY: 204 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      expect(mockSidenav.open).toHaveBeenCalled();

      document.body.removeChild(normalEl);
    });

    it('should NOT open sidebar when touch starts in the right half of the viewport (> 50% width)', () => {
      const normalEl = document.createElement('div');
      document.body.appendChild(normalEl);

      mockSidenav.opened = false;

      // Touch starts at clientX = 250px (beyond 50% of 400px viewport)
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 250, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: normalEl });
      component.onTouchStart(touchStart);

      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 320, clientY: 202 } as Touch],
      });
      component.onTouchMove(touchMove);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 320, clientY: 202 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(normalEl);
    });

    it('should NOT open sidebar when touch starts inside a wide table or table-wrapper, even within left half of viewport', () => {
      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'table-wrapper';
      const table = document.createElement('table');
      const td = document.createElement('td');
      table.appendChild(td);
      tableWrapper.appendChild(table);
      document.body.appendChild(tableWrapper);

      mockSidenav.opened = false;

      // Touch starts at clientX = 80px (inside left half, but inside table)
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 80, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: td });
      component.onTouchStart(touchStart);

      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 202 } as Touch],
      });
      component.onTouchMove(touchMove);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 150, clientY: 202 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      // Table scroll must not be interrupted by sidebar opening
      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(tableWrapper);
    });

    it('should NOT open sidebar when touch starts inside a nested horizontal scroll container in left half of viewport', () => {
      const outer = document.createElement('div');
      const inner = document.createElement('div');
      inner.style.overflowX = 'auto';
      const cell = document.createElement('div');
      inner.appendChild(cell);
      outer.appendChild(inner);
      document.body.appendChild(outer);

      mockSidenav.opened = false;

      // Touch starts at clientX = 60px inside nested scroll container
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 60, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: cell });
      component.onTouchStart(touchStart);

      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 130, clientY: 201 } as Touch],
      });
      component.onTouchMove(touchMove);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 130, clientY: 201 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(outer);
    });
  });

  describe('Directional distinction and gesture rejection', () => {
    it('should NOT open sidebar when scrolling vertically', () => {
      const normalEl = document.createElement('div');
      document.body.appendChild(normalEl);

      mockSidenav.opened = false;

      // Starts near edge at clientX = 15, clientY = 200
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 15, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: normalEl });
      component.onTouchStart(touchStart);

      // Moves vertically down (deltaY = 80px, deltaX = 10px)
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 25, clientY: 280 } as Touch],
      });
      component.onTouchMove(touchMove);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 25, clientY: 280 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(normalEl);
    });

    it('should NOT open sidebar on diagonal gestures', () => {
      const normalEl = document.createElement('div');
      document.body.appendChild(normalEl);

      mockSidenav.opened = false;

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 15, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: normalEl });
      component.onTouchStart(touchStart);

      // Diagonal movement: deltaX = 55px, deltaY = 50px (not dominantly horizontal)
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 70, clientY: 250 } as Touch],
      });
      component.onTouchMove(touchMove);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 70, clientY: 250 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(normalEl);
    });

    it('should NOT open sidebar on short accidental taps or movements', () => {
      const normalEl = document.createElement('div');
      document.body.appendChild(normalEl);

      mockSidenav.opened = false;

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 15, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: normalEl });
      component.onTouchStart(touchStart);

      // Short movement (deltaX = 15px)
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 30, clientY: 201 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(normalEl);
    });
  });

  describe('Sidebar closing gesture', () => {
    it('should close an open sidebar when swiping left', () => {
      const sidebarEl = document.createElement('div');
      sidebarEl.className = 'shell-sidenav';
      document.body.appendChild(sidebarEl);

      mockSidenav.opened = true;

      // Touch starts at clientX = 200, clientY = 200
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: sidebarEl });
      component.onTouchStart(touchStart);

      // Swiping left: clientX moves to 130 (deltaX = -70px)
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 130, clientY: 202 } as Touch],
      });
      component.onTouchMove(touchMove);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 130, clientY: 202 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      expect(mockSidenav.close).toHaveBeenCalled();

      document.body.removeChild(sidebarEl);
    });

    it('should NOT open sidebar if already open and swiped right', () => {
      const sidebarEl = document.createElement('div');
      document.body.appendChild(sidebarEl);

      mockSidenav.opened = true;

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 10, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: sidebarEl });
      component.onTouchStart(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 80, clientY: 202 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(sidebarEl);
    });
  });

  describe('Mouse testing on mobile viewport emulation', () => {
    it('should open sidebar on mouse drag from left half of viewport (clientX <= 50% width)', () => {
      component.isMobile.set(true);
      mockSidenav.opened = false;

      const normalEl = document.createElement('div');
      document.body.appendChild(normalEl);

      const mouseDown = new MouseEvent('mousedown', { clientX: 100, clientY: 200, button: 0 });
      Object.defineProperty(mouseDown, 'target', { value: normalEl });
      component.onMouseDown(mouseDown);

      const mouseMove = new MouseEvent('mousemove', { clientX: 170, clientY: 203 });
      component.onMouseMove(mouseMove);

      const mouseUp = new MouseEvent('mouseup', { clientX: 170, clientY: 203 });
      component.onMouseUp(mouseUp);

      expect(mockSidenav.open).toHaveBeenCalled();

      document.body.removeChild(normalEl);
    });

    it('should NOT open sidebar on mouse drag inside table, even from left half of viewport', () => {
      component.isMobile.set(true);
      mockSidenav.opened = false;

      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'table-wrapper';
      const cell = document.createElement('div');
      tableWrapper.appendChild(cell);
      document.body.appendChild(tableWrapper);

      const mouseDown = new MouseEvent('mousedown', { clientX: 50, clientY: 200, button: 0 });
      Object.defineProperty(mouseDown, 'target', { value: cell });
      component.onMouseDown(mouseDown);

      const mouseUp = new MouseEvent('mouseup', { clientX: 120, clientY: 203 });
      component.onMouseUp(mouseUp);

      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(tableWrapper);
    });

    it('should NOT open sidebar on mouse drag starting in right half of viewport (> 50% width)', () => {
      component.isMobile.set(true);
      mockSidenav.opened = false;

      const normalEl = document.createElement('div');
      document.body.appendChild(normalEl);

      const mouseDown = new MouseEvent('mousedown', { clientX: 260, clientY: 200, button: 0 });
      Object.defineProperty(mouseDown, 'target', { value: normalEl });
      component.onMouseDown(mouseDown);

      const mouseUp = new MouseEvent('mouseup', { clientX: 340, clientY: 203 });
      component.onMouseUp(mouseUp);

      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(normalEl);
    });
  });

  describe('Desktop mode immunity', () => {
    it('should ignore all swipe gestures when not in mobile mode', () => {
      component.isMobile.set(false);
      mockSidenav.opened = false;

      const normalEl = document.createElement('div');
      document.body.appendChild(normalEl);

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 15, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: normalEl });
      component.onTouchStart(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 85, clientY: 200 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(normalEl);
    });
  });
});
