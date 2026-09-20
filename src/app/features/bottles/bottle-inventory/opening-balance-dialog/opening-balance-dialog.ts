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
import { BottleInventory } from '../../../../core/services/bottle-inventory';

export interface OpeningBalanceData {
  inventory: BottleInventory[];
}

@Component({
  selector: 'app-opening-balance-dialog',
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, FormsModule, MatIconModule],
  styles: [`
    .dialog-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border); }
  `],
  template: `
    <ng-container *transloco="let t; read: 'bottles'">
      <h2 mat-dialog-title>{{ t('setOpeningBalanceTitle') }}</h2>
      <mat-dialog-content>
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
          <mat-form-field appearance="outline">
            <mat-label>{{ t('bottleType') }}</mat-label>
            <mat-select [(ngModel)]="formData.bottleTypeId" (selectionChange)="onTypeChange($event.value)" required>
              <mat-option *ngFor="let bt of bottleTypes" [value]="bt.id">{{ bt.name }}</mat-option>
            </mat-select>
          </mat-form-field>

          <p *ngIf="currentBalance !== null" style="margin-top: -10px; font-size: 0.9em; color: gray;">
            {{ t('currentEmptyBottles') }}: {{ currentBalance }}
          </p>
          
          <mat-form-field appearance="outline">
            <mat-label>{{ t('openingEmptyQuantity') }}</mat-label>
            <input matInput type="number" [(ngModel)]="formData.newQuantity" required>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>{{ t('reasonNotes') }}</mat-label>
            <input matInput [(ngModel)]="formData.reason">
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <div class="dialog-actions" style="padding: 10px;">
        <button type="button" class="btn btn--outline" (click)="onNoClick()">{{ t('cancel') }}</button>
        <button type="button" class="btn btn--primary" (click)="onSave()" [disabled]="!formData.bottleTypeId || formData.newQuantity == null">
          <mat-icon>save</mat-icon>
          <span>{{ t('saveBalance') }}</span>
        </button>
      </div>
    </ng-container>`
})
export class OpeningBalanceDialogComponent implements OnInit {
  formData: any = {};
  bottleTypes: BottleType[] = [];
  currentBalance: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<OpeningBalanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OpeningBalanceData,
    private bottleTypesService: BottleTypesService
  ) { }

  ngOnInit() {
    this.bottleTypesService.getBottleTypes().subscribe(res => this.bottleTypes = res);
  }

  onTypeChange(typeId: string) {
    const inv = this.data.inventory.find(i => i.bottleTypeId === typeId);
    this.currentBalance = inv ? inv.emptyBottles : 0;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Calculate the difference to send a "Correction" adjustment
    const difference = this.formData.newQuantity - (this.currentBalance || 0);
    this.dialogRef.close({
      bottleTypeId: this.formData.bottleTypeId,
      adjustmentType: 3, // Correction
      quantity: difference,
      reason: this.formData.reason || 'Set Opening Bottle Balance'
    });
  }
}



