import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { VerifyPaymentResponse, PaymentVerificationStatus } from '../../../../models/payment-verification.model';
import { AuthService } from '../../../../services/auth';
import { ManualReviewDialogComponent } from '../manual-review-dialog/manual-review-dialog';

export interface VerificationResultDialogData {
  result: VerifyPaymentResponse;
  showProceedAction?: boolean;
}

@Component({
  selector: 'app-verification-result-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    TranslocoDirective
  ],
  templateUrl: './verification-result-dialog.html',
  styleUrl: './verification-result-dialog.scss'
})
export class VerificationResultDialogComponent {
  private dialogRef = inject(MatDialogRef<VerificationResultDialogComponent>);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private transloco = inject(TranslocoService);

  result: VerifyPaymentResponse;

  constructor(@Inject(MAT_DIALOG_DATA) public data: VerificationResultDialogData) {
    this.result = data.result;
  }

  get isVerified(): boolean {
    const st = String(this.result?.status || '');
    return st === 'Verified' || st === '2' || st === '1';
  }

  get isManagerOrAdmin(): boolean {
    return this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
  }

  get sourceUrl(): string | null {
    if (this.result?.sourceUrl) {
      return this.result.sourceUrl;
    }
    const bankCode = (this.result?.bankCode || '').toUpperCase();
    const provider = (this.result?.provider || '').toLowerCase();
    const isTelebirr = bankCode === 'TELEBIRR' || provider.includes('telebirr');
    const ref = this.result?.verifiedReference || this.result?.submittedReference;
    if (isTelebirr && ref && ref.trim().length > 3 && !ref.startsWith('http')) {
      return `https://transactioninfo.ethiotelecom.et/receipt/${ref.trim()}`;
    }
    return null;
  }

  get canManualReview(): boolean {
    const st = String(this.result?.status || '');
    return (
      this.isManagerOrAdmin &&
      (st === 'NeedsManualReview' ||
       st === '7' ||
       st === 'UnableToConfirmDestination' ||
       st === '6' ||
       st === 'AmountMismatch' ||
       st === '4' ||
       st === 'DestinationMismatch' ||
       st === '5' ||
       this.result?.needsManualReview === true ||
       this.result?.failureCode === 'TELEBIRR_DIRECT_VERIFICATION_REQUIRED')
    );
  }

  getStatusIcon(status: any): string {
    const st = String(status || '');
    switch (st) {
      case 'Verified':
      case '2':
        return 'check_circle';
      case 'AmountMismatch':
      case '4':
        return 'price_change';
      case 'DestinationMismatch':
      case '5':
        return 'wrong_location';
      case 'UnableToConfirmDestination':
      case '6':
        return 'help_outline';
      case 'NeedsManualReview':
      case '7':
        return 'rate_review';
      case 'Rejected':
      case '3':
        return 'cancel';
      case 'Pending':
      case '1':
        return 'hourglass_empty';
      case 'Failed':
      case '8':
      default:
        return 'error_outline';
    }
  }

  getStatusClass(status: any): string {
    const st = String(status || '');
    switch (st) {
      case 'Verified':
      case '2':
        return 'status-verified';
      case 'AmountMismatch':
      case '4':
        return 'status-amount-mismatch';
      case 'DestinationMismatch':
      case '5':
        return 'status-dest-mismatch';
      case 'UnableToConfirmDestination':
      case '6':
        return 'status-unable-confirm';
      case 'NeedsManualReview':
      case '7':
        return 'status-manual-review';
      case 'Rejected':
      case '3':
        return 'status-rejected';
      case 'Pending':
      case '1':
        return 'status-pending';
      case 'Failed':
      case '8':
      default:
        return 'status-failed';
    }
  }

  getStatusTitle(status: any): string {
    if (this.result?.failureCode === 'TELEBIRR_DIRECT_VERIFICATION_REQUIRED') {
      return this.transloco.translate('paymentVerification.resultDialog.titleTelebirrDirect');
    }

    const st = String(status || '');
    switch (st) {
      case 'Verified':
      case '2':
        return this.transloco.translate('paymentVerification.resultDialog.titleVerified');
      case 'AmountMismatch':
      case '4':
        return this.transloco.translate('paymentVerification.resultDialog.titleAmountMismatch');
      case 'DestinationMismatch':
      case '5':
        return this.transloco.translate('paymentVerification.resultDialog.titleDestMismatch');
      case 'UnableToConfirmDestination':
      case '6':
        return this.transloco.translate('paymentVerification.resultDialog.titleUnableConfirm');
      case 'NeedsManualReview':
      case '7':
        return this.transloco.translate('paymentVerification.resultDialog.titleManualReview');
      case 'Rejected':
      case '3':
        return this.transloco.translate('paymentVerification.resultDialog.titleRejected');
      case 'Pending':
      case '1':
        return this.transloco.translate('paymentVerification.resultDialog.titlePending');
      case 'Failed':
      case '8':
      default:
        return this.transloco.translate('paymentVerification.resultDialog.titleFailed');
    }
  }

  formatDestinationMatch(match: any): string {
    const m = String(match || '').trim().toLowerCase();
    switch (m) {
      case 'matched':
      case '1': {
        const val = this.transloco.translate('paymentVerification.destinationMatches.matched');
        return val && !val.startsWith('paymentVerification.') ? val : 'Matched';
      }
      case 'mismatched':
      case '2': {
        const val = this.transloco.translate('paymentVerification.destinationMatches.mismatched');
        return val && !val.startsWith('paymentVerification.') ? val : 'Mismatched';
      }
      case 'unabletoconfirm':
      case '3': {
        const val = this.transloco.translate('paymentVerification.destinationMatches.unableToConfirm');
        return val && !val.startsWith('paymentVerification.') ? val : 'Unable to Confirm';
      }
      case 'notapplicable':
      case '0':
      case '4': {
        const val = this.transloco.translate('paymentVerification.destinationMatches.notApplicable');
        return val && !val.startsWith('paymentVerification.') ? val : 'Not Applicable';
      }
      default:
        return match ? String(match) : '—';
    }
  }

  getMatchClass(matchStatus: any): string {
    const st = String(matchStatus || '').toLowerCase();
    switch (st) {
      case 'matched':
      case '1':
        return 'match-matched';
      case 'mismatched':
      case '2':
        return 'match-mismatched';
      case 'unabletoconfirm':
      case '3':
        return 'match-unabletoconfirm';
      default:
        return 'match-notapplicable';
    }
  }

  openManualReview(): void {
    const reviewRef = this.dialog.open(ManualReviewDialogComponent, {
      width: '540px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'payment-verification-dialog-panel',
      autoFocus: false,
      data: { verification: this.result }
    });

    reviewRef.afterClosed().subscribe((updated) => {
      if (updated) {
        const isApproved = updated.status === 'Verified' || updated.status === 2 || updated.isManualReviewApproved;
        if (this.data?.showProceedAction && isApproved) {
          this.dialogRef.close({ action: 'proceed', updatedVerification: updated });
        } else {
          this.dialogRef.close({ reviewCompleted: true, updatedVerification: updated });
        }
      }
    });
  }

  onProceed(): void {
    this.dialogRef.close({ action: 'proceed' });
  }

  onClose(): void {
    this.dialogRef.close({ action: 'dismiss' });
  }
}
