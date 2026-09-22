import { TranslocoModule } from '@jsverse/transloco';
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BottleTypesService, BottleType } from '../../../../core/services/bottle-types';

@Component({
  selector: 'app-adjust-inventory-dialog',
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, FormsModule, MatIconModule],
  styles: [`
    .dialog-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border); }
  `],
  template: `
    <ng-container *transloco="let t; read: 'bottles'">
      <h2 mat-dialog-title>{{ t('adjustInventoryTitle') }}</h2>
      <mat-dialog-content>
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
          <mat-form-field appearance="outline">
            <mat-label>{{ t('bottleType') }}</mat-label>
            <mat-select [(ngModel)]="formData.bottleTypeId" required>
              <mat-option *ngFor="let bt of bottleTypes" [value]="bt.id">{{ bt.name }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ t('adjustmentType') }}</mat-label>
            <mat-select [(ngModel)]="formData.adjustmentType" required>
              <mat-option [value]="0">{{ t('damagedDecrease') }}</mat-option>
              <mat-option [value]="1">{{ t('lostDecrease') }}</mat-option>
              <mat-option [value]="2">{{ t('foundIncrease') }}</mat-option>
              <mat-option [value]="3">{{ t('manualCorrection') }}</mat-option>
            </mat-select>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>{{ t('quantity') }}</mat-label>
            <input matInput type="number" [(ngModel)]="formData.quantity" required>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>{{ t('reason') }}</mat-label>
            <input matInput [(ngModel)]="formData.reason">
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <div class="dialog-actions" style="padding: 10px;">
        <button type="button" class="btn btn--outline" (click)="onNoClick()">{{ t('cancel') }}</button>
        <button type="button" class="btn btn--primary" (click)="onSave()" [disabled]="!formData.bottleTypeId || formData.adjustmentType == null || !formData.quantity">
          <mat-icon>save</mat-icon>
          <span>{{ t('submit') }}</span>
        </button>
      </div>
    </ng-container>`
})
export class AdjustInventoryDialogComponent implements OnInit {
  formData: any = {};
  bottleTypes: BottleType[] = [];

  constructor(
    public dialogRef: MatDialogRef<AdjustInventoryDialogComponent>,
    private bottleTypesService: BottleTypesService
  ) { }

  ngOnInit() {
    this.bottleTypesService.getBottleTypes().subscribe(res => this.bottleTypes = res);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.formData);
  }
}



