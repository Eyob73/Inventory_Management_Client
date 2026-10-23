import { Component, inject } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Sale } from '../../models/sale.model';
import {
  formatPaymentMethod,
  getPaymentMethodBadgeClass,
  getPaymentMethodIcon
} from '../../utils/payment-method.util';

import { Router } from '@angular/router';

@Component({
  selector: 'app-sale-details-dialog',
  standalone: true,
  imports: [
    TranslocoDirective,
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './sale-details-dialog.html',
  styleUrl: './sale-details-dialog.scss'
})
export class SaleDetailsDialogComponent {
  public data = inject<{ sale: Sale }>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<SaleDetailsDialogComponent>);
  private router = inject(Router);
  private translocoService = inject(TranslocoService);

  get sale(): Sale {
    return this.data.sale;
  }

  get totalBottleDeposit(): number {
    return this.sale.items?.reduce((sum, item) => sum + (item.isBottleExchange === false ? (item.quantity * (item.bottleDepositAmount || 0)) : 0), 0) || 0;
  }

  isCashPayment(): boolean {
    return (this.sale.paymentMethod || '').trim().toLowerCase() === 'cash';
  }

  formatPaymentMethod(): string {
    return formatPaymentMethod(this.sale, (k) => this.translocoService.translate(k));
  }

  getPaymentMethodBadgeClass(): string {
    return getPaymentMethodBadgeClass(this.sale);
  }

  getPaymentMethodIcon(): string {
    return getPaymentMethodIcon(this.sale);
  }

  printReceipt(): void {
    window.print();
  }

  viewProduct(productId?: string): void {
    if (!productId) return;
    this.dialogRef.close();
    this.router.navigate(['/products', productId]);
  }

  close(): void {
    this.dialogRef.close();
  }
}

