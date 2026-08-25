import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent {
  readonly authStore = inject(AuthStore);

  readonly user = computed(() => this.authStore.user());
  readonly role = computed(() => this.authStore.userRole());

  readonly fullName = computed(() => {
    const u = this.user();
    if (!u) return 'User';
    if (u.firstName) {
      return u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName;
    }
    return u.userName || u.email?.split('@')[0] || 'User';
  });

  readonly initials = computed(() => {
    const u = this.user();
    if (u?.firstName) {
      const f = u.firstName.charAt(0);
      const l = u.lastName ? u.lastName.charAt(0) : '';
      return (f + l).toUpperCase();
    }
    const name = this.fullName();
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  });

  readonly roleColor = computed(() => {
    switch (this.role()?.toLowerCase()) {
      case 'admin': return 'role--admin';
      case 'manager': return 'role--manager';
      case 'sales': return 'role--sales';
      default: return 'role--default';
    }
  });

  readonly roleIcon = computed(() => {
    switch (this.role()?.toLowerCase()) {
      case 'admin': return 'shield';
      case 'manager': return 'manage_accounts';
      case 'sales': return 'point_of_sale';
      default: return 'person';
    }
  });

  /** Permission matrix for display */
  readonly permissions = computed(() => {
    const role = (this.role() ?? '').toLowerCase();
    return [
      { label: 'View Dashboard', granted: true },
      { label: 'View Products', granted: true },
      { label: 'Create & Edit Products', granted: role === 'admin' || role === 'manager' },
      { label: 'Delete Products', granted: role === 'admin' },
      { label: 'Manage Inventory', granted: role === 'admin' || role === 'manager' },
      { label: 'Create Sales', granted: true },
      { label: 'Manage Customers', granted: true },
      { label: 'Manage Suppliers', granted: role === 'admin' || role === 'manager' },
      { label: 'View Reports', granted: role === 'admin' || role === 'manager' },
      { label: 'Manage Users', granted: role === 'admin' },
      { label: 'System Settings', granted: role === 'admin' },
    ];
  });
}
