import { Component, inject, Signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ConfirmDialogData {
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  isProcessing?: Signal<boolean>;
  onConfirmCallback?: () => void;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialogComponent {
  transloco = inject(TranslocoService);
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);

  get type(): 'danger' | 'warning' | 'info' {
    return this.data.type || 'danger';
  }

  get icon(): string {
    if (this.data.icon) return this.data.icon;
    switch (this.type) {
      case 'danger': return 'delete_forever';
      case 'warning': return 'warning_amber';
      case 'info': return 'help_outline';
    }
  }

  get confirmText(): string {
    return this.data.confirmText || (this.type === 'danger' ? this.transloco.translate('confirm.delete') : this.transloco.translate('confirm.confirm'));
  }

  get cancelText(): string {
    return this.data.cancelText || this.transloco.translate('confirm.cancel');
  }

  get isProcessing(): boolean {
    return this.data.isProcessing ? this.data.isProcessing() : false;
  }

  onConfirm() {
    if (this.data.onConfirmCallback) {
      this.data.onConfirmCallback();
    } else {
      this.dialogRef.close(true);
    }
  }

  onCancel() {
    if (!this.isProcessing) {
      this.dialogRef.close(false);
    }
  }
}
