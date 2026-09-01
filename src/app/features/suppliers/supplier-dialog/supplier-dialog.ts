import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Supplier } from '../../../models/supplier.model';
import { SupplierStore } from '../../../store/supplier.store';

export interface SupplierDialogData {
  supplier?: Supplier;
}

@Component({
  selector: 'app-supplier-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './supplier-dialog.html',
  styleUrl: './supplier-dialog.scss',
})
export class SupplierDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SupplierDialogComponent>);
  private store = inject(SupplierStore);

  supplierForm!: FormGroup;
  isEditMode = false;
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: SupplierDialogData) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.supplier;
    this.supplierForm = this.fb.group({
      name: [this.data?.supplier?.name || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      contactName: [this.data?.supplier?.contactName || '', [Validators.maxLength(100)]],
      phoneNumber: [
        this.data?.supplier?.phoneNumber || '',
        [Validators.required, Validators.pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)],
      ],
      email: [this.data?.supplier?.email || '', [Validators.email]],
      address: [this.data?.supplier?.address || '', [Validators.maxLength(250)]],
      isActive: [this.data?.supplier?.isActive ?? true],
    });
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const formValues = this.supplierForm.value;
    const dto = {
      name: formValues.name.trim(),
      contactName: formValues.contactName?.trim() || '',
      phoneNumber: formValues.phoneNumber.trim(),
      email: formValues.email?.trim() || '',
      address: formValues.address?.trim() || '',
      isActive: formValues.isActive,
    };

    if (this.isEditMode && this.data.supplier) {
      this.store.updateSupplier({
        id: this.data.supplier.id,
        dto: { id: this.data.supplier.id, ...dto },
        onSuccess: () => {
          this.isSubmitting.set(false);
          this.dialogRef.close(true);
        },
        onError: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err);
        },
      });
    } else {
      this.store.createSupplier({
        dto,
        onSuccess: () => {
          this.isSubmitting.set(false);
          this.dialogRef.close(true);
        },
        onError: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err);
        },
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
