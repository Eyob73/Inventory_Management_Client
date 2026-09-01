import { Component, OnInit, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomerStore } from '../../store/customer.store';
import { Customer } from '../../models/customer.model';
import { AuthService } from '../../services/auth';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';
import { CustomerDialogComponent } from './customer-dialog/customer-dialog';
import { CustomerDetailsDialogComponent } from './customer-details-dialog/customer-details-dialog';

@Component({
  selector: 'app-customers',
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
  templateUrl: './customers.html',
  styleUrl: './customers.scss',
})
export class Customers implements OnInit {
  readonly store = inject(CustomerStore);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);

  dataSource = new MatTableDataSource<Customer>([]);
  pageSizeOptions = [5, 10, 15, 25, 50];

  displayedColumns = [
    'no',
    'name',
    'phoneNumber',
    'email',
    'address',
    'createdAt',
    'status',
    'totalSalesCount',
    'actions',
  ];

  readonly skeletonColumns: TableSkeletonColumn[] = [
    { width: '4%' },
    { width: '18%' },
    { width: '14%' },
    { width: '16%' },
    { width: '18%' },
    { width: '10%' },
    { width: '8%' },
    { width: '6%', align: 'center' },
    { width: '6%', align: 'center' },
  ];

  @ViewChild(MatSort) set sort(sort: MatSort | undefined) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  constructor() {
    effect(() => {
      this.dataSource.data = this.store.paginatedCustomers();
    });
  }

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (item: Customer, property: string) => {
      switch (property) {
        case 'name': return item.name || '';
        case 'phoneNumber': return item.phoneNumber || '';
        case 'email': return item.email || '';
        case 'address': return item.address || '';
        case 'createdAt': return item.createdAt ? new Date(item.createdAt).getTime() : 0;
        case 'status': return item.isActive !== false ? 1 : 0;
        case 'totalSalesCount': return item.totalSalesCount || 0;
        default: return (item as any)[property];
      }
    };
    this.store.loadCustomers();
  }

  // Role Checks
  get canAddCustomer(): boolean {
    return this.authService.hasRole('Admin') || this.authService.hasRole('Manager') || this.authService.hasRole('Sales');
  }

  get canEditCustomer(): boolean {
    return this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
  }

  get canDeleteCustomer(): boolean {
    return this.authService.hasRole('Admin');
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.setSearch(value);
  }

  onPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex + 1, event.pageSize);
  }

  openCreateDialog(): void {
    if (!this.canAddCustomer) {
      this.snackBar.open('You do not have permission to add customers.', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '500px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Customer added successfully.', 'Close', { duration: 3000 });
      }
    });
  }

  openEditDialog(customer: Customer): void {
    if (!this.canEditCustomer) {
      this.snackBar.open('You do not have permission to edit customers.', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '500px',
      data: { customer },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Customer updated successfully.', 'Close', { duration: 3000 });
      }
    });
  }

  openDetailsDialog(customer: Customer): void {
    this.dialog.open(CustomerDetailsDialogComponent, {
      width: '680px',
      data: { customerId: customer.id },
    });
  }

  onDelete(customer: Customer): void {
    if (!this.canDeleteCustomer) {
      this.snackBar.open('You do not have permission to delete customers.', 'Close', { duration: 3000 });
      return;
    }

    this.confirmDialog.confirmDelete('Customer', customer.name).subscribe((confirmed) => {
      if (confirmed) {
        this.store.deleteCustomer({
          id: customer.id,
          onSuccess: () => {
            this.snackBar.open(`Customer "${customer.name}" deleted successfully.`, 'Close', {
              duration: 3000,
            });
          },
          onError: (errMessage) => {
            this.snackBar.open(errMessage, 'Close', { duration: 5000 });
          },
        });
      }
    });
  }
}
