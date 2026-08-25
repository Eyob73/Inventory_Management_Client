import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { UserService, SystemUser } from '../../services/user.service';

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
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  users = signal<SystemUser[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');
  showCreateForm = signal(false);
  editingUser = signal<SystemUser | null>(null);
  savingId = signal<string | null>(null);

  readonly ROLES = ['Admin', 'Manager', 'Sales'];

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.users();
    return this.users().filter((u) =>
      (u.firstName + ' ' + u.lastName + ' ' + u.email + ' ' + u.userName)
        .toLowerCase()
        .includes(q)
    );
  });

  readonly stats = computed(() => {
    const all = this.users();
    return {
      total: all.length,
      active: all.filter((u) => u.isActive).length,
      admin: all.filter((u) => u.roles.includes('Admin')).length,
      manager: all.filter((u) => u.roles.includes('Manager')).length,
      sales: all.filter((u) => u.roles.includes('Sales')).length,
    };
  });

  createForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['Sales', Validators.required],
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
      error: () => {
        this.error.set('Failed to load users. Please try again.');
        this.isLoading.set(false);
      },
    });
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
          this.createForm.reset({ role: 'Sales' });
        },
        error: () => this.error.set('Failed to create user.'),
      });
  }

  toggleStatus(user: SystemUser) {
    this.savingId.set(user.id);
    this.userService.toggleActive(user.id, !user.isActive).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
        );
        this.savingId.set(null);
      },
      error: () => {
        this.error.set('Failed to update user status.');
        this.savingId.set(null);
      },
    });
  }

  changeRole(user: SystemUser, newRole: string) {
    this.savingId.set(user.id);
    this.userService.updateUser(user.id, { role: newRole }).subscribe({
      next: (updated) => {
        this.users.update((list) =>
          list.map((u) => (u.id === user.id ? { ...u, roles: updated.roles } : u))
        );
        this.savingId.set(null);
      },
      error: () => {
        this.error.set('Failed to update role.');
        this.savingId.set(null);
      },
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
    return user.roles?.[0] ?? 'Unknown';
  }

  getRoleClass(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin': return 'role--admin';
      case 'manager': return 'role--manager';
      case 'sales': return 'role--sales';
      default: return 'role--default';
    }
  }

  cancelCreate() {
    this.showCreateForm.set(false);
    this.createForm.reset({ role: 'Sales' });
  }

  dismissError() {
    this.error.set(null);
  }
}
