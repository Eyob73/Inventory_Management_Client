import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule
  ],
  templateUrl: './verification-details-dialog.html',
  styleUrl: './verification-details-dialog.scss'
})
export class VerificationDetailsDialogComponent {
  private dialogRef = inject(MatDialogRef<VerificationDetailsDialogComponent>);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

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
