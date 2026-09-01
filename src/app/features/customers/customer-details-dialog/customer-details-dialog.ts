import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomerDetail, CustomerSale } from '../../../models/customer.model';
import { CustomerService } from '../../../services/customer.service';

export interface CustomerDetailsDialogData {
  customerId: string;
}

@Component({
  selector: 'app-customer-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './customer-details-dialog.html',
  styleUrl: './customer-details-dialog.scss',
})
export class CustomerDetailsDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CustomerDetailsDialogComponent>);
  private customerService = inject(CustomerService);

  customer = signal<CustomerDetail | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  expandedSaleId = signal<string | null>(null);

  displayedColumns: string[] = ['saleNumber', 'createdAt', 'itemsCount', 'paymentMethod', 'totalAmount', 'actions'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: CustomerDetailsDialogData) {}

  ngOnInit(): void {
    if (this.data?.customerId) {
      this.loadDetails(this.data.customerId);
    } else {
      this.error.set('No customer ID provided.');
      this.isLoading.set(false);
    }
  }

  loadDetails(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.customerService.getById(id).subscribe({
      next: (data) => {
        this.customer.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        const msg = typeof err?.error === 'string' ? err.error : (err?.error?.detail || err?.message || 'Failed to load customer details.');
        this.error.set(msg);
        this.isLoading.set(false);
      },
    });
  }

  toggleSaleExpand(saleId: string): void {
    if (this.expandedSaleId() === saleId) {
      this.expandedSaleId.set(null);
    } else {
      this.expandedSaleId.set(saleId);
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
