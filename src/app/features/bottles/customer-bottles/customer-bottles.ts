import { TranslocoModule } from '@jsverse/transloco';
import { Component, OnInit, inject, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { ReturnBottleDialogComponent } from './return-bottle-dialog/return-bottle-dialog';
import { CustomerBottleBalance } from '../../../core/services/customer-bottles';
import { CustomerBottlesStore } from '../../../store/customer-bottles.store';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-customer-bottles',
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatTableModule, MatDialogModule, MatButtonModule, MatIconModule, MatPaginatorModule, TableSkeleton],
  templateUrl: './customer-bottles.html',
  styleUrls: ['./customer-bottles.scss']
})
export class CustomerBottlesComponent implements OnInit {
  store = inject(CustomerBottlesStore);
  displayedColumns: string[] = ['customerName', 'bottleTypeName', 'balance', 'totalDeposit', 'actions'];

  dataSource = new MatTableDataSource<CustomerBottleBalance>([]);
  pageSizeOptions = [5, 10, 25, 50];



  constructor(private dialog: MatDialog) {
    effect(() => {
      this.dataSource.data = this.store.balances() || [];
    });
  }

  openReturnDialog(element: CustomerBottleBalance): void {
    const dialogRef = this.dialog.open(ReturnBottleDialogComponent, {
      width: '400px',
      data: {
        customerName: element.customerName,
        bottleTypeName: element.bottleTypeName,
        maxQuantity: element.balance
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.store.returnBottles({
          customerId: element.customerId,
          bottleTypeId: element.bottleTypeId,
          quantity: result.quantity,
          refundAmount: result.refundAmount
        });
      }
    });
  }

  onPageChange(event: any): void { this.store.loadBalances({ pageIndex: event.pageIndex + 1, pageSize: event.pageSize }); }

  ngOnInit(): void {
    this.store.loadBalances();
  }
}
