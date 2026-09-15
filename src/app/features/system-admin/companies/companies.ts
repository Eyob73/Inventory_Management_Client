import { FormsModule } from '@angular/forms';
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SystemService, TenantDto } from '../../../services/system';
import { ConfirmDialogService } from '../../../ui/confirm-dialog/confirm-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    TranslocoModule,
    FormsModule,
    CommonModule, 
    RouterModule,
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TableSkeleton
  ],
  templateUrl: './companies.html',
  styleUrl: './companies.scss',
})
export class Companies implements OnInit, OnDestroy {
  private systemService = inject(SystemService);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);
  private snackBar = inject(MatSnackBar);
  private transloco = inject(TranslocoService);
  
  companies = signal<TenantDto[]>([]);
  loading = signal<boolean>(true);
  displayedColumns = ['name', 'code', 'status', 'createdAt', 'actions'];

  // Pagination state
  totalLength = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  pageSizeOptions = [5, 10, 25, 50, 100];

  // Sorting state
  sortActive = signal<string>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Filter state
  searchQuery = signal<string>('');
  statusFilter = signal<number | null>(null);
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.pageIndex.set(0);
      this.loadCompanies();
    });

    this.loadCompanies();
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  clearSearch() {
    this.searchSubject.next('');
  }

  onStatusChange(status: number | null) {
    this.statusFilter.set(status);
    this.pageIndex.set(0);
    this.loadCompanies();
  }

  loadCompanies() {
    this.loading.set(true);
    // pageIndex is 0-based in MatPaginator, API is 1-based
    this.systemService.getPagedTenants(
      this.pageIndex() + 1, 
      this.pageSize(), 
      this.searchQuery(),
      this.statusFilter() ?? undefined,
      this.sortActive(), 
      this.sortDirection() === 'desc'
    ).subscribe({
      next: (data) => {
        this.companies.set(data.items);
        this.totalLength.set(data.totalCount);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(this.transloco.translate('systemAdmin.companies.loadFailed'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000});
      }
    });
  }

  onPage(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadCompanies();
  }

  onSort(sort: Sort) {
    if (!sort.active || sort.direction === '') {
      this.sortActive.set('createdAt');
      this.sortDirection.set('desc');
    } else {
      this.sortActive.set(sort.active);
      this.sortDirection.set(sort.direction);
    }
    this.pageIndex.set(0); // Reset to first page on sort
    this.loadCompanies();
  }

  getStatusName(status: number): string {
    switch (status) {
      case 0: return this.transloco.translate('systemAdmin.common.active');
      case 1: return this.transloco.translate('systemAdmin.common.suspended');
      case 2: return this.transloco.translate('systemAdmin.common.deactivated');
      default: return this.transloco.translate('systemAdmin.common.unknown');
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'status-active';
      case 1: return 'status-suspended';
      case 2: return 'status-deactivated';
      default: return '';
    }
  }

  viewCompany(id: string) {
    this.router.navigate(['/system-admin/companies', id]);
  }

  viewUsers(id: string) {
    this.router.navigate(['/system-admin/companies', id, 'users']);
  }

  activate(company: TenantDto) {
    this.systemService.activateTenant(company.id).subscribe({
      next: () => {
        this.snackBar.open(this.transloco.translate('systemAdmin.companies.activateSuccess'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000});
        this.loadCompanies();
      },
      error: () => this.snackBar.open(this.transloco.translate('systemAdmin.companies.activateFailed'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000})
    });
  }

  suspend(company: TenantDto) {
    this.confirmDialog
      .confirm({
        title: this.transloco.translate('systemAdmin.companies.suspendTitle'),
        message: `Are you sure you want to suspend ${company.name}? Users belonging to this company will no longer be able to use the system.`,
        confirmText: this.transloco.translate('systemAdmin.common.suspendCompany'),
        cancelText: this.transloco.translate('systemAdmin.common.cancel')
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.systemService.suspendTenant(company.id).subscribe({
          next: () => {
            this.snackBar.open(this.transloco.translate('systemAdmin.companies.suspendSuccess'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000});
            this.loadCompanies();
          },
          error: () => this.snackBar.open(this.transloco.translate('systemAdmin.companies.suspendFailed'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000})
        });
      });
  }

  deactivate(company: TenantDto) {
    this.confirmDialog
      .confirm({
        title: this.transloco.translate('systemAdmin.companies.deactivateTitle'),
        message: `This will prevent users from accessing the company ${company.name}.`,
        confirmText: this.transloco.translate('systemAdmin.common.deactivate'),
        cancelText: 'Cancel'
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.systemService.deactivateTenant(company.id).subscribe({
          next: () => {
            this.snackBar.open(this.transloco.translate('systemAdmin.companies.deactivateSuccess'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000});
            this.loadCompanies();
          },
          error: () => this.snackBar.open(this.transloco.translate('systemAdmin.companies.deactivateFailed'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000})
        });
      });
  }
}
