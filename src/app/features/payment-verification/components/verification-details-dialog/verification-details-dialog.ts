import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PaymentVerificationItem } from '../../../../models/payment-verification.model';
import { AuthService } from '../../../../services/auth';
import { ManualReviewDialogComponent } from '../manual-review-dialog/manual-review-dialog';

export interface VerificationDetailsDialogData {
  verification: PaymentVerificationItem;
}

@Component({
  selector: 'app-verification-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslocoDirective
  ],
  templateUrl: './verification-details-dialog.html',
  styleUrl: './verification-details-dialog.scss'
})
export class VerificationDetailsDialogComponent {
  private dialogRef = inject(MatDialogRef<VerificationDetailsDialogComponent>);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private transloco = inject(TranslocoService);

  verification: PaymentVerificationItem;

  constructor(@Inject(MAT_DIALOG_DATA) public data: VerificationDetailsDialogData) {
    this.verification = data.verification;
  }

  get isManagerOrAdmin(): boolean {
    return this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
  }

  get sourceUrl(): string | null {
    if (this.verification?.sourceUrl) {
      return this.verification.sourceUrl;
    }
    const bankCode = (this.verification?.bankCode || '').toUpperCase();
    const provider = (this.verification?.provider || '').toLowerCase();
    const isTelebirr = bankCode === 'TELEBIRR' || provider.includes('telebirr');
    const ref = this.verification?.verifiedReference || this.verification?.submittedReference;
    if (isTelebirr && ref && ref.trim().length > 3 && !ref.startsWith('http')) {
      return `https://transactioninfo.ethiotelecom.et/receipt/${ref.trim()}`;
    }
    return null;
  }

  get canManualReview(): boolean {
    const st = String(this.verification?.status || '');
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
       this.verification?.failureCode === 'TELEBIRR_DIRECT_VERIFICATION_REQUIRED')
    );
  }

  getStatusClass(status: any): string {
    const st = String(status || '');
    switch (st) {
      case 'Verified':
      case '2':
        return 'status-verified';
      case 'AmountMismatch':
      case 'DestinationMismatch':
      case 'UnableToConfirmDestination':
      case 'NeedsManualReview':
      case '4':
      case '5':
      case '6':
      case '7':
        return 'status-warning';
      case 'Rejected':
      case 'Failed':
      case '3':
      case '8':
        return 'status-error';
      default:
        return 'status-pending';
    }
  }

  formatStatus(status: any): string {
    const s = String(status || '').trim().toLowerCase();
    switch (s) {
      case 'verified':
      case '2': {
        const val = this.transloco.translate('paymentVerification.statuses.verified');
        return val && !val.startsWith('paymentVerification.') ? val : 'Verified';
      }
      case 'rejected':
      case '3': {
        const val = this.transloco.translate('paymentVerification.statuses.rejected');
        return val && !val.startsWith('paymentVerification.') ? val : 'Rejected';
      }
      case 'amountmismatch':
      case '4': {
        const val = this.transloco.translate('paymentVerification.statuses.amountMismatch');
        return val && !val.startsWith('paymentVerification.') ? val : 'Amount Mismatch';
      }
      case 'destinationmismatch':
      case '5': {
        const val = this.transloco.translate('paymentVerification.statuses.destinationMismatch');
        return val && !val.startsWith('paymentVerification.') ? val : 'Destination Mismatch';
      }
      case 'unabletoconfirmdestination':
      case '6': {
        const val = this.transloco.translate('paymentVerification.statuses.unableToConfirmDestination');
        return val && !val.startsWith('paymentVerification.') ? val : 'Unable to Confirm Dest';
      }
      case 'needsmanualreview':
      case '7': {
        const val = this.transloco.translate('paymentVerification.statuses.needsManualReview');
        return val && !val.startsWith('paymentVerification.') ? val : 'Needs Manual Review';
      }
      case 'failed':
      case '8': {
        const val = this.transloco.translate('paymentVerification.statuses.failed');
        return val && !val.startsWith('paymentVerification.') ? val : 'Failed';
      }
      case 'pending':
      case '1': {
        const val = this.transloco.translate('paymentVerification.statuses.pending');
        return val && !val.startsWith('paymentVerification.') ? val : 'Pending';
      }
      default:
        return status ? String(status) : '—';
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
      data: { verification: this.verification }
    });

    reviewRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.dialogRef.close({ reviewCompleted: true });
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
