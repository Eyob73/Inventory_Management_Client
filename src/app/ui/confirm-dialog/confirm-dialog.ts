import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialogComponent {
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
    return this.data.confirmText || (this.type === 'danger' ? 'Delete' : 'Confirm');
  }

  get cancelText(): string {
    return this.data.cancelText || 'Cancel';
  }

  onConfirm() {
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
