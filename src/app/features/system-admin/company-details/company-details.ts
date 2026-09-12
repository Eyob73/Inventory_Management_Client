import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SystemService, TenantDto } from '../../../services/system';
import { ConfirmDialogService } from '../../../ui/confirm-dialog/confirm-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-company-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './company-details.html',
  styleUrl: './company-details.scss',
})
export class CompanyDetailsComponent implements OnInit {
  route = inject(ActivatedRoute);
  private router = inject(Router);
  private systemService = inject(SystemService);
  private confirmDialog = inject(ConfirmDialogService);
  private snackBar = inject(MatSnackBar);

  company = signal<TenantDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCompany(id);
    }
  }

  loadCompany(id: string) {
    this.loading.set(true);
    this.systemService.getTenant(id).subscribe({
      next: (data) => {
        this.company.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load company details.');
        this.loading.set(false);
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

  activate() {
    const c = this.company();
    if (!c) return;
    this.systemService.activateTenant(c.id).subscribe({
      next: () => {
        this.snackBar.open('Company activated successfully.', 'Close', {duration: 3000});
        this.loadCompany(c.id);
      },
      error: () => this.snackBar.open('Failed to activate company.', 'Close', {duration: 3000})
    });
  }

  suspend() {
    const c = this.company();
    if (!c) return;
    this.confirmDialog.confirm({
      title: 'Suspend Company?',
      message: `Are you sure you want to suspend ${c.name}?`,
      confirmText: 'Suspend Company',
      cancelText: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.systemService.suspendTenant(c.id).subscribe({
          next: () => {
            this.snackBar.open('Company suspended successfully.', 'Close', {duration: 3000});
            this.loadCompany(c.id);
          },
          error: () => this.snackBar.open('Failed to suspend company.', 'Close', {duration: 3000})
        });
      }
    });
  }

  deactivate() {
    const c = this.company();
    if (!c) return;
    this.confirmDialog.confirm({
      title: 'Deactivate Company?',
      message: `This will prevent users from accessing the company ${c.name}.`,
      confirmText: 'Deactivate',
      cancelText: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.systemService.deactivateTenant(c.id).subscribe({
          next: () => {
            this.snackBar.open('Company deactivated successfully.', 'Close', {duration: 3000});
            this.loadCompany(c.id);
          },
          error: () => this.snackBar.open('Failed to deactivate company.', 'Close', {duration: 3000})
        });
      }
    });
  }
}
