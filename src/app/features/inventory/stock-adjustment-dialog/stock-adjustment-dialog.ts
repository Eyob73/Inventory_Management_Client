import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Product } from '../../../models/products.model';
import { InventoryApiService } from '../../../services/inventory';

export interface StockAdjustmentDialogData {
  products: Product[];
  productId?: string;
}

@Component({
  selector: 'app-stock-adjustment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './stock-adjustment-dialog.html',
  styleUrl: './stock-adjustment-dialog.scss',
})
export class StockAdjustmentDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<StockAdjustmentDialogComponent>);
  private inventoryApi = inject(InventoryApiService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  form;

  constructor(@Inject(MAT_DIALOG_DATA) public data: StockAdjustmentDialogData) {
    this.form = this.fb.group({
      productId: [this.data.productId || '', Validators.required],
      quantity: [null as number | null, [Validators.required, Validators.pattern(/^-?[1-9]\d*$/)]],
      notes: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.inventoryApi
      .adjust({
        productId: value.productId!,
        quantity: Number(value.quantity),
        notes: value.notes?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg =
            typeof err?.error === 'string' ? err.error : err?.error?.detail || err?.message || 'Failed to adjust stock';
          this.errorMessage.set(msg);
        },
      });
  }
}
