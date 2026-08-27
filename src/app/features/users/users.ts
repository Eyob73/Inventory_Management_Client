import { Component, inject, signal, OnInit, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';
import { UserService, SystemUser } from '../../services/user.service';
import { UserStore } from '../../store/users.store';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    TableSkeleton,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class UsersComponent implements OnInit {
  readonly store = inject(UserStore);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);

  showCreateForm = signal(false);
  savingId = signal<string | null>(null);
  hidePassword = signal(true);
  error = signal<string | null>(null);

  dataSource = new MatTableDataSource<SystemUser>([]);
  pageSizeOptions = [5, 10, 15, 25, 50];

  readonly displayedColumns = ['no', 'user', 'email', 'role', 'status', 'actions'];
  readonly ROLES = ['Admin', 'Manager', 'Sales', 'User'];

  readonly skeletonColumns: TableSkeletonColumn[] = [
    { width: '6%' },
    { width: '25%', dual: true },
    { width: '25%' },
    { width: '18%' },
    { width: '13%' },
    { width: '13%' },
  ];

  @ViewChild(MatSort) set sort(sort: MatSort | undefined) {
    if (sort) this.dataSource.sort = sort;
  }

  constructor() {
    // Keep dataSource in sync with store
    effect(() => {
      this.dataSource.data = this.store.users();
    });
  }

  ngOnInit() {
    this.store.loadUsers({ page: 1, pageSize: 10 });
  }

  onPageChange(event: PageEvent): void {
    this.store.loadUsers({
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
      search: this.store.search() || undefined,
    });
  }

  applyFilter(event: Event) {
    const search = (event.target as HTMLInputElement).value.trim();
    this.store.loadUsers({ page: 1, pageSize: this.store.pageSize(), search });
  }

  readonly stats = this.store.stats;

  createForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: [''],
    userName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
    role: ['User', Validators.required],
  });

  createUser() {
    if (this.createForm.invalid) return;
    const val = this.createForm.value;
    this.userService
      .createUser({
        email: val.email!,
        userName: val.userName || undefined,
        password: val.password!,
        firstName: val.firstName ?? undefined,
        lastName: val.lastName ?? undefined,
        role: val.role!,
      })
      .subscribe({
        next: () => {
          this.showCreateForm.set(false);
          this.createForm.reset({ role: 'User' });
          // Reload current page
          this.store.loadUsers({ page: this.store.page(), pageSize: this.store.pageSize() });
        },
        error: (err) => {
          const apiErrors = err?.error?.errors;
          if (Array.isArray(apiErrors) && apiErrors.length > 0) {
            this.error.set(apiErrors.join(' '));
          } else {
            this.error.set(err?.error?.detail || 'Failed to create user.');
          }
        },
      });
  }

  toggleStatus(user: SystemUser) {
    this.savingId.set(user.id);
    this.userService.toggleActive(user.id).subscribe({
      next: () => {
        this.savingId.set(null);
        this.store.loadUsers({ page: this.store.page(), pageSize: this.store.pageSize() });
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to update user status.');
        this.savingId.set(null);
      },
    });
  }

  editUser(user: SystemUser) {
    this.router.navigate(['/users/edit', user.id]);
  }

  deleteUser(user: SystemUser) {
    this.confirmDialog
      .confirmDelete('User Account', this.getUserName(user))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.savingId.set(user.id);
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.savingId.set(null);
            // If last item on page, go back one
            const newPage = this.store.users().length === 1 && this.store.page() > 1
              ? this.store.page() - 1
              : this.store.page();
            this.store.loadUsers({ page: newPage, pageSize: this.store.pageSize() });
          },
          error: (err) => {
            this.error.set(err?.error?.detail || 'Failed to delete user.');
            this.savingId.set(null);
          },
        });
      });
  }

  getUserName(user: SystemUser): string {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    if (fullName) return fullName;
    if (user.userName && user.userName !== user.email) return user.userName;
    return user.email;
  }

  getUserInitials(user: SystemUser): string {
    if (user.firstName || user.lastName) {
      const f = (user.firstName || '').charAt(0);
      const l = (user.lastName || '').charAt(0);
      return (f + l).toUpperCase() || 'U';
    }
    if (user.userName && user.userName !== user.email) {
      return user.userName.slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  }

  shouldShowUsernameHandle(user: SystemUser): boolean {
    if (!user.userName) return false;
    if (user.userName === user.email) return false;
    if (user.userName === this.getUserName(user)) return false;
    return true;
  }

  getPrimaryRole(user: SystemUser): string {
    return user.roles?.[0] ?? 'User';
  }

  cancelCreate() {
    this.showCreateForm.set(false);
    this.createForm.reset({ role: 'User' });
  }

  dismissError() {
    this.error.set(null);
  }
}
