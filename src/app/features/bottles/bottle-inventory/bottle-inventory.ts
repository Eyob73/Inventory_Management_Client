import { TranslocoModule } from '@jsverse/transloco';
import { Component, OnInit, inject, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { BottleInventory } from '../../../core/services/bottle-inventory';
import { AdjustInventoryDialogComponent } from './adjust-inventory-dialog/adjust-inventory-dialog';
import { OpeningBalanceDialogComponent } from './opening-balance-dialog/opening-balance-dialog';
import { BottleInventoryStore } from '../../../store/bottle-inventory.store';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-bottle-inventory',
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatPaginatorModule, TableSkeleton],
  templateUrl: './bottle-inventory.html',
  styleUrls: ['./bottle-inventory.scss']
})
export class BottleInventoryComponent implements OnInit {
  store = inject(BottleInventoryStore);
  displayedColumns: string[] = ['bottleTypeName', 'fullBottles', 'emptyQuantity', 'damagedBottles', 'lostBottles', 'lastUpdatedAt'];

  dataSource = new MatTableDataSource<BottleInventory>([]);
  pageSizeOptions = [5, 10, 25, 50];



  constructor(
    private dialog: MatDialog
  ) {
    effect(() => {
      this.dataSource.data = this.store.inventory() || [];
    });
  }

  onPageChange(event: any): void { this.store.loadInventory({ pageIndex: event.pageIndex + 1, pageSize: event.pageSize }); }

  ngOnInit(): void {
    this.store.loadInventory();
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
