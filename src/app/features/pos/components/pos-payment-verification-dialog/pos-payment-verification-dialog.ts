import { Component, Inject, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentVerificationService } from '../../../../core/services/payment-verification.service';
import { PaymentVerificationStore } from '../../../../store/payment-verification.store';
import {
  PaymentDestination,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  PaymentVerificationStatus
} from '../../../../models/payment-verification.model';
import { CreateSaleRequest } from '../../../../models/sale.model';

export interface PosPaymentVerificationDialogData {
  totalAmount: number;
  customerName?: string;
  paymentMethod: string;
  cartPayload: CreateSaleRequest;
  saleReference?: string;
}

export type PosPaymentVerificationDialogResult =
  | { action: 'verified'; verification: VerifyPaymentResponse }
  | { action: 'skipped' }
  | { action: 'cancel' };

@Component({
  selector: 'app-pos-payment-verification-dialog',
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
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './pos-payment-verification-dialog.html',
  styleUrl: './pos-payment-verification-dialog.scss'
})
export class PosPaymentVerificationDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PosPaymentVerificationDialogComponent, PosPaymentVerificationDialogResult>);
  private verificationService = inject(PaymentVerificationService);
  readonly store = inject(PaymentVerificationStore);
  private snackBar = inject(MatSnackBar);

  verificationForm!: FormGroup;
  isVerifying = signal<boolean>(false);
  verificationResult = signal<VerifyPaymentResponse | null>(null);
  errorMessage = signal<string | null>(null);

  readonly activeDestinations = this.store.activeDestinations;
  readonly isLoadingDestinations = this.store.isLoadingDestinations;

  readonly selectedDestination = computed(() => {
    const destId = this.verificationForm?.get('destinationId')?.value;
    if (!destId) return null;
    return this.activeDestinations().find((d) => d.id === destId) ?? null;
  });

  readonly isTelebirr = computed(() => {
    const dest = this.selectedDestination();
    if (!dest) return this.data.paymentMethod?.toLowerCase().includes('telebirr');
    return dest.type === 'Telebirr' || dest.type === 2 || dest.name?.toLowerCase().includes('telebirr');
  });

  readonly isVerified = computed(() => {
    const res = this.verificationResult();
    if (!res) return false;
    return res.status === 'Verified' || res.status === 1;
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: PosPaymentVerificationDialogData) {}

  ngOnInit(): void {
    this.store.loadDestinations();

    this.verificationForm = this.fb.group({
      destinationId: ['', Validators.required],
      submittedReference: ['', [Validators.required, Validators.minLength(3)]],
      payerPhone: [''],
      qrData: ['']
    });

    // Auto-select preferred destination based on payment method
    this.autoSelectDestination();
  }

  private autoSelectDestination(): void {
    const destinations = this.activeDestinations();
    if (destinations.length === 0) return;

    const methodLower = (this.data.paymentMethod || '').toLowerCase();
    let matched: PaymentDestination | undefined;

    if (methodLower.includes('telebirr')) {
      matched = destinations.find((d) => d.type === 'Telebirr' || d.type === 2 || d.name.toLowerCase().includes('telebirr'));
    } else if (methodLower.includes('cbe') || methodLower.includes('mobile')) {
      matched = destinations.find((d) => d.bankCode?.toLowerCase() === 'cbe' || d.type === 'BankAccount' || d.type === 1);
    }

    const target = matched || this.store.defaultDestination() || destinations[0];
    if (target) {
      this.verificationForm.patchValue({ destinationId: target.id });
    }
  }

  onDestinationChange(destId: string): void {
    this.verificationResult.set(null);
    this.errorMessage.set(null);
  }

  onReferenceInput(): void {
    if (this.verificationResult() || this.errorMessage()) {
      this.verificationResult.set(null);
      this.errorMessage.set(null);
    }
  }

  verifyPayment(): void {
    if (this.verificationForm.invalid || this.isVerifying()) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    const formVal = this.verificationForm.value;
    const dest = this.selectedDestination();

    const request: VerifyPaymentRequest = {
      paymentDestinationId: formVal.destinationId,
      submittedReference: formVal.submittedReference.trim(),
      bankCode: dest?.bankCode,
      payerPhone: formVal.payerPhone?.trim() || undefined,
      qrData: formVal.qrData?.trim() || undefined,
      cart: this.data.cartPayload
    };

    this.isVerifying.set(true);
    this.errorMessage.set(null);
    this.verificationResult.set(null);

    this.verificationService.verifyPayment(request).subscribe({
      next: (response: VerifyPaymentResponse) => {
        this.isVerifying.set(false);
        this.verificationResult.set(response);

        if (response.status === 'Verified' || response.status === 1) {
          this.snackBar.open('Payment successfully verified by bank!', 'Success', {
            duration: 2500,
            panelClass: ['snackbar-success']
          });
        }
      },
      error: (err) => {
        this.isVerifying.set(false);
        const detail = err?.error?.detail || err?.error?.message || err?.message || 'Verification service communication failed.';
        this.errorMessage.set(detail);
      }
    });
  }

  proceedWithVerifiedPayment(): void {
    const res = this.verificationResult();
    if (!res || (res.status !== 'Verified' && res.status !== 1)) return;
    this.dialogRef.close({ action: 'verified', verification: res });
  }

  skipVerification(): void {
    this.dialogRef.close({ action: 'skipped' });
  }

  cancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  getStatusBadgeClass(status: PaymentVerificationStatus | number | undefined): string {
    const s = String(status);
    if (s === 'Verified' || s === '1') return 'badge-verified';
    if (s === 'Rejected' || s === '2') return 'badge-rejected';
    if (s === 'AmountMismatch' || s === '3') return 'badge-mismatch';
    if (s === 'DestinationMismatch' || s === '4') return 'badge-mismatch';
    if (s === 'UnableToConfirmDestination' || s === '5') return 'badge-warning';
    if (s === 'NeedsManualReview' || s === '6') return 'badge-warning';
    if (s === 'Failed' || s === '7') return 'badge-failed';
    return 'badge-pending';
  }

  getStatusIcon(status: PaymentVerificationStatus | number | undefined): string {
    const s = String(status);
    if (s === 'Verified' || s === '1') return 'verified';
    if (s === 'Rejected' || s === '2') return 'cancel';
    if (s === 'AmountMismatch' || s === '3') return 'price_change';
    if (s === 'DestinationMismatch' || s === '4') return 'wrong_location';
    if (s === 'UnableToConfirmDestination' || s === '5') return 'help_outline';
    if (s === 'NeedsManualReview' || s === '6') return 'rate_review';
    if (s === 'Failed' || s === '7') return 'error_outline';
    return 'hourglass_empty';
  }
}
