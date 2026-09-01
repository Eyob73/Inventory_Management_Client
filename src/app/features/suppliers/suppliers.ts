import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ViewChild } from '@angular/core';
import { SupplierStore } from '../../store/supplier.store';
import { Supplier } from '../../models/supplier.model';
import { AuthService } from '../../services/auth';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';
import { SupplierDialogComponent } from './supplier-dialog/supplier-dialog';
import { SupplierDetailsDialogComponent } from './supplier-details-dialog/supplier-details-dialog';

@Component({
  selector: 'app-suppliers',
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
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.scss',
})
export class Suppliers implements OnInit {
  readonly store = inject(SupplierStore);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);

  dataSource = new MatTableDataSource<Supplier>([]);
  pageSizeOptions = [5, 10, 15, 25, 50];

  displayedColumns = [
    'no',
    'name',
    'contactName',
    'phoneNumber',
    'email',
    'createdAt',
    'status',
    'actions',
  ];

  readonly skeletonColumns: TableSkeletonColumn[] = [
    { width: '4%' },
    { width: '18%' },
    { width: '16%' },
    { width: '14%' },
    { width: '16%' },
    { width: '12%' },
    { width: '8%' },
    { width: '12%', align: 'center' },
  ];

  @ViewChild(MatSort) set sort(sort: MatSort | undefined) {
    if (sort) this.dataSource.sort = sort;
  }

  constructor() {
    effect(() => {
      this.dataSource.data = this.store.paginatedSuppliers();
    });
  }

  ngOnInit(): void {
    this.store.loadSuppliers();
  }

  get canAdd(): boolean {
    return this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
  }

  get canEdit(): boolean {
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

  openCreateDialog(): void {
    if (!this.canAdd) {
      this.snackBar.open('You do not have permission to add suppliers.', 'Close', { duration: 3000 });
      return;
    }
    this.dialog.open(SupplierDialogComponent, { width: '500px', data: {} }).afterClosed().subscribe((ok) => {
      if (ok) this.snackBar.open('Supplier added successfully.', 'Close', { duration: 3000 });
    });
  }

  openEditDialog(supplier: Supplier): void {
    if (!this.canEdit) {
      this.snackBar.open('You do not have permission to edit suppliers.', 'Close', { duration: 3000 });
      return;
    }
    this.dialog.open(SupplierDialogComponent, { width: '500px', data: { supplier } }).afterClosed().subscribe((ok) => {
      if (ok) this.snackBar.open('Supplier updated successfully.', 'Close', { duration: 3000 });
    });
  }

  openDetailsDialog(supplier: Supplier): void {
    this.dialog.open(SupplierDetailsDialogComponent, {
      width: '720px',
      data: { supplierId: supplier.id },
    });
  }

  onDelete(supplier: Supplier): void {
    if (!this.canDelete) {
      this.snackBar.open('You do not have permission to delete suppliers.', 'Close', { duration: 3000 });
      return;
    }
    this.confirmDialog.confirmDelete('Supplier', supplier.name).subscribe((confirmed) => {
      if (!confirmed) return;
      this.store.deleteSupplier({
        id: supplier.id,
        onSuccess: () => this.snackBar.open(`Supplier "${supplier.name}" deleted successfully.`, 'Close', { duration: 3000 }),
        onError: (msg) => this.snackBar.open(msg, 'Close', { duration: 5000 }),
      });
    });
  }
}
