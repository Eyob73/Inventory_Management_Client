import { TranslocoModule } from '@jsverse/transloco';
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-bottle-type-dialog',
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, MatCheckboxModule, MatIconModule],
  styles: [`
    .dialog-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border); }
  `],
  template: `
    <ng-container *transloco="let t; read: 'bottles'">
      <h2 mat-dialog-title>{{ data?.id ? t('edit') : t('add') }} {{ t('bottleType') }}</h2>
      <mat-dialog-content>
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
          <mat-form-field appearance="outline">
            <mat-label>{{ t('name') }}</mat-label>
            <input matInput [(ngModel)]="formData.name" required>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ t('depositAmount') }} (ETB)</mat-label>
            <input matInput type="number" [(ngModel)]="formData.depositAmount" required>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ t('capacity') }} (e.g. 300ml, 1L)</mat-label>
            <input matInput [(ngModel)]="formData.capacity">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ t('material') }} (e.g. Glass, Plastic)</mat-label>
            <input matInput [(ngModel)]="formData.material">
          </mat-form-field>

          <mat-form-field appearance="outline" *ngIf="!data?.id">
            <mat-label>{{ t('emptyQuantity') }}</mat-label>
            <input matInput type="number" [(ngModel)]="formData.quantity">
            <mat-hint>{{ t('emptyQuantityHint') }}</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ t('description') }}</mat-label>
            <textarea matInput [(ngModel)]="formData.description" rows="2"></textarea>
          </mat-form-field>
          
          <mat-checkbox [(ngModel)]="formData.isActive" color="primary">{{ t('active') }}</mat-checkbox>
        </div>
      </mat-dialog-content>
      <div class="dialog-actions" style="padding: 10px;">
        <button type="button" class="btn btn--outline" (click)="onNoClick()">{{ t('cancel') }}</button>
        <button type="button" class="btn btn--primary" (click)="onSave()" [disabled]="!formData.name || formData.depositAmount == null">
          <mat-icon>save</mat-icon>
          <span>{{ t('save') }}</span>
        </button>
      </div>
    </ng-container>`
})
export class BottleTypeDialogComponent {
  formData: any = { isActive: true };

  constructor(
    public dialogRef: MatDialogRef<BottleTypeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      this.formData = { ...data };
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.formData);
  }
}







