import { Component, inject, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    TableSkeleton
  ],
  templateUrl: './companies.html',
  styleUrl: './companies.scss',
})
export class Companies implements OnInit {
  private systemService = inject(SystemService);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);
  private snackBar = inject(MatSnackBar);
  
  companies = signal<TenantDto[]>([]);
  loading = signal<boolean>(true);
  displayedColumns = ['name', 'code', 'status', 'createdAt', 'actions'];

  ngOnInit() {
    this.loadCompanies();
  }

  loadCompanies() {
    this.loading.set(true);
    this.systemService.getTenants().subscribe({
      next: (data) => {
        this.companies.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open('Failed to load companies.', 'Close', {duration: 3000});
      }
    });
  }

  getStatusName(status: number): string {
    switch (status) {
      case 0: return 'Active';
      case 1: return 'Suspended';
      case 2: return 'Deactivated';
      default: return 'Unknown';
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
        this.snackBar.open('Company activated successfully.', 'Close', {duration: 3000});
        this.loadCompanies();
      },
      error: () => this.snackBar.open('Failed to activate company.', 'Close', {duration: 3000})
    });
  }

  suspend(company: TenantDto) {
    this.confirmDialog
      .confirm({
        title: 'Suspend Company?',
        message: `Are you sure you want to suspend ${company.name}? Users belonging to this company will no longer be able to use the system.`,
        confirmText: 'Suspend Company',
        cancelText: 'Cancel'
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.systemService.suspendTenant(company.id).subscribe({
          next: () => {
            this.snackBar.open('Company suspended successfully.', 'Close', {duration: 3000});
            this.loadCompanies();
          },
          error: () => this.snackBar.open('Failed to suspend company.', 'Close', {duration: 3000})
        });
      });
  }

  deactivate(company: TenantDto) {
    this.confirmDialog
      .confirm({
        title: 'Deactivate Company?',
        message: `This will prevent users from accessing the company ${company.name}.`,
        confirmText: 'Deactivate',
        cancelText: 'Cancel'
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.systemService.deactivateTenant(company.id).subscribe({
          next: () => {
            this.snackBar.open('Company deactivated successfully.', 'Close', {duration: 3000});
            this.loadCompanies();
          },
          error: () => this.snackBar.open('Failed to deactivate company.', 'Close', {duration: 3000})
        });
      });
  }
}
