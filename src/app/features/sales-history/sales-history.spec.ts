import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideTransloco } from '@jsverse/transloco';

import { SalesHistoryComponent } from './sales-history';
import { SaleService } from '../../services/sale.service';
import { AuthService } from '../../services/auth';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { Sale } from '../../models/sale.model';
import { SaleDetailsDialogComponent } from '../../component/sale-details-dialog/sale-details-dialog';

describe('SalesHistoryComponent - Clickable items and details dialog', () => {
  let component: SalesHistoryComponent;
  let fixture: ComponentFixture<SalesHistoryComponent>;
  let mockDialog: { open: ReturnType<typeof vi.fn>; openDialogs: any[] };
  let mockSaleService: { getPagedSales: ReturnType<typeof vi.fn>; getSaleById: ReturnType<typeof vi.fn>; cancelSale: ReturnType<typeof vi.fn> };

  const mockSales: Sale[] = [
    {
      id: 'sale-1',
      saleNumber: 'SAL-001',
      saleDate: '2026-10-24T10:00:00Z',
      userId: 'cashier-1',
      cashierName: 'Abebe B.',
      customerId: 'cust-1',
      customerName: 'Kebede T.',
      paymentMethod: 'Cash',
      subtotal: 100,
      discountAmount: 0,
      taxAmount: 15,
      totalAmount: 115,
      amountReceived: 120,
      changeAmount: 5,
      status: 'Completed',
      createdAt: '2026-10-24T10:00:00Z',
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          productName: 'Coca Cola 500ml',
          sku: 'CC-500',
          quantity: 2,
          unitPrice: 50,
          discountAmount: 0,
          subtotal: 100,
          totalPrice: 100
        }
      ]
    },
    {
      id: 'sale-2',
      saleNumber: 'SAL-002',
      saleDate: '2026-10-24T11:00:00Z',
      userId: 'cashier-1',
      cashierName: 'Abebe B.',
      customerId: null,
      customerName: null,
      paymentMethod: 'Telebirr',
      subtotal: 200,
      discountAmount: 0,
      taxAmount: 30,
      totalAmount: 230,
      amountReceived: 230,
      changeAmount: 0,
      status: 'Completed',
      createdAt: '2026-10-24T11:00:00Z',
      items: []
    }
  ];

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(undefined)
      }),
      openDialogs: []
    };

    mockSaleService = {
      getPagedSales: vi.fn().mockReturnValue(of({ items: mockSales, totalCount: 2 })),
      getSaleById: vi.fn().mockReturnValue(of(mockSales[0])),
      cancelSale: vi.fn().mockReturnValue(of({}))
    };

    const mockAuthService = {
      hasRole: vi.fn().mockReturnValue(true)
    };

    const mockSnackBar = {
      open: vi.fn()
    };

    const mockConfirmDialog = {
      confirm: vi.fn().mockReturnValue(of(true))
    };

    await TestBed.configureTestingModule({
      imports: [SalesHistoryComponent],
      providers: [
        provideNoopAnimations(),
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en'
          }
        }),
        { provide: MatDialog, useValue: mockDialog },
        { provide: SaleService, useValue: mockSaleService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: ConfirmDialogService, useValue: mockConfirmDialog },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: () => null })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SalesHistoryComponent);
    component = fixture.componentInstance;
    (component as any).dialog = mockDialog;
    fixture.detectChanges();
  });

  it('should load and render sales in the table', () => {
    expect(component.dataSource.data.length).toBe(2);
    const rows = fixture.nativeElement.querySelectorAll('.sales-row');
    expect(rows.length).toBe(2);
  });

  it('should open SaleDetailsDialogComponent when clicking on a table row', () => {
    const rows = fixture.nativeElement.querySelectorAll('.sales-row');
    expect(rows.length).toBeGreaterThan(0);

    const firstRow = rows[0] as HTMLElement;
    firstRow.click();

    expect(mockDialog.open).toHaveBeenCalledWith(SaleDetailsDialogComponent, {
      data: { sale: mockSales[0] },
      width: '680px',
      panelClass: 'pos-receipt-modal'
    });
  });

  it('should open SaleDetailsDialogComponent when viewDetails is called directly or via cardClicked', () => {
    component.viewDetails(mockSales[1]);

    expect(mockDialog.open).toHaveBeenCalledWith(SaleDetailsDialogComponent, {
      data: { sale: mockSales[1] },
      width: '680px',
      panelClass: 'pos-receipt-modal'
    });
  });

  it('should open SaleDetailsDialogComponent when clicking the view receipt action button', () => {
    const viewButtons = fixture.nativeElement.querySelectorAll('.sales-row button[color="primary"]');
    expect(viewButtons.length).toBeGreaterThan(0);

    (viewButtons[0] as HTMLElement).click();

    expect(mockDialog.open).toHaveBeenCalledWith(SaleDetailsDialogComponent, {
      data: { sale: mockSales[0] },
      width: '680px',
      panelClass: 'pos-receipt-modal'
    });
  });

  it('should handle card action "view" properly', () => {
    component.onCardAction({ actionId: 'view', item: mockSales[0] });

    expect(mockDialog.open).toHaveBeenCalledWith(SaleDetailsDialogComponent, {
      data: { sale: mockSales[0] },
      width: '680px',
      panelClass: 'pos-receipt-modal'
    });
  });

  describe('Date Range Filters', () => {
    it('should set selectedDateRange to today and populate start and end dates', () => {
      component.onDateRangeChange('today');

      expect(component.selectedDateRange()).toBe('today');
      expect(component.startDate()).toBeTruthy();
      expect(component.endDate()).toBeTruthy();
      expect(component.startDate()).toBe(component.endDate());
      expect(mockSaleService.getPagedSales).toHaveBeenCalledWith(expect.objectContaining({
        dateRange: 'today',
        startDate: component.startDate(),
        endDate: component.endDate()
      }));
    });

    it('should set selectedDateRange to yesterday and populate dates', () => {
      component.onDateRangeChange('yesterday');

      expect(component.selectedDateRange()).toBe('yesterday');
      expect(component.startDate()).toBeTruthy();
      expect(component.endDate()).toBeTruthy();
      expect(component.startDate()).toBe(component.endDate());
      expect(mockSaleService.getPagedSales).toHaveBeenCalledWith(expect.objectContaining({
        dateRange: 'yesterday'
      }));
    });

    it('should set selectedDateRange to this_week and calculate Monday through Sunday', () => {
      component.onDateRangeChange('this_week');

      expect(component.selectedDateRange()).toBe('this_week');
      expect(component.startDate()).toBeTruthy();
      expect(component.endDate()).toBeTruthy();
      expect(new Date(component.startDate()).getTime()).toBeLessThanOrEqual(new Date(component.endDate()).getTime());
      expect(mockSaleService.getPagedSales).toHaveBeenCalledWith(expect.objectContaining({
        dateRange: 'this_week'
      }));
    });

    it('should set selectedDateRange to this_month and calculate start and end of month', () => {
      component.onDateRangeChange('this_month');

      expect(component.selectedDateRange()).toBe('this_month');
      const now = new Date();
      expect(component.startDate()).toBe(component.formatDate(new Date(now.getFullYear(), now.getMonth(), 1)));
      expect(mockSaleService.getPagedSales).toHaveBeenCalledWith(expect.objectContaining({
        dateRange: 'this_month'
      }));
    });

    it('should set selectedDateRange to this_year and calculate start and end of year', () => {
      component.onDateRangeChange('this_year');

      expect(component.selectedDateRange()).toBe('this_year');
      const now = new Date();
      expect(component.startDate()).toBe(`${now.getFullYear()}-01-01`);
      expect(component.endDate()).toBe(`${now.getFullYear()}-12-31`);
      expect(mockSaleService.getPagedSales).toHaveBeenCalledWith(expect.objectContaining({
        dateRange: 'this_year'
      }));
    });

    it('should clear dates when preset is empty (All Time)', () => {
      component.onDateRangeChange('today');
      expect(component.startDate()).toBeTruthy();

      component.onDateRangeChange('');
      expect(component.selectedDateRange()).toBe('');
      expect(component.startDate()).toBe('');
      expect(component.endDate()).toBe('');
    });

    it('should switch preset to custom when startDate is changed manually', () => {
      component.onDateRangeChange('this_month');
      expect(component.selectedDateRange()).toBe('this_month');

      component.onStartDateChange(new Date('2026-05-15'));
      expect(component.selectedDateRange()).toBe('custom');
      expect(component.startDate()).toBe('2026-05-15');
    });

    it('should switch preset to custom when endDate is changed manually', () => {
      component.onDateRangeChange('this_month');
      expect(component.selectedDateRange()).toBe('this_month');

      component.onEndDateChange(new Date('2026-05-20'));
      expect(component.selectedDateRange()).toBe('custom');
      expect(component.endDate()).toBe('2026-05-20');
    });

    it('should reset date range when resetFilters is called', () => {
      component.onDateRangeChange('today');
      expect(component.selectedDateRange()).toBe('today');

      component.resetFilters();
      expect(component.selectedDateRange()).toBe('');
      expect(component.startDate()).toBe('');
      expect(component.endDate()).toBe('');
      expect(component.pageIndex()).toBe(1);
    });
  });
});
