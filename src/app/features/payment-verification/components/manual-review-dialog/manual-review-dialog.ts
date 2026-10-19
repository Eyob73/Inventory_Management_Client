import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentVerificationStore } from '../../../../store/payment-verification.store';
import {
  VerifyPaymentResponse,
  PaymentVerificationItem,
  ManualReviewRequest
} from '../../../../models/payment-verification.model';

export interface ManualReviewDialogData {
  verification: VerifyPaymentResponse | PaymentVerificationItem;
}

@Component({
  selector: 'app-manual-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './manual-review-dialog.html',
  styleUrl: './manual-review-dialog.scss'
})
export class ManualReviewDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ManualReviewDialogComponent>);
  private store = inject(PaymentVerificationStore);

  reviewForm!: FormGroup;
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  verification: VerifyPaymentResponse | PaymentVerificationItem;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ManualReviewDialogData) {
    this.verification = data.verification;
  }

  ngOnInit(): void {
    this.reviewForm = this.fb.group({
      decision: ['approve', [Validators.required]],
      notes: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]]
    });
  }

  get verificationId(): string {
    return (this.verification as any).verificationId || (this.verification as any).id;
  }

  get saleNumber(): string {
    return this.verification.saleNumber || 'N/A';
  }

  get verifiedAmount(): number {
    return this.verification.verifiedAmount ?? 0;
  }

  get submittedReference(): string {
    return this.verification.submittedReference;
  }

  onSubmit(): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.reviewForm.value;
    const request: ManualReviewRequest = {
      approved: val.decision === 'approve',
      notes: val.notes.trim()
    };

    this.store.processManualReview({
      id: this.verificationId,
      request,
      onSuccess: (res) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(res);
      },
      onError: (msg) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(msg);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
