import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ViewChild } from '@angular/core';
import { PurchaseStore } from '../../store/purchase.store';
import { Purchase } from '../../models/purchase.model';
import { PurchaseService } from '../../services/purchase';
import { AuthService } from '../../services/auth';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    TableSkeleton,
  ],
  templateUrl: './purchases.html',
  styleUrl: './purchases.scss',
})
export class Purchases implements OnInit {
  readonly store = inject(PurchaseStore);
  private router = inject(Router);
  private purchaseApi = inject(PurchaseService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);

  dataSource = new MatTableDataSource<Purchase>([]);
  pageSizeOptions = [5, 10, 15, 25, 50];

  displayedColumns = [
    'no',
    'purchaseNumber',
    'supplierName',
    'purchaseDate',
    'items',
    'totalAmount',
    'status',
    'actions',
  ];

  readonly skeletonColumns: TableSkeletonColumn[] = [
    { width: '4%' },
    { width: '14%' },
    { width: '18%' },
    { width: '14%' },
    { width: '8%' },
    { width: '12%' },
    { width: '10%' },
    { width: '16%', align: 'center' },
  ];

  @ViewChild(MatSort) set sort(sort: MatSort | undefined) {
    if (sort) this.dataSource.sort = sort;
  }

  constructor() {
    effect(() => {
      this.dataSource.data = this.store.paginatedPurchases();
    });
  }

  ngOnInit(): void {
    this.store.loadPurchases();
  }

  get canManage(): boolean {
    return this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
  }

  get canDelete(): boolean {
    return this.authService.hasRole('Admin');
  }

  applyFilter(event: Event): void {
    this.store.setSearch((event.target as HTMLInputElement).value);
  }

  onPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex + 1, event.pageSize);
  }

  openCreate(): void {
    this.router.navigate(['/purchases/new']);
  }

  openDetails(row: Purchase): void {
    this.router.navigate(['/purchases', row.id]);
  }

  openEdit(row: Purchase): void {
    if (row.status !== 'Draft') {
      this.snackBar.open('Only draft purchases can be edited.', 'Close', { duration: 3000 });
      return;
    }
    this.router.navigate(['/purchases', row.id, 'edit']);
  }

  complete(row: Purchase): void {
    this.confirmDialog
      .confirmWarning(
        'Complete purchase',
        `Receive stock for "${row.purchaseNumber}"? Quantities will be added to inventory.`,
        'Complete'
      )
      .subscribe((ok) => {
        if (!ok) return;
        this.purchaseApi.complete(row.id).subscribe({
          next: () => {
            this.snackBar.open(`Purchase ${row.purchaseNumber} completed.`, 'Close', { duration: 3000 });
            this.store.loadPurchases();
          },
          error: (err) => this.snackBar.open(this.errMsg(err, 'Failed to complete purchase'), 'Close', { duration: 5000 }),
        });
      });
  }

  cancel(row: Purchase): void {
    const message =
      row.status === 'Completed'
        ? `Cancel "${row.purchaseNumber}"? Stock received from this purchase will be reversed.`
        : `Cancel draft "${row.purchaseNumber}"?`;
    this.confirmDialog.confirmWarning('Cancel purchase', message, 'Cancel purchase').subscribe((ok) => {
      if (!ok) return;
      this.purchaseApi.cancel(row.id).subscribe({
        next: () => {
          this.snackBar.open(`Purchase ${row.purchaseNumber} cancelled.`, 'Close', { duration: 3000 });
          this.store.loadPurchases();
        },
        error: (err) => this.snackBar.open(this.errMsg(err, 'Failed to cancel purchase'), 'Close', { duration: 5000 }),
      });
    });
  }

  deleteDraft(row: Purchase): void {
    if (!this.canDelete) return;
    this.confirmDialog.confirmDelete('Purchase', row.purchaseNumber).subscribe((ok) => {
      if (!ok) return;
      this.purchaseApi.delete(row.id).subscribe({
        next: () => {
          this.snackBar.open(`Purchase ${row.purchaseNumber} deleted.`, 'Close', { duration: 3000 });
          this.store.loadPurchases();
        },
        error: (err) => this.snackBar.open(this.errMsg(err, 'Failed to delete purchase'), 'Close', { duration: 5000 }),
      });
    });
  }

  statusClass(status: string): string {
    if (status === 'Completed') return 'status--active';
    if (status === 'Cancelled') return 'status--inactive';
    return 'status--draft';
  }

  private errMsg(err: any, fallback: string): string {
    return typeof err?.error === 'string' ? err.error : err?.error?.detail || err?.message || fallback;
  }
}
