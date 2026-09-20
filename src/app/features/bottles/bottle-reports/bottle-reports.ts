import { TranslocoModule } from '@jsverse/transloco';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { BottleReportsStore } from '../../../store/bottle-reports.store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-bottle-reports',
  standalone: true,
  imports: [TranslocoModule, 
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatDatepickerModule, 
    MatNativeDateModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './bottle-reports.html',
  styleUrls: ['./bottle-reports.scss']
})
export class BottleReportsComponent {
  store = inject(BottleReportsStore);

  reportType: string = 'movement';
  startDate: Date | null = null;
  endDate: Date | null = null;

  movementColumns = ['date', 'transactionType', 'bottleTypeName', 'customerName', 'quantity', 'reference'];
  depositColumns = ['date', 'customerName', 'bottleTypeName', 'transactionType', 'depositAmount'];
  customerColumns = ['customerName', 'bottleTypeName', 'unreturnedBottles', 'totalDeposit', 'lastUpdatedAt'];
  lossColumns = ['date', 'bottleTypeName', 'transactionType', 'quantity', 'notes'];

  generateReport() {
    let startIso = null;
    let endIso = null;

    if (this.startDate) {
      startIso = new Date(this.startDate.getTime() - (this.startDate.getTimezoneOffset() * 60000)).toISOString();
    }
    if (this.endDate) {
      endIso = new Date(this.endDate.getTime() - (this.endDate.getTimezoneOffset() * 60000)).toISOString();
    }

    this.store.generateReport({
      type: this.reportType,
      startDate: startIso,
      endDate: endIso
    });
  }
}
