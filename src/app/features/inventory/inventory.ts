import { TranslocoDirective } from '@jsverse/transloco';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryApiService } from '../../services/inventory';
import { ProductService } from '../../services/product';
import { InventoryTransaction } from '../../models/inventory.model';
import { Product } from '../../models/products.model';
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';
import { StockAdjustmentDialogComponent } from './stock-adjustment-dialog/stock-adjustment-dialog';
import { DataViewComponent, DataViewCardField } from '../../shared/components/data-view/data-view.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    TableSkeleton, 
    TranslocoDirective,
    DataViewComponent
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
})
export class Inventory implements OnInit {
  private inventoryApi = inject(InventoryApiService);
  private productApi = inject(ProductService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<InventoryTransaction>([]);
  products = signal<Product[]>([]);
  
  productSearch = signal('');
  filteredProducts = computed(() => {
    const term = this.productSearch().toLowerCase();
    return this.products().filter(p => 
      p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
    );
  });

  isLoading = signal(true);
  error = signal<string | null>(null);
  search = '';
  type = '';
  productId = '';
  selectedDateRange = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');
  pageIndex = 1;
  pageSize = 20;
  totalCount = 0;
  pageSizeOptions = [10, 20, 50, 100];

  displayedColumns = ['createdAt', 'productName', 'sku', 'type', 'quantity', 'previousQuantity', 'newQuantity', 'notes'];
  
  cardFields = computed<DataViewCardField[]>(() => [
    { key: 'productName', type: 'text' },
    { key: 'sku', label: 'SKU', type: 'code' },
    { key: 'type', label: 'Type', type: 'badge', badgeClassFn: (t) => this.typeClass(t.type), valueFn: (t) => t.type },
    { key: 'quantity', label: 'Quantity', type: 'text', valueFn: (t) => t.quantity > 0 ? `+${t.quantity}` : String(t.quantity) },
    { key: 'newQuantity', label: 'New Stock', type: 'text' },
    { key: 'createdAt', label: 'Date', type: 'date' }
  ]);

  readonly skeletonColumns: TableSkeletonColumn[] = [
    { width: '14%' },
    { width: '18%' },
    { width: '10%' },
    { width: '10%' },
    { width: '8%' },
    { width: '8%' },
    { width: '8%' },
    { width: '24%' },
  ];
  readonly types = ['Purchase', 'Sale', 'Adjustment', 'Return', 'PurchaseReversal', 'SaleReturn'];

  ngOnInit(): void {
    this.productApi.getCatalog().subscribe({
      next: (list) => this.products.set(list),
    });
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.inventoryApi
      .getTransactions({
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        searchTerm: this.search || undefined,
        type: this.type || undefined,
        productId: this.productId || undefined,
        dateRange: this.selectedDateRange() || undefined,
        startDate: this.startDate() || undefined,
        endDate: this.endDate() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.dataSource.data = res.items || [];
          this.totalCount = res.totalCount || 0;
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(
            typeof err?.error === 'string' ? err.error : err?.error?.detail || err?.message || 'Failed to load inventory'
          );
          this.isLoading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.pageIndex = 1;
    this.load();
  }

  onDateRangeChange(preset: string): void {
    this.selectedDateRange.set(preset);
    if (preset === 'custom') {
      this.pageIndex = 1;
      this.load();
      return;
    }

    if (!preset) {
      this.startDate.set('');
      this.endDate.set('');
    } else {
      this.setPresetDates(preset);
    }

    this.pageIndex = 1;
    this.load();
  }

  setPresetDates(preset: string): void {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case 'yesterday': {
        const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        start = y;
        end = y;
        break;
      }

      case 'this_week': {
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
        end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
        break;
      }

      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;

      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;

      default:
        this.startDate.set('');
        this.endDate.set('');
        return;
    }

    this.startDate.set(this.formatDate(start));
    this.endDate.set(this.formatDate(end));
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onStartDateChange(date: Date | string | null): void {
    if (date) {
      if (date instanceof Date) {
        this.startDate.set(this.formatDate(date));
      } else if (typeof date === 'string') {
        this.startDate.set(date);
      }
      this.selectedDateRange.set('custom');
    } else {
      this.startDate.set('');
      if (!this.endDate()) {
        this.selectedDateRange.set('');
      } else {
        this.selectedDateRange.set('custom');
      }
    }
    this.applyFilters();
  }

  onEndDateChange(date: Date | string | null): void {
    if (date) {
      if (date instanceof Date) {
        this.endDate.set(this.formatDate(date));
      } else if (typeof date === 'string') {
        this.endDate.set(date);
      }
      this.selectedDateRange.set('custom');
    } else {
      this.endDate.set('');
      if (!this.startDate()) {
        this.selectedDateRange.set('');
      } else {
        this.selectedDateRange.set('custom');
      }
    }
    this.applyFilters();
  }

  resetFilters(): void {
    this.search = '';
    this.productId = '';
    this.type = '';
    this.selectedDateRange.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.pageIndex = 1;
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.load();
  }

  openAdjustment(): void {
    this.dialog
      .open(StockAdjustmentDialogComponent, {
        width: '520px',
        data: { products: this.products() },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.snackBar.open('Stock adjustment saved.', 'Close', { duration: 3000 });
        this.productApi.getCatalog().subscribe({ next: (list) => this.products.set(list) });
        this.load();
      });
  }

  typeClass(type: string): string {
    if (type === 'Purchase' || type === 'SaleReturn' || type === 'Return') return 'status--active';
    if (type === 'Sale' || type === 'PurchaseReversal') return 'status--inactive';
    return 'status--draft';
  }
}
