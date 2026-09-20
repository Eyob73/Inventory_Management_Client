import { TranslocoModule } from '@jsverse/transloco';
import { Component, OnInit, inject, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { BottleTransaction } from '../../../core/services/bottle-transactions';
import { BottleTransactionsStore } from '../../../store/bottle-transactions.store';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-bottle-transactions',
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatTableModule, MatIconModule, MatPaginatorModule, TableSkeleton],
  templateUrl: './bottle-transactions.html',
  styleUrls: ['./bottle-transactions.scss']
})
export class BottleTransactionsComponent implements OnInit {
  store = inject(BottleTransactionsStore);
  displayedColumns: string[] = ['createdAt', 'bottleTypeName', 'transactionType', 'customerName', 'quantity', 'depositAmount', 'createdBy', 'notes'];

  dataSource = new MatTableDataSource<BottleTransaction>([]);
  pageSizeOptions = [5, 10, 25, 50];



  constructor() {
    effect(() => {
      this.dataSource.data = this.store.transactions() || [];
    });
  }

  onPageChange(event: any): void { this.store.loadTransactions({ pageIndex: event.pageIndex + 1, pageSize: event.pageSize }); }

  ngOnInit(): void {
    this.store.loadTransactions();
  }
}
