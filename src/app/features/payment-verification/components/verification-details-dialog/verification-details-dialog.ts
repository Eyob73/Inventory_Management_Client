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

  get canManualReview(): boolean {
    return (
      this.isManagerOrAdmin &&
      (this.verification.status === 'NeedsManualReview' ||
       this.verification.status === 'UnableToConfirmDestination' ||
       this.verification.status === 'AmountMismatch' ||
       this.verification.status === 'DestinationMismatch')
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
