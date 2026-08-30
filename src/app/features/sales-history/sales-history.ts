import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Material Modules
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services & Models
import { SaleService } from '../../services/sale.service';
import { AuthService } from '../../services/auth';
import { Sale, SaleFilter } from '../../models/sale.model';
import { SaleDetailsDialogComponent } from '../../component/sale-details-dialog/sale-details-dialog';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './sales-history.html',
  styleUrl: './sales-history.scss'
})
export class SalesHistoryComponent implements OnInit {
  private saleService = inject(SaleService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  sales = signal<Sale[]>([]);
  totalCount = signal<number>(0);
  isLoading = signal<boolean>(false);

  dataSource = new MatTableDataSource<Sale>([]);

  @ViewChild(MatSort) set sort(sort: MatSort | undefined) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  // Filters
  searchTerm = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');
  selectedPaymentMethod = signal<string>('');
  selectedStatus = signal<string>('');

  pageIndex = signal<number>(1);
  pageSize = signal<number>(10);

  displayedColumns: string[] = [
    'number',
    'saleNumber',
    'date',
    'cashier',
    'customer',
    'paymentMethod',
    'itemsCount',
    'totalAmount',
    'status',
    'actions'
  ];

  get isSalesRole(): boolean {
    return this.authService.hasRole('Sales') && !this.authService.hasRole('Admin') && !this.authService.hasRole('Manager');
  }

  get canCancelSale(): boolean {
    return this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
  }

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (item: Sale, property: string) => {
      switch (property) {
        case 'saleNumber': return item.saleNumber || '';
        case 'date': return item.saleDate ? new Date(item.saleDate).getTime() : 0;
        case 'cashier': return item.cashierName || '';
        case 'customer': return item.customerName || '';
        case 'paymentMethod': return item.paymentMethod || '';
        case 'itemsCount': return item.items ? item.items.length : 0;
        case 'totalAmount': return item.totalAmount || 0;
        case 'status': return item.status || '';
        default: return (item as any)[property];
      }
    };
    this.loadSales();
  }

  loadSales(): void {
    this.isLoading.set(true);

    const filter: SaleFilter = {
      searchTerm: this.searchTerm().trim() || undefined,
      startDate: this.startDate() || undefined,
      endDate: this.endDate() || undefined,
      paymentMethod: this.selectedPaymentMethod() || undefined,
      status: this.selectedStatus() || undefined,
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize()
    };

    this.saleService.getPagedSales(filter).subscribe({
      next: (res) => {
        const data = res.items || [];
        this.sales.set(data);
        this.dataSource.data = data;
        this.totalCount.set(res.totalCount || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open('Failed to load sales history.', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadSales();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.selectedPaymentMethod.set('');
    this.selectedStatus.set('');
    this.pageIndex.set(1);
    this.loadSales();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadSales();
  }

  viewDetails(sale: Sale): void {
    this.dialog.open(SaleDetailsDialogComponent, {
      data: { sale },
      width: '680px',
      panelClass: 'pos-receipt-modal'
    });
  }

  cancelSale(sale: Sale): void {
    if (!this.canCancelSale) {
      this.snackBar.open('Only Admins and Managers can cancel sales.', 'Close', { duration: 3000 });
      return;
    }

    if (confirm(`Are you sure you want to cancel Sale #${sale.saleNumber}? This will restore stock.`)) {
      this.saleService.cancelSale(sale.id).subscribe({
        next: () => {
          this.snackBar.open(`Sale #${sale.saleNumber} cancelled and stock restored.`, 'Success', {
            duration: 3500
          });
          this.loadSales();
        },
        error: (err) => {
          const msg = err?.error?.detail || 'Failed to cancel sale.';
          this.snackBar.open(msg, 'Close', { duration: 4000 });
        }
      });
    }
  }
}
