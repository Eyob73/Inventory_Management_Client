import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SystemService, TenantDto } from '../../../services/system';
import { ConfirmDialogService } from '../../../ui/confirm-dialog/confirm-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-company-details',
  standalone: true,
  imports: [TranslocoModule, CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './company-details.html',
  styleUrl: './company-details.scss',
})
export class CompanyDetailsComponent implements OnInit {
  route = inject(ActivatedRoute);
  private router = inject(Router);
  private systemService = inject(SystemService);
  private confirmDialog = inject(ConfirmDialogService);
  private snackBar = inject(MatSnackBar);
  private transloco = inject(TranslocoService);

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
        this.error.set(this.transloco.translate('systemAdmin.companyDetails.loadFailed'));
        this.loading.set(false);
      }
    });
  }

  getStatusName(status: number): string {
    switch (status) {
      case 0: return this.transloco.translate('systemAdmin.common.active');
      case 1: return this.transloco.translate('systemAdmin.common.suspended');
      case 2: return this.transloco.translate('systemAdmin.common.deactivated');
      default: return this.transloco.translate('systemAdmin.common.unknown');
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
        this.snackBar.open(this.transloco.translate('systemAdmin.companies.activateSuccess'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000});
        this.loadCompany(c.id);
      },
      error: () => this.snackBar.open(this.transloco.translate('systemAdmin.companies.activateFailed'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000})
    });
  }

  suspend() {
    const c = this.company();
    if (!c) return;
    this.confirmDialog.confirm({
      title: this.transloco.translate('systemAdmin.companies.suspendTitle'),
      message: `Are you sure you want to suspend ${c.name}?`,
      confirmText: this.transloco.translate('systemAdmin.common.suspendCompany'),
      cancelText: this.transloco.translate('systemAdmin.common.cancel')
    }).subscribe(confirmed => {
      if (confirmed) {
        this.systemService.suspendTenant(c.id).subscribe({
          next: () => {
            this.snackBar.open(this.transloco.translate('systemAdmin.companies.suspendSuccess'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000});
            this.loadCompany(c.id);
          },
          error: () => this.snackBar.open(this.transloco.translate('systemAdmin.companies.suspendFailed'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000})
        });
      }
    });
  }

  deactivate() {
    const c = this.company();
    if (!c) return;
    this.confirmDialog.confirm({
      title: this.transloco.translate('systemAdmin.companies.deactivateTitle'),
      message: `This will prevent users from accessing the company ${c.name}.`,
      confirmText: this.transloco.translate('systemAdmin.common.deactivate'),
      cancelText: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.systemService.deactivateTenant(c.id).subscribe({
          next: () => {
            this.snackBar.open(this.transloco.translate('systemAdmin.companies.deactivateSuccess'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000});
            this.loadCompany(c.id);
          },
          error: () => this.snackBar.open(this.transloco.translate('systemAdmin.companies.deactivateFailed'), this.transloco.translate('systemAdmin.common.close'), {duration: 3000})
        });
      }
    });
  }
}
