import { Component, OnInit, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';

import { ReportsService } from '../../services/reports.service';
import { CategoryService } from '../../services/category';
import { ProductService } from '../../services/product';
import { SupplierService } from '../../services/supplier';
import { CustomerService } from '../../services/customer.service';
import { UserService } from '../../services/user.service';

import {
  ReportFilter,
  DashboardReport,
  SalesReport,
  PurchasesReport,
  InventoryReport,
  LowStockReport,
  ProductPerformanceReport,
  CustomerReport,
  SupplierReport,
  ProfitReport,
  StockMovementReport,
} from '../../models/reports.model';

import { ReportLineChart } from './components/report-line-chart/report-line-chart';
import { ReportBarChart, BarDataItem } from './components/report-bar-chart/report-bar-chart';
import { ReportDonutChart } from './components/report-donut-chart/report-donut-chart';

type ReportTab =
  | 'dashboard'
  | 'sales'
  | 'purchases'
  | 'inventory'
  | 'low-stock'
  | 'products'
  | 'customers'
  | 'suppliers'
  | 'profit'
  | 'stock-transactions';

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatPaginatorModule,
    TableSkeleton,
    ReportLineChart,
    ReportBarChart,
    ReportDonutChart,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private reportsService = inject(ReportsService);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  private supplierService = inject(SupplierService);
  private customerService = inject(CustomerService);
  private userService = inject(UserService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly Math = Math;

  readonly skeletonColumns: TableSkeletonColumn[] = [
    { width: '15%' },
    { width: '20%' },
    { width: '15%' },
    { width: '15%' },
    { width: '15%' },
    { width: '20%' },
  ];

  // Active Tab
  activeTab = signal<ReportTab>('dashboard');

  // Filter State
  dateRangePreset = signal<string>('this_month');
  startDate = signal<string>('');
  endDate = signal<string>('');
  productId = signal<string>('');
  categoryId = signal<string>('');
  supplierId = signal<string>('');
  customerId = signal<string>('');
  userId = signal<string>('');
  status = signal<string>('');
  transactionType = signal<string>('');
  search = signal<string>('');
  page = signal<number>(1);
  pageSize = signal<number>(15);
  sortBy = signal<string>('');
  descending = signal<boolean>(true);

  // Lookup Options
  categories = signal<{ id: string; name: string }[]>([]);
  products = signal<{ id: string; name: string }[]>([]);
  suppliers = signal<{ id: string; name: string }[]>([]);
  customers = signal<{ id: string; name: string }[]>([]);
  users = signal<{ id: string; name: string }[]>([]);

  // Report Data
  dashboardData = signal<DashboardReport | null>(null);
  salesData = signal<SalesReport | null>(null);
  purchasesData = signal<PurchasesReport | null>(null);
  inventoryData = signal<InventoryReport | null>(null);
  lowStockData = signal<LowStockReport | null>(null);
  productPerfData = signal<ProductPerformanceReport | null>(null);
  customerData = signal<CustomerReport | null>(null);
  supplierData = signal<SupplierReport | null>(null);
  profitData = signal<ProfitReport | null>(null);
  stockData = signal<StockMovementReport | null>(null);

  loading = signal<boolean>(false);
  dateValidationError = signal<string | null>(null);

  // Computed chart data transformations
  salesBySupplierBarData = computed<BarDataItem[]>(() => {
    const p = this.purchasesData();
    if (!p?.purchasesBySupplier) return [];
    return p.purchasesBySupplier.map((item) => ({
      name: item.name,
      value: item.amount,
    }));
  });

  mostPurchasedBarData = computed<BarDataItem[]>(() => {
    const p = this.purchasesData();
    if (!p?.mostPurchasedProducts) return [];
    return p.mostPurchasedProducts.map((item) => ({
      name: item.name,
      value: item.quantity,
    }));
  });

  topProductsBarData = computed<BarDataItem[]>(() => {
    const d = this.dashboardData();
    if (d?.topProducts?.length) {
      return d.topProducts.map((item) => ({ name: item.name, value: item.quantity }));
    }
    const s = this.salesData();
    if (s?.topSellingProducts?.length) {
      return s.topSellingProducts.map((item) => ({ name: item.name, value: item.quantity }));
    }
    return [];
  });

  ngOnInit(): void {
    this.initPresetDates('this_month');
    this.loadDropdownOptions();
    this.loadReport();
  }

  setTab(tab: ReportTab): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.page.set(1);
    this.search.set('');
    this.sortBy.set('');
    this.loadReport();
  }

  onPresetChange(preset: string): void {
    this.dateRangePreset.set(preset);
    if (preset !== 'custom') {
      this.initPresetDates(preset);
      this.applyFilters();
    }
  }

  private initPresetDates(preset: string): void {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'this_week': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        end = new Date();
        break;
      }
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      case 'this_month':
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
    }

    this.startDate.set(this.formatDateInput(start));
    this.endDate.set(this.formatDateInput(end));
    this.dateValidationError.set(null);
  }

  private formatDateInput(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  applyFilters(): void {
    if (this.startDate() && this.endDate() && this.startDate() > this.endDate()) {
      this.dateValidationError.set('Start Date must be less than or equal to End Date.');
      return;
    }
    this.dateValidationError.set(null);
    this.page.set(1);
    this.loadReport();
  }

  resetFilters(): void {
    this.productId.set('');
    this.categoryId.set('');
    this.supplierId.set('');
    this.customerId.set('');
    this.userId.set('');
    this.status.set('');
    this.transactionType.set('');
    this.search.set('');
    this.sortBy.set('');
    this.page.set(1);
    this.initPresetDates('this_month');
    this.loadReport();
  }

  onMatPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadReport();
  }

  onSearchChange(term: string): void {
    this.search.set(term);
    this.page.set(1);
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    const filter = this.buildFilterPayload();

    switch (this.activeTab()) {
      case 'dashboard':
        this.reportsService.getDashboard(filter).subscribe({
          next: (res) => {
            this.dashboardData.set(res);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        break;
      case 'sales':
        this.reportsService.getSales(filter).subscribe({
          next: (res) => {
            this.salesData.set(res);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        break;
      case 'purchases':
        this.reportsService.getPurchases(filter).subscribe({
          next: (res) => {
            this.purchasesData.set(res);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        break;
      case 'inventory':
        this.reportsService.getInventory(filter).subscribe({
          next: (res) => {
            this.inventoryData.set(res);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        break;
      case 'low-stock':
        this.reportsService.getLowStock(filter).subscribe({
          next: (res) => {
            this.lowStockData.set(res);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        break;
      case 'products':
        this.reportsService.getProducts(filter).subscribe({
          next: (res) => {
            this.productPerfData.set(res);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        break;
      case 'customers':
        this.reportsService.getCustomers(filter).subscribe({
          next: (res) => {
            this.customerData.set(res);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        break;
      case 'suppliers':
        this.reportsService.getSuppliers(filter).subscribe({
          next: (res) => {
            this.supplierData.set(res);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        break;
      case 'profit':
        this.reportsService.getProfit(filter).subscribe({
          next: (res) => {
            this.profitData.set(res);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        break;
      case 'stock-transactions':
        this.reportsService.getStockMovements(filter).subscribe({
          next: (res) => {
            this.stockData.set(res);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        break;
    }
  }

  private buildFilterPayload(): ReportFilter {
    return {
      dateRangePreset: this.dateRangePreset() as any,
      startDate: this.startDate() || undefined,
      endDate: this.endDate() || undefined,
      productId: this.productId() || undefined,
      categoryId: this.categoryId() || undefined,
      supplierId: this.supplierId() || undefined,
      customerId: this.customerId() || undefined,
      userId: this.userId() || undefined,
      status: this.status() || undefined,
      transactionType: this.transactionType() || undefined,
      search: this.search() || undefined,
      page: this.page(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy() || undefined,
      descending: this.descending(),
    };
  }

  exportReport(format: 'csv' | 'xlsx'): void {
    const reportType = this.activeTab() === 'dashboard' ? 'sales' : this.activeTab();
    const filter = this.buildFilterPayload();
    this.reportsService.exportReport(reportType, filter, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open(`Exported ${reportType} report successfully.`, 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to export report.', 'Close', { duration: 3000 });
      },
    });
  }

  printReport(): void {
    window.print();
  }

  navigateToPurchase(): void {
    this.router.navigate(['/purchases/new']);
  }

  private loadDropdownOptions(): void {
    this.categoryService.getAll().subscribe({
      next: (cats) => this.categories.set(cats.map((c) => ({ id: c.id, name: c.name }))),
      error: () => {},
    });
    this.productService.getCatalog().subscribe({
      next: (prods) => this.products.set(prods.map((p) => ({ id: p.id, name: `${p.name} (${p.sku})` }))),
      error: () => {},
    });
    this.supplierService.getAll().subscribe({
      next: (sups) => this.suppliers.set(sups.map((s) => ({ id: s.id, name: s.name }))),
      error: () => {},
    });
    this.customerService.getAll().subscribe({
      next: (custs) => this.customers.set(custs.map((c) => ({ id: c.id, name: c.name }))),
      error: () => {},
    });
    this.userService.getUsers().subscribe({
      next: (uList) =>
        this.users.set(
          uList.map((u) => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userName || u.email,
          }))
        ),
      error: () => {},
    });
  }
}
