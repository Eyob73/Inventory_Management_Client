import { FormsModule } from '@angular/forms';
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SystemService, TenantDto } from '../../../services/system';
import { UserService, SystemUser } from '../../../services/user.service';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-system-users',
  standalone: true,
  imports: [
    TranslocoModule,
    FormsModule,
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TableSkeleton
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class SystemUsersComponent implements OnInit, OnDestroy {
  private systemService = inject(SystemService);
  private userService = inject(UserService);
  private transloco = inject(TranslocoService);

  users = signal<SystemUser[]>([]);
  companies = signal<Map<string, string>>(new Map());
  tenantsList = signal<TenantDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  displayedColumns = ['name', 'email', 'role', 'company'];

  // Pagination state
  totalLength = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  pageSizeOptions = [5, 10, 25, 50, 100];

  // Sorting state
  sortActive = signal<string>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Filter state
  searchQuery = signal<string>('');
  tenantFilter = signal<string | null>(null);
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.pageIndex.set(0);
      this.loadUsers();
    });

    this.systemService.getTenants().subscribe(tenants => {
      const companyMap = new Map<string, string>();
      tenants.forEach(t => companyMap.set(t.id.toLowerCase(), t.name));
      this.companies.set(companyMap);
      this.tenantsList.set(tenants);
      this.loadUsers();
    });
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

  onTenantChange(tenantId: string | null) {
    this.tenantFilter.set(tenantId);
    this.pageIndex.set(0);
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    // pageIndex is 0-based in MatPaginator, API is 1-based
    this.userService.getPagedUsers(
      this.pageIndex() + 1, 
      this.pageSize(), 
      this.searchQuery(),
      this.tenantFilter() ?? undefined,
      this.sortActive(), 
      this.sortDirection() === 'desc'
    ).subscribe({
      next: (data) => {
        this.users.set(data.items);
        this.totalLength.set(data.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.transloco.translate('systemAdmin.users.loadFailed'));
        this.loading.set(false);
      }
    });
  }

  onPage(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  onSort(sort: Sort) {
    if (!sort.active || sort.direction === '') {
      this.sortActive.set('name');
      this.sortDirection.set('asc');
    } else {
      this.sortActive.set(sort.active);
      this.sortDirection.set(sort.direction);
    }
    this.pageIndex.set(0); // Reset to first page on sort
    this.loadUsers();
  }

  getCompanyName(tenantId?: string): string {
    if (!tenantId) return this.transloco.translate('systemAdmin.users.systemAdmin');
    return this.companies().get(tenantId.toLowerCase()) || this.transloco.translate('systemAdmin.users.unknownCompany');
  }

  getTranslatedRole(role?: string): string {
    if (!role) return this.transloco.translate('systemAdmin.common.unknown');
    const key = 'shell.roles.' + role.toLowerCase();
    const translated = this.transloco.translate(key);
    return translated !== key ? translated : role;
  }

  getUserInitials(user: SystemUser): string {
    const f = (user.firstName || '').charAt(0);
    const l = (user.lastName || '').charAt(0);
    return (f + l).toUpperCase() || user.email.slice(0, 2).toUpperCase();
  }
}
