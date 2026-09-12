import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SystemService, TenantUserDto, TenantDto } from '../../../services/system';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-company-users',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTableModule, MatButtonModule, MatIconModule, TableSkeleton],
  templateUrl: './company-users.html',
  styleUrl: './company-users.scss',
})
export class CompanyUsersComponent implements OnInit {
  route = inject(ActivatedRoute);
  private systemService = inject(SystemService);

  users = signal<TenantUserDto[]>([]);
  company = signal<TenantDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  displayedColumns = ['name', 'email', 'role'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadData(id);
    }
  }

  loadData(id: string) {
    this.loading.set(true);
    
    // Load company details
    this.systemService.getTenant(id).subscribe({
      next: (tenant) => this.company.set(tenant),
      error: () => this.error.set('Failed to load company details.')
    });

    // Load users
    this.systemService.getTenantUsers(id).subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users.');
        this.loading.set(false);
      }
    });
  }

  getUserInitials(user: TenantUserDto): string {
    const f = (user.firstName || '').charAt(0);
    const l = (user.lastName || '').charAt(0);
    return (f + l).toUpperCase() || user.email.slice(0, 2).toUpperCase();
  }
}
