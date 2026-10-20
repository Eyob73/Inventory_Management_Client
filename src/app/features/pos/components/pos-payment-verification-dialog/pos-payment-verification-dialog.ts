import { Component, Inject, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
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
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Html5Qrcode } from 'html5-qrcode';
import { PaymentVerificationService } from '../../../../core/services/payment-verification.service';
import { PaymentVerificationStore } from '../../../../store/payment-verification.store';
import { ReceiptScannerService } from '../../../../core/services/receipt-scanner.service';
import { VerificationResultDialogComponent } from '../../../payment-verification/components/verification-result-dialog/verification-result-dialog';
import {
  PaymentDestination,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  PaymentVerificationStatus,
  ReceiptScanMode,
  ExtractedReceiptDetails
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
    MatChipsModule,
    TranslocoDirective
  ],
  templateUrl: './pos-payment-verification-dialog.html',
  styleUrl: './pos-payment-verification-dialog.scss'
})
export class PosPaymentVerificationDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PosPaymentVerificationDialogComponent, PosPaymentVerificationDialogResult>);
  private dialog = inject(MatDialog);
  private verificationService = inject(PaymentVerificationService);
  private scannerService = inject(ReceiptScannerService);
  readonly store = inject(PaymentVerificationStore);
  private snackBar = inject(MatSnackBar);
  private transloco = inject(TranslocoService);

  verificationForm!: FormGroup;
  isVerifying = signal<boolean>(false);
  verificationResult = signal<VerifyPaymentResponse | null>(null);
  errorMessage = signal<string | null>(null);

  // Scanner & Upload states
  scanMode = signal<ReceiptScanMode>('manual');
  isCameraLoading = signal<boolean>(false);
  isCameraScanning = signal<boolean>(false);
  cameraError = signal<string | null>(null);
  private cameraScanner: Html5Qrcode | null = null;

  selectedFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);
  isDecodingImage = signal<boolean>(false);
  uploadError = signal<string | null>(null);

  // Extracted details review state
  scannedDetails = signal<ExtractedReceiptDetails | null>(null);

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
    return res.status === 'Verified' || res.status === 2 || res.status === 1;
  });

  readonly isScannedAmountMatch = computed(() => {
    const details = this.scannedDetails();
    if (!details || details.amount === undefined || details.amount === null) return true;
    return Math.abs(details.amount - this.data.totalAmount) < 0.01;
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

  ngOnDestroy(): void {
    this.stopCameraScan();
    this.cleanupPreviewUrl();
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

  // --- Scan Mode & Camera Management ---

  async setScanMode(mode: ReceiptScanMode): Promise<void> {
    if (this.scanMode() === mode) return;

    if (this.scanMode() === 'camera' || this.isCameraScanning() || this.cameraScanner) {
      await this.stopCameraScan();
    }

    this.scanMode.set(mode);
    this.uploadError.set(null);
    this.cameraError.set(null);

    if (mode === 'camera') {
      // Delay slightly to let the #qr-reader element render in DOM
      setTimeout(() => this.startCameraScan(), 100);
    }
  }

  async startCameraScan(): Promise<void> {
    this.scanMode.set('camera');
    this.cameraError.set(null);
    this.isCameraLoading.set(true);
    this.isCameraScanning.set(false);

    try {
      this.cameraScanner = await this.scannerService.startCamera(
        'qr-reader',
        (decodedText) => this.onQrScanned(decodedText),
        (err) => {
          this.cameraError.set(err?.message || 'Error occurred during camera scanning.');
        }
      );
      this.isCameraLoading.set(false);
      this.isCameraScanning.set(true);
    } catch (err: any) {
      this.isCameraLoading.set(false);
      this.isCameraScanning.set(false);
      this.cameraError.set(err?.message || 'Unable to access camera.');
    }
  }

  async stopCameraScan(): Promise<void> {
    if (this.cameraScanner) {
      await this.scannerService.stopCamera(this.cameraScanner);
      this.cameraScanner = null;
    }
    this.isCameraLoading.set(false);
    this.isCameraScanning.set(false);
  }

  // --- File Upload Handling ---

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.processUploadedFile(file);
    // Reset file input so same file can be re-selected if desired
    input.value = '';
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;
    const file = event.dataTransfer.files[0];
    this.processUploadedFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private processUploadedFile(file: File): void {
    const validation = this.scannerService.validateReceiptImage(file);
    if (!validation.valid) {
      this.uploadError.set(validation.error || 'Invalid file format.');
      return;
    }

    this.uploadError.set(null);
    this.cleanupPreviewUrl();

    this.selectedFile.set(file);
    const objectUrl = URL.createObjectURL(file);
    this.imagePreviewUrl.set(objectUrl);

    this.decodeUploadedImage(file);
  }

  async decodeUploadedImage(file: File): Promise<void> {
    this.isDecodingImage.set(true);
    this.uploadError.set(null);

    try {
      const decodedText = await this.scannerService.decodeReceiptImage(file);
      this.onQrScanned(decodedText);
    } catch (err: any) {
      this.uploadError.set(err?.message || 'Failed to decode receipt image.');
    } finally {
      this.isDecodingImage.set(false);
    }
  }

  removeSelectedFile(): void {
    this.cleanupPreviewUrl();
    this.selectedFile.set(null);
    this.uploadError.set(null);
  }

  private cleanupPreviewUrl(): void {
    const url = this.imagePreviewUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.imagePreviewUrl.set(null);
    }
  }

  // --- QR Parsing & Form Population ---

  onQrScanned(decodedText: string): void {
    // 1. Parse details
    const extracted = this.scannerService.parseQrData(decodedText);
    this.scannedDetails.set(extracted);

    // 2. Stop camera stream once scan succeeds
    if (this.isCameraScanning()) {
      this.stopCameraScan();
    }

    // 3. Populate form controls with extracted safe values
    const formUpdates: any = {};

    if (extracted.transactionReference) {
      formUpdates.submittedReference = extracted.transactionReference;
    } else if (extracted.receiptUrl) {
      formUpdates.submittedReference = extracted.receiptUrl;
    }

    if (extracted.payerPhone) {
      formUpdates.payerPhone = extracted.payerPhone;
    }

    if (extracted.rawContent) {
      formUpdates.qrData = extracted.rawContent;
    }

    // Attempt auto-matching destination if provider is known and destination not yet chosen
    if (extracted.provider) {
      const currentDestId = this.verificationForm.get('destinationId')?.value;
      const destinations = this.activeDestinations();
      if (!currentDestId || currentDestId === '') {
        const provLower = extracted.provider.toLowerCase();
        const matched = destinations.find((d) => {
          if (provLower.includes('telebirr') && (d.type === 'Telebirr' || d.type === 2)) return true;
          if (provLower.includes('cbe') && (d.bankCode?.toLowerCase() === 'cbe' || d.type === 'BankAccount' || d.type === 1)) return true;
          if (d.bankCode && provLower.includes(d.bankCode.toLowerCase())) return true;
          return false;
        });
        if (matched) {
          formUpdates.destinationId = matched.id;
        }
      }
    }

    this.verificationForm.patchValue(formUpdates);
    this.verificationForm.markAsDirty();

    // 4. User feedback
    if (extracted.isPaymentRequestOnly) {
      this.snackBar.open(
        'Warning: Scanned QR is a payment request instruction, not a completed receipt. Please enter the transaction ID from the customer SMS.',
        'Dismiss',
        { duration: 5000, panelClass: ['snackbar-warning'] }
      );
    } else if (extracted.transactionReference) {
      this.snackBar.open(
        `Scanned reference ${extracted.transactionReference} extracted. Please review details before verifying.`,
        'OK',
        { duration: 3500, panelClass: ['snackbar-success'] }
      );
    } else {
      this.snackBar.open('Receipt scanned. Please verify and complete the details before submitting.', 'OK', {
        duration: 3500
      });
    }

    // Switch view to manual review tab
    this.scanMode.set('manual');
  }

  clearScannedDetails(): void {
    this.scannedDetails.set(null);
  }

  // --- Payment Verification Submission ---

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

        if (response.status === 'Verified' || response.status === 2 || response.status === 1) {
          this.snackBar.open('Payment successfully verified by bank!', 'Success', {
            duration: 2500,
            panelClass: ['snackbar-success']
          });
        }

        // Show verification result in result dialog modal
        this.openResultDialog(response);
      },
      error: (err) => {
        this.isVerifying.set(false);
        const detail = err?.error?.detail || err?.error?.message || err?.message || 'Verification service communication failed.';
        this.errorMessage.set(detail);

        // Show failure message in result dialog modal
        const failedResponse: VerifyPaymentResponse = {
          verificationId: '',
          submittedReference: formVal.submittedReference.trim(),
          status: 'Failed',
          statusName: 'Failed',
          failureCode: 'VerificationError',
          failureMessage: detail,
          currency: 'ETB',
          expectedAmount: this.data.totalAmount,
          provider: dest?.bankName || dest?.name || 'Payment Destination',
          bankCode: dest?.bankCode || '',
          destinationMatchStatus: 'NotApplicable',
          destinationMatchStatusName: 'Not Applicable',
          isEligibleForRetry: true,
          needsManualReview: false,
          saleUpdated: false,
          verificationTimestamp: new Date().toISOString()
        };
        this.openResultDialog(failedResponse);
      }
    });
  }

  openResultDialog(result: VerifyPaymentResponse): void {
    const resultDialogRef = this.dialog.open(VerificationResultDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'payment-verification-dialog-panel',
      autoFocus: false,
      data: {
        result,
        showProceedAction: true
      }
    });

    resultDialogRef.afterClosed().subscribe((res) => {
      if (res?.action === 'proceed' || res?.reviewCompleted) {
        const approvedVerif = res?.updatedVerification || this.verificationResult();
        const isApproved = approvedVerif && (approvedVerif.status === 'Verified' || approvedVerif.status === 2 || approvedVerif.isManualReviewApproved);
        if (isApproved) {
          this.stopCameraScan();
          this.dialogRef.close({ action: 'verified', verification: approvedVerif });
        } else {
          this.proceedWithVerifiedPayment();
        }
      }
    });
  }

  proceedWithVerifiedPayment(): void {
    const res = this.verificationResult();
    if (!res || (res.status !== 'Verified' && res.status !== 2 && res.status !== 1)) return;
    this.stopCameraScan();
    this.dialogRef.close({ action: 'verified', verification: res });
  }

  skipVerification(): void {
    this.stopCameraScan();
    this.dialogRef.close({ action: 'skipped' });
  }

  cancel(): void {
    this.stopCameraScan();
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
