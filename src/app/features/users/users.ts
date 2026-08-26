import { Component, inject, signal, computed, OnInit, ViewChild, effect } from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';
import { UserService, SystemUser } from '../../services/user.service';
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
    TableSkeleton,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);

  users = signal<SystemUser[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  showCreateForm = signal(false);
  editingUser = signal<SystemUser | null>(null);
  savingId = signal<string | null>(null);
  hidePassword = signal(true);

  dataSource = new MatTableDataSource<SystemUser>([]);

  readonly displayedColumns = ['user', 'email', 'role', 'status', 'actions'];
  readonly ROLES = ['Admin', 'Manager', 'Sales', 'User'];

  readonly skeletonColumns: TableSkeletonColumn[] = [
    { width: '25%', dual: true },
    { width: '25%' },
    { width: '20%' },
    { width: '15%' },
    { width: '15%' },
  ];

  @ViewChild(MatSort) set sort(sort: MatSort | undefined) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  constructor() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'user':
          return this.getUserName(item).toLowerCase();
        case 'email':
          return item.email.toLowerCase();
        case 'role':
          return this.getPrimaryRole(item).toLowerCase();
        case 'status':
          return item.isActive ? 1 : 0;
        default:
          return (item as any)[property];
      }
    };

    this.dataSource.filterPredicate = (data, filter) => {
      const searchStr = (
        data.firstName +
        ' ' +
        data.lastName +
        ' ' +
        data.email +
        ' ' +
        data.userName +
        ' ' +
        this.getPrimaryRole(data)
      ).toLowerCase();
      return searchStr.includes(filter);
    };

    effect(() => {
      this.dataSource.data = this.users();
    });
  }

  readonly stats = computed(() => {
    const all = this.users();
    return {
      total: all.length,
      active: all.filter((u) => u.isActive).length,
      admin: all.filter((u) => u.roles.includes('Admin')).length,
      manager: all.filter((u) => u.roles.includes('Manager')).length,
      sales: all.filter((u) => u.roles.includes('Sales') || u.roles.includes('User')).length,
    };
  });

  createForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
    role: ['User', Validators.required],
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.error.set(null);
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to load users. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  createUser() {
    if (this.createForm.invalid) return;
    const val = this.createForm.value;
    this.userService
      .createUser({
        email: val.email!,
        password: val.password!,
        firstName: val.firstName ?? undefined,
        lastName: val.lastName ?? undefined,
        role: val.role!,
      })
      .subscribe({
        next: (user) => {
          this.users.update((list) => [user, ...list]);
          this.showCreateForm.set(false);
          this.createForm.reset({ role: 'User' });
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
      next: (res) => {
        const isLockedOut = res.isLockedOut;
        this.users.update((list) =>
          list.map((u) =>
            u.id === user.id ? { ...u, isLockedOut, isActive: !isLockedOut } : u
          )
        );
        this.savingId.set(null);
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
            this.users.update((list) => list.filter((u) => u.id !== user.id));
            this.savingId.set(null);
          },
          error: (err) => {
            this.error.set(err?.error?.detail || 'Failed to delete user.');
            this.savingId.set(null);
          },
        });
      });
  }

  getUserName(user: SystemUser): string {
    if (user.firstName) {
      return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
    }
    return user.userName || user.email;
  }

  getUserInitials(user: SystemUser): string {
    if (user.firstName) {
      const f = user.firstName.charAt(0);
      const l = user.lastName ? user.lastName.charAt(0) : '';
      return (f + l).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
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
