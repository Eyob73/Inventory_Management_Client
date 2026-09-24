import { TranslocoModule } from '@jsverse/transloco';
import { Component, OnInit, OnDestroy, inject, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { BottleTransaction } from '../../../core/services/bottle-transactions';
import { BottleTransactionsStore } from '../../../store/bottle-transactions.store';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-bottle-transactions',
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatPaginatorModule, TableSkeleton, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './bottle-transactions.html',
  styleUrls: ['./bottle-transactions.scss']
})
export class BottleTransactionsComponent implements OnInit, OnDestroy {
  store = inject(BottleTransactionsStore);
  displayedColumns: string[] = ['createdAt', 'bottleTypeName', 'transactionType', 'customerName', 'quantity', 'depositAmount', 'createdBy', 'notes'];

  dataSource = new MatTableDataSource<BottleTransaction>([]);
  pageSizeOptions = [5, 10, 25, 50];
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  constructor() {
    effect(() => {
      this.dataSource.data = this.store.transactions() || [];
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.store.loadTransactions({ search: term, pageIndex: 1 });
    });
  }

  onSearch(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  onStatusChange(status: number | undefined): void {
    this.store.loadTransactions({ status, pageIndex: 1 });
  }

  onPageChange(event: PageEvent): void {
    this.store.loadTransactions({ pageIndex: event.pageIndex + 1, pageSize: event.pageSize });
  }

  ngOnInit(): void {
    this.store.loadTransactions();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }
}
