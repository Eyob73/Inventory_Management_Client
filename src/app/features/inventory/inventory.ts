import { Component, OnInit, inject, signal } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryApiService } from '../../services/inventory';
import { ProductService } from '../../services/product';
import { InventoryTransaction } from '../../models/inventory.model';
import { Product } from '../../models/products.model';
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';
import { StockAdjustmentDialogComponent } from './stock-adjustment-dialog/stock-adjustment-dialog';

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
    MatSnackBarModule,
    TableSkeleton,
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
  isLoading = signal(true);
  error = signal<string | null>(null);
  search = '';
  type = '';
  productId = '';
  pageIndex = 1;
  pageSize = 20;
  totalCount = 0;
  pageSizeOptions = [10, 20, 50, 100];

  displayedColumns = ['createdAt', 'productName', 'sku', 'type', 'quantity', 'previousQuantity', 'newQuantity', 'notes'];
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
