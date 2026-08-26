import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../../store/auth.store';

interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent {
  readonly authStore = inject(AuthStore);

  readonly user = computed(() => this.authStore.user());
  readonly role = computed(() => this.authStore.userRole());

  // UI Signals
  readonly activeTab = signal<'overview' | 'security' | 'activity'>('overview');
  readonly emailCopied = signal(false);
  readonly isEditing = signal(false);
  readonly saveSuccess = signal(false);

  // Password Visibility Signals
  readonly hideCurrentPassword = signal(true);
  readonly hideNewPassword = signal(true);
  readonly hideConfirmPassword = signal(true);

  // Editable Form Fields
  editFirstName = '';
  editLastName = '';

  // Password Fields (Security tab)
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordChangeSuccess = signal(false);
  passwordError = signal<string | null>(null);

  // Recent Activity Log
  readonly activityLogs: ActivityItem[] = [
    { id: '1', action: 'System Login', detail: 'Authenticated successfully from Windows (Chrome)', time: '10 minutes ago', icon: 'login' },
    { id: '2', action: 'Catalog Access', detail: 'Viewed inventory products catalog', time: '1 hour ago', icon: 'inventory_2' },
    { id: '3', action: 'Dashboard View', detail: 'Accessed sales overview dashboard', time: '2 hours ago', icon: 'dashboard' },
    { id: '4', action: 'Session Started', detail: 'New auth token issued', time: 'Today at 08:30 AM', icon: 'key' },
  ];

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

  readonly roleDescription = computed(() => {
    switch (this.role()?.toLowerCase()) {
      case 'admin': return 'Full administrative control over users, inventory, reports, and system configuration.';
      case 'manager': return 'Operational access for inventory control, product updates, and sales reporting.';
      case 'sales': return 'Sales processing, customer management, and product catalog browsing.';
      default: return 'Standard user access.';
    }
  });

  setTab(tab: 'overview' | 'security' | 'activity'): void {
    this.activeTab.set(tab);
  }

  startEditing(): void {
    const u = this.user();
    this.editFirstName = u?.firstName || '';
    this.editLastName = u?.lastName || '';
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
  }

  saveProfile(): void {
    // Save updated name state locally
    const u = this.user();
    if (u) {
      u.firstName = this.editFirstName;
      u.lastName = this.editLastName;
    }
    this.isEditing.set(false);
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }

  copyEmail(): void {
    const email = this.user()?.email;
    if (!email) return;
    navigator.clipboard?.writeText(email).then(() => {
      this.emailCopied.set(true);
      setTimeout(() => this.emailCopied.set(false), 1500);
    });
  }

  changePassword(): void {
    this.passwordError.set(null);
    if (!this.currentPassword) {
      this.passwordError.set('Please enter your current password.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.passwordError.set('New password must be at least 6 characters.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('New password confirmation does not match.');
      return;
    }

    this.passwordChangeSuccess.set(true);
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    setTimeout(() => this.passwordChangeSuccess.set(false), 3000);
  }
}