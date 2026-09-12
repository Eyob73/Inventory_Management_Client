import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SystemService, TenantDto } from '../../../services/system';
import { UserService, SystemUser } from '../../../services/user.service';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-system-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TableSkeleton
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class SystemUsersComponent implements OnInit {
  private systemService = inject(SystemService);
  private userService = inject(UserService);

  users = signal<SystemUser[]>([]);
  companies = signal<Map<string, string>>(new Map());
  loading = signal(true);
  error = signal<string | null>(null);

  displayedColumns = ['name', 'email', 'role', 'company'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      tenants: this.systemService.getTenants(),
      users: this.userService.getUsers()
    }).subscribe({
      next: (data) => {
        const companyMap = new Map<string, string>();
        data.tenants.forEach(t => companyMap.set(t.id.toLowerCase(), t.name));
        this.companies.set(companyMap);
        this.users.set(data.users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users data.');
        this.loading.set(false);
      }
    });
  }

  getCompanyName(tenantId?: string): string {
    if (!tenantId) return 'System Admin';
    return this.companies().get(tenantId.toLowerCase()) || 'Unknown Company';
  }

  getUserInitials(user: SystemUser): string {
    const f = (user.firstName || '').charAt(0);
    const l = (user.lastName || '').charAt(0);
    return (f + l).toUpperCase() || user.email.slice(0, 2).toUpperCase();
  }
}
