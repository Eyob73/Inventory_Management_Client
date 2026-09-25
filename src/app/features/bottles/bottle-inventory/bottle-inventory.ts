import { TranslocoModule } from '@jsverse/transloco';
import { Component, OnInit, OnDestroy, inject, ViewChild, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { BottleInventory } from '../../../core/services/bottle-inventory';
import { AdjustInventoryDialogComponent } from './adjust-inventory-dialog/adjust-inventory-dialog';
import { OpeningBalanceDialogComponent } from './opening-balance-dialog/opening-balance-dialog';
import { BottleInventoryStore } from '../../../store/bottle-inventory.store';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';
import { DataViewComponent, DataViewCardField, DataViewAction } from '../../../shared/components/data-view/data-view.component';

@Component({
  selector: 'app-bottle-inventory',
  standalone: true,
  imports: [
    TranslocoModule, 
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule, 
    MatPaginatorModule, 
    TableSkeleton, 
    FormsModule, 
    MatFormFieldModule, 
    MatInputModule,
    DataViewComponent
  ],
  templateUrl: './bottle-inventory.html',
  styleUrls: ['./bottle-inventory.scss']
})
export class BottleInventoryComponent implements OnInit, OnDestroy {
  store = inject(BottleInventoryStore);
  displayedColumns: string[] = ['bottleTypeName', 'fullBottles', 'emptyQuantity', 'damagedBottles', 'lostBottles', 'lastUpdatedAt'];

  dataSource = new MatTableDataSource<BottleInventory>([]);
  pageSizeOptions = [5, 10, 25, 50];
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  cardFields = computed<DataViewCardField[]>(() => [
    { key: 'bottleTypeName', label: 'Bottle Type', type: 'text' },
    { key: 'fullBottles', label: 'Full', type: 'text', valueFn: (i: any) => String(i.fullBottles || 0) },
    { key: 'emptyQuantity', label: 'Empty', type: 'text', valueFn: (i: any) => String(i.emptyQuantity || 0) },
    { key: 'damagedBottles', label: 'Damaged', type: 'text', valueFn: (i: any) => String(i.damagedBottles || 0) },
    { key: 'lostBottles', label: 'Lost', type: 'text', valueFn: (i: any) => String(i.lostBottles || 0) },
    { key: 'lastUpdatedAt', label: 'Last Updated', type: 'date' }
  ]);

  constructor(
    private dialog: MatDialog
  ) {
    effect(() => {
      this.dataSource.data = this.store.inventory() || [];
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.store.loadInventory({ search: term, pageIndex: 1 });
    });
  }

  onSearch(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  onPageChange(event: any): void { this.store.loadInventory({ pageIndex: event.pageIndex + 1, pageSize: event.pageSize }); }

  ngOnInit(): void {
    this.store.loadInventory();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  setOpeningBalance(): void {
    const dialogRef = this.dialog.open(OpeningBalanceDialogComponent, {
      width: '400px',
      data: { inventory: this.store.inventory() }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.store.adjustInventory(result);
      }
    });
  }

  adjustInventory(): void {
    const dialogRef = this.dialog.open(AdjustInventoryDialogComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.store.adjustInventory(result);
      }
    });
  }
}
