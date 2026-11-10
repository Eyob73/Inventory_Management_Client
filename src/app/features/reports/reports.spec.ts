import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideTransloco } from '@jsverse/transloco';

import { Reports } from './reports';
import { ReportsService } from '../../services/reports.service';
import { SaleService } from '../../services/sale.service';
import { CategoryService } from '../../services/category';
import { ProductService } from '../../services/product';
import { SupplierService } from '../../services/supplier';
import { CustomerService } from '../../services/customer.service';
import { UserService } from '../../services/user.service';
import { Sale } from '../../models/sale.model';
import { SalesReportRow, SalesReport, DashboardReport } from '../../models/reports.model';
import { SaleDetailsDialogComponent } from '../../component/sale-details-dialog/sale-details-dialog';

describe('Reports Component - Sales Row Clickable & Sales Details', () => {
  let component: Reports;
  let fixture: ComponentFixture<Reports>;
  let mockDialog: { open: ReturnType<typeof vi.fn>; openDialogs: any[] };
  let mockSaleService: { getSaleById: ReturnType<typeof vi.fn> };
  let mockReportsService: any;

  const mockSaleRow: SalesReportRow = {
    id: 'sale-123',
    invoiceNumber: 'INV-2026-001',
    customer: 'Abebe Kebede',
    date: '2026-11-09T10:00:00Z',
    numberOfItems: 3,
    totalAmount: 450.5,
    paymentMethod: 'Cash',
    status: 'Completed',
  };

  const mockFullSale: Sale = {
    id: 'sale-123',
    saleNumber: 'INV-2026-001',
    saleDate: '2026-11-09T10:00:00Z',
    customerId: 'cust-1',
    customerName: 'Abebe Kebede',
    cashierName: 'Cashier One',
    subtotal: 450.5,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 450.5,
    paymentMethod: 'Cash',
    amountReceived: 500,
    changeAmount: 49.5,
    status: 'Completed',
    createdAt: '2026-11-09T10:00:00Z',
    items: [
      {
        productId: 'prod-1',
        productName: 'Product One',
        sku: 'SKU-001',
        quantity: 3,
        unitPrice: 150.17,
        discountAmount: 0,
        subtotal: 450.5,
        totalPrice: 450.5,
      },
    ],
  };

  const mockPeriodMetric = { value: 100, previousValue: 90, changePercent: 11.1 };
  const mockDashboardReport: DashboardReport = {
    startDate: '2026-11-01',
    endDate: '2026-11-09',
    totalSales: mockPeriodMetric,
    totalPurchases: mockPeriodMetric,
    totalProfit: mockPeriodMetric,
    totalProductsSold: mockPeriodMetric,
    totalCustomers: mockPeriodMetric,
    totalSuppliers: mockPeriodMetric,
    lowStockProducts: 2,
    outOfStockProducts: 1,
    salesOverTime: [],
    purchasesOverTime: [],
    topProducts: [],
    salesByCategory: [],
  };

  const mockSalesReport: SalesReport = {
    summary: {
      totalSalesAmount: 450.5,
      numberOfSales: 1,
      totalProductsSold: 3,
      averageSaleValue: 450.5,
      totalDiscounts: 0,
      totalTax: 0,
    },
    table: {
      items: [mockSaleRow],
      totalCount: 1,
      page: 1,
      pageSize: 15,
    },
    salesByDay: [],
    salesByWeek: [],
    salesByMonth: [],
    topSellingProducts: [],
    salesByCategory: [],
  };

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(undefined),
      }),
      openDialogs: [],
    };

    mockSaleService = {
      getSaleById: vi.fn().mockReturnValue(of(mockFullSale)),
    };

    mockReportsService = {
      getDashboard: vi.fn().mockReturnValue(of(mockDashboardReport)),
      getSales: vi.fn().mockReturnValue(of(mockSalesReport)),
      getPurchases: vi.fn().mockReturnValue(of({ summary: {}, table: { items: [], totalCount: 0 } })),
      getInventory: vi.fn().mockReturnValue(of({ summary: {}, table: { items: [], totalCount: 0 } })),
      getLowStock: vi.fn().mockReturnValue(of({ summary: {}, table: { items: [], totalCount: 0 } })),
      getProductPerformance: vi.fn().mockReturnValue(of({ table: { items: [], totalCount: 0 } })),
      getCustomers: vi.fn().mockReturnValue(of({ summary: {}, table: { items: [], totalCount: 0 } })),
      getSuppliers: vi.fn().mockReturnValue(of({ summary: {}, table: { items: [], totalCount: 0 } })),
      getProfit: vi.fn().mockReturnValue(of({ summary: {}, profitByDay: [] })),
      getStockMovements: vi.fn().mockReturnValue(of({ summary: {}, table: { items: [], totalCount: 0 } })),
    };

    const mockCategoryService = { getAll: vi.fn().mockReturnValue(of([])) };
    const mockProductService = { getCatalog: vi.fn().mockReturnValue(of([])) };
    const mockSupplierService = { getAll: vi.fn().mockReturnValue(of([])) };
    const mockCustomerService = { getAll: vi.fn().mockReturnValue(of([])) };
    const mockUserService = { getUsers: vi.fn().mockReturnValue(of([])) };
    const mockSnackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
        { provide: ReportsService, useValue: mockReportsService },
        { provide: SaleService, useValue: mockSaleService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: ProductService, useValue: mockProductService },
        { provide: SupplierService, useValue: mockSupplierService },
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: UserService, useValue: mockUserService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Reports);
    component = fixture.componentInstance;
    (component as any).dialog = mockDialog;
    (component as any).saleService = mockSaleService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call saleService.getSaleById and open SaleDetailsDialogComponent on openSaleDetail', () => {
    component.openSaleDetail(mockSaleRow);

    expect(mockSaleService.getSaleById).toHaveBeenCalledWith('sale-123');
    expect(mockDialog.open).toHaveBeenCalledWith(SaleDetailsDialogComponent, {
      data: { sale: mockFullSale },
      width: '680px',
      panelClass: 'pos-receipt-modal',
    });
  });

  it('should gracefully handle getSaleById error and open SaleDetailsDialogComponent with fallback', () => {
    mockSaleService.getSaleById.mockReturnValueOnce(throwError(() => new Error('Network error')));

    component.openSaleDetail(mockSaleRow);

    expect(mockSaleService.getSaleById).toHaveBeenCalledWith('sale-123');
    expect(mockDialog.open).toHaveBeenCalledWith(SaleDetailsDialogComponent, expect.objectContaining({
      data: expect.objectContaining({
        sale: expect.objectContaining({
          id: 'sale-123',
          saleNumber: 'INV-2026-001',
          totalAmount: 450.5,
        }),
      }),
      width: '680px',
      panelClass: 'pos-receipt-modal',
    }));
  });

  it('should render clickable rows in the sales table and trigger openSaleDetail when clicked', () => {
    component.setTab('sales');
    component.salesData.set(mockSalesReport);
    fixture.detectChanges();

    const salesRow: HTMLTableRowElement | null = fixture.nativeElement.querySelector('tr.sales-row.clickable-row');
    expect(salesRow).toBeTruthy();

    salesRow?.click();

    expect(mockSaleService.getSaleById).toHaveBeenCalledWith('sale-123');
    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should trigger openSaleDetail on keydown.enter on the sales row', () => {
    component.setTab('sales');
    component.salesData.set(mockSalesReport);
    fixture.detectChanges();

    const salesRow: HTMLTableRowElement | null = fixture.nativeElement.querySelector('tr.sales-row.clickable-row');
    expect(salesRow).toBeTruthy();

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    salesRow?.dispatchEvent(enterEvent);

    expect(mockSaleService.getSaleById).toHaveBeenCalledWith('sale-123');
    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should trigger openSaleDetail when clicking the action receipt button', () => {
    component.setTab('sales');
    component.salesData.set(mockSalesReport);
    fixture.detectChanges();

    const actionBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector('button.action-btn');
    expect(actionBtn).toBeTruthy();

    actionBtn?.click();

    expect(mockSaleService.getSaleById).toHaveBeenCalledWith('sale-123');
    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should render the sales transaction table above the charts row', () => {
    component.setTab('sales');
    component.salesData.set(mockSalesReport);
    fixture.detectChanges();

    const reportSection = fixture.nativeElement.querySelector('.report-section');
    const tableCard = reportSection?.querySelector('.table-card');
    const chartsRow = reportSection?.querySelector('.charts-row');

    expect(tableCard).toBeTruthy();
    expect(chartsRow).toBeTruthy();

    // Verify tableCard appears before chartsRow in DOM order
    expect(tableCard.compareDocumentPosition(chartsRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
