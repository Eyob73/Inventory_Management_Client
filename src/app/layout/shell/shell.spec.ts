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

  describe('Sidebar opening gesture anywhere on page except horizontal scroll tables and containers', () => {
    it('should open sidebar when right-swipe starts on regular page elements anywhere on the page (left, center, or right side)', () => {
      const normalEl = document.createElement('div');
      document.body.appendChild(normalEl);

      // 1. Swipe right starting from left side (clientX = 50)
      mockSidenav.opened = false;
      const touchStart1 = new TouchEvent('touchstart', {
        touches: [{ clientX: 50, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart1, 'target', { value: normalEl });
      component.onTouchStart(touchStart1);

      const touchMove1 = new TouchEvent('touchmove', {
        touches: [{ clientX: 120, clientY: 202 } as Touch],
      });
      component.onTouchMove(touchMove1);

      const touchEnd1 = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 120, clientY: 202 } as Touch],
      });
      component.onTouchEnd(touchEnd1);

      expect(mockSidenav.open).toHaveBeenCalledTimes(1);

      // 2. Swipe right starting from center/right side (clientX = 240 on 400px screen)
      mockSidenav.opened = false;
      const touchStart2 = new TouchEvent('touchstart', {
        touches: [{ clientX: 240, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart2, 'target', { value: normalEl });
      component.onTouchStart(touchStart2);

      const touchMove2 = new TouchEvent('touchmove', {
        touches: [{ clientX: 310, clientY: 202 } as Touch],
      });
      component.onTouchMove(touchMove2);

      const touchEnd2 = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 310, clientY: 202 } as Touch],
      });
      component.onTouchEnd(touchEnd2);

      expect(mockSidenav.open).toHaveBeenCalledTimes(2);

      document.body.removeChild(normalEl);
    });

    it('should open sidebar when right-swipe starts on dashboard cards and widgets (KPI, charts, widget bodies)', () => {
      // 1. Dashboard widget card (KPI widget)
      const slot = document.createElement('div');
      slot.className = 'widget-slot';
      const appWidget = document.createElement('app-widget');
      const widgetBody = document.createElement('div');
      widgetBody.className = 'widget-body';
      const kpiBody = document.createElement('div');
      kpiBody.className = 'kpi-body';
      const kpiValue = document.createElement('div');
      kpiValue.className = 'kpi-value';
      kpiValue.textContent = '$12,450';

      kpiBody.appendChild(kpiValue);
      widgetBody.appendChild(kpiBody);
      appWidget.appendChild(widgetBody);
      slot.appendChild(appWidget);
      document.body.appendChild(slot);

      mockSidenav.opened = false;
      const touchStart1 = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart1, 'target', { value: kpiValue });
      component.onTouchStart(touchStart1);

      const touchMove1 = new TouchEvent('touchmove', {
        touches: [{ clientX: 180, clientY: 202 } as Touch],
      });
      component.onTouchMove(touchMove1);

      const touchEnd1 = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 180, clientY: 202 } as Touch],
      });
      component.onTouchEnd(touchEnd1);

      expect(mockSidenav.open).toHaveBeenCalledTimes(1);

      // 2. Dashboard chart card (canvas in revenue chart)
      const chartBox = document.createElement('div');
      chartBox.className = 'chart-card-box';
      const canvas = document.createElement('canvas');
      chartBox.appendChild(canvas);
      widgetBody.appendChild(chartBox);

      mockSidenav.opened = false;
      const touchStart2 = new TouchEvent('touchstart', {
        touches: [{ clientX: 140, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart2, 'target', { value: canvas });
      component.onTouchStart(touchStart2);

      const touchMove2 = new TouchEvent('touchmove', {
        touches: [{ clientX: 220, clientY: 202 } as Touch],
      });
      component.onTouchMove(touchMove2);

      const touchEnd2 = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 220, clientY: 202 } as Touch],
      });
      component.onTouchEnd(touchEnd2);

      expect(mockSidenav.open).toHaveBeenCalledTimes(2);

      // 3. Dedicated widget drag handle: ignore sidebar gesture so widget can be dragged
      const dragHandle = document.createElement('button');
      dragHandle.className = 'drag-handle widget-drag-handle';
      dragHandle.setAttribute('cdkdraghandle', '');
      slot.appendChild(dragHandle);

      mockSidenav.opened = false;
      const touchStart3 = new TouchEvent('touchstart', {
        touches: [{ clientX: 40, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart3, 'target', { value: dragHandle });
      component.onTouchStart(touchStart3);

      const touchMove3 = new TouchEvent('touchmove', {
        touches: [{ clientX: 120, clientY: 202 } as Touch],
      });
      component.onTouchMove(touchMove3);

      const touchEnd3 = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 120, clientY: 202 } as Touch],
      });
      component.onTouchEnd(touchEnd3);

      // Should NOT open sidebar on drag handle
      expect(mockSidenav.open).toHaveBeenCalledTimes(2);

      document.body.removeChild(slot);
    });

    it('should NOT open sidebar when touch starts inside a wide table or table-wrapper anywhere in the viewport', () => {
      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'table-wrapper';
      const table = document.createElement('table');
      const td = document.createElement('td');
      table.appendChild(td);
      tableWrapper.appendChild(table);
      document.body.appendChild(tableWrapper);

      mockSidenav.opened = false;

      // Touch starts inside table
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 80, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: td });
      component.onTouchStart(touchStart);

      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 160, clientY: 202 } as Touch],
      });
      component.onTouchMove(touchMove);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 160, clientY: 202 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      // Table scroll must not be interrupted by sidebar opening
      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(tableWrapper);
    });

    it('should NOT open sidebar when touch starts inside a nested horizontal scroll container with overflow-x: auto', () => {
      const outer = document.createElement('div');
      const inner = document.createElement('div');
      inner.style.overflowX = 'auto';
      const cell = document.createElement('div');
      inner.appendChild(cell);
      outer.appendChild(inner);
      document.body.appendChild(outer);

      mockSidenav.opened = false;

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

    it('should NOT open sidebar when touch starts on an SVG icon or child element inside a table cell', () => {
      const table = document.createElement('table');
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(path);
      td.appendChild(svg);
      tr.appendChild(td);
      table.appendChild(tr);
      document.body.appendChild(table);

      mockSidenav.opened = false;

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 90, clientY: 200 } as Touch],
      });
      Object.defineProperty(touchStart, 'target', { value: path });
      component.onTouchStart(touchStart);

      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 170, clientY: 201 } as Touch],
      });
      component.onTouchMove(touchMove);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 170, clientY: 201 } as Touch],
      });
      component.onTouchEnd(touchEnd);

      expect(mockSidenav.open).not.toHaveBeenCalled();

      document.body.removeChild(table);
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
    it('should open sidebar on mouse drag on normal elements anywhere on page', () => {
      component.isMobile.set(true);
      mockSidenav.opened = false;

      const normalEl = document.createElement('div');
      document.body.appendChild(normalEl);

      // Drag starting on right side of viewport (clientX = 240)
      const mouseDown = new MouseEvent('mousedown', { clientX: 240, clientY: 200, button: 0 });
      Object.defineProperty(mouseDown, 'target', { value: normalEl });
      component.onMouseDown(mouseDown);

      const mouseMove = new MouseEvent('mousemove', { clientX: 320, clientY: 203 });
      component.onMouseMove(mouseMove);

      const mouseUp = new MouseEvent('mouseup', { clientX: 320, clientY: 203 });
      component.onMouseUp(mouseUp);

      expect(mockSidenav.open).toHaveBeenCalled();

      document.body.removeChild(normalEl);
    });

    it('should NOT open sidebar on mouse drag inside table anywhere in viewport', () => {
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
