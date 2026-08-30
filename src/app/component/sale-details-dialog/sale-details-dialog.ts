import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Sale } from '../../models/sale.model';

@Component({
  selector: 'app-sale-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './sale-details-dialog.html',
  styleUrl: './sale-details-dialog.scss'
})
export class SaleDetailsDialogComponent {
  public data = inject<{ sale: Sale }>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<SaleDetailsDialogComponent>);

  get sale(): Sale {
    return this.data.sale;
  }

  printReceipt(): void {
    window.print();
  }

  close(): void {
    this.dialogRef.close();
  }
}
