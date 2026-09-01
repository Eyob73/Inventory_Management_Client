import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SupplierDetail } from '../../../models/supplier.model';
import { SupplierService } from '../../../services/supplier';

export interface SupplierDetailsDialogData {
  supplierId: string;
}

@Component({
  selector: 'app-supplier-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './supplier-details-dialog.html',
  styleUrl: './supplier-details-dialog.scss',
})
export class SupplierDetailsDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<SupplierDetailsDialogComponent>);
  private supplierService = inject(SupplierService);

  supplier = signal<SupplierDetail | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  purchaseColumns = ['purchaseNumber', 'purchaseDate', 'itemsCount', 'status', 'totalAmount'];
  productColumns = ['productName', 'sku', 'totalQuantity'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: SupplierDetailsDialogData) {}

  ngOnInit(): void {
    this.supplierService.getById(this.data.supplierId).subscribe({
      next: (data) => {
        this.supplier.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        const msg = typeof err?.error === 'string' ? err.error : (err?.error?.detail || err?.message || 'Failed to load supplier details.');
        this.error.set(msg);
        this.isLoading.set(false);
      },
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
