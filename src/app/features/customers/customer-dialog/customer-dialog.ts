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
import { Customer } from '../../../models/customer.model';
import { CustomerStore } from '../../../store/customer.store';

export interface CustomerDialogData {
  customer?: Customer;
}

@Component({
  selector: 'app-customer-dialog',
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
  templateUrl: './customer-dialog.html',
  styleUrl: './customer-dialog.scss',
})
export class CustomerDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CustomerDialogComponent>);
  private store = inject(CustomerStore);

  customerForm!: FormGroup;
  isEditMode = false;
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: CustomerDialogData) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.customer;

    this.customerForm = this.fb.group({
      name: [
        this.data?.customer?.name || '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      ],
      phoneNumber: [
        this.data?.customer?.phoneNumber || '',
        [
          Validators.required,
          Validators.pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/),
        ],
      ],
      email: [
        this.data?.customer?.email || '',
        [Validators.email],
      ],
      address: [
        this.data?.customer?.address || '',
        [Validators.maxLength(250)],
      ],
      isActive: [
        this.data?.customer?.isActive ?? true,
      ],
    });
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValues = this.customerForm.value;

    if (this.isEditMode && this.data.customer) {
      this.store.updateCustomer({
        id: this.data.customer.id,
        dto: {
          id: this.data.customer.id,
          name: formValues.name.trim(),
          phoneNumber: formValues.phoneNumber.trim(),
          email: formValues.email?.trim() || '',
          address: formValues.address?.trim() || '',
          isActive: formValues.isActive,
        },
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
      this.store.createCustomer({
        dto: {
          name: formValues.name.trim(),
          phoneNumber: formValues.phoneNumber.trim(),
          email: formValues.email?.trim() || '',
          address: formValues.address?.trim() || '',
          isActive: formValues.isActive,
        },
        onSuccess: (created) => {
          this.isSubmitting.set(false);
          this.dialogRef.close(created || true);
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
