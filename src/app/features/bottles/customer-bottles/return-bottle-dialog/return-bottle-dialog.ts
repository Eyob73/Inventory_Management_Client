import { TranslocoModule } from '@jsverse/transloco';
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-return-bottle-dialog',
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, MatIconModule],
  templateUrl: './return-bottle-dialog.html',
  styleUrls: ['./return-bottle-dialog.scss']
})
export class ReturnBottleDialogComponent {
  quantity = 1;
  refundAmount = 0;

  constructor(
    public dialogRef: MatDialogRef<ReturnBottleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close({
      quantity: this.quantity,
      refundAmount: this.refundAmount
    });
  }
}


