import { TranslocoModule } from '@jsverse/transloco';
import { Component, OnInit, inject, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { BottleType } from '../../../core/services/bottle-types';
import { BottleTypeDialogComponent } from './bottle-type-dialog/bottle-type-dialog';
import { BottleTypesStore } from '../../../store/bottle-types.store';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';
import { ConfirmDialogService } from '../../../ui/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-bottle-types',
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatPaginatorModule, TableSkeleton],
  templateUrl: './bottle-types.html',
  styleUrls: ['./bottle-types.scss']
})
export class BottleTypesComponent implements OnInit {
  store = inject(BottleTypesStore);
  displayedColumns: string[] = ['name', 'depositAmount', 'actions'];
  
  dataSource = new MatTableDataSource<BottleType>([]);
  pageSizeOptions = [5, 10, 25, 50];



  constructor(
    private dialog: MatDialog,
    private confirmService: ConfirmDialogService
  ) {
    effect(() => {
      this.dataSource.data = this.store.bottleTypes() || [];
    });
  }

  onPageChange(event: any): void { this.store.loadBottleTypes({ pageIndex: event.pageIndex + 1, pageSize: event.pageSize }); }

  ngOnInit(): void {
    this.store.loadBottleTypes();
  }

  addType(): void {
    const dialogRef = this.dialog.open(BottleTypeDialogComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.store.createBottleType(result);
      }
    });
  }

  editType(bottleType: BottleType): void {
    const dialogRef = this.dialog.open(BottleTypeDialogComponent, {
      width: '400px',
      data: bottleType
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.store.updateBottleType({ id: bottleType.id, payload: result });
      }
    });
  }

  deleteType(type: BottleType): void {
    this.confirmService.confirmDelete('Bottle Type', type.name).subscribe(confirmed => {
      if (confirmed) {
        this.store.deleteBottleType(type.id);
      }
    });
  }
}

