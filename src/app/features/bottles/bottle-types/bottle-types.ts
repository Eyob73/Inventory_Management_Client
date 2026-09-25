import { TranslocoModule } from '@jsverse/transloco';
import { Component, OnInit, OnDestroy, inject, ViewChild, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { BottleType } from '../../../core/services/bottle-types';
import { BottleTypeDialogComponent } from './bottle-type-dialog/bottle-type-dialog';
import { BottleTypesStore } from '../../../store/bottle-types.store';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';
import { ConfirmDialogService } from '../../../ui/confirm-dialog/confirm-dialog.service';
import { DataViewComponent, DataViewCardField, DataViewAction } from '../../../shared/components/data-view/data-view.component';

@Component({
  selector: 'app-bottle-types',
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
    MatSelectModule,
    DataViewComponent
  ],
  templateUrl: './bottle-types.html',
  styleUrls: ['./bottle-types.scss']
})
export class BottleTypesComponent implements OnInit, OnDestroy {
  store = inject(BottleTypesStore);
  displayedColumns: string[] = ['name', 'depositAmount', 'actions'];
  
  dataSource = new MatTableDataSource<BottleType>([]);
  pageSizeOptions = [5, 10, 25, 50];
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  cardFields = computed<DataViewCardField[]>(() => [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'depositAmount', label: 'Deposit', type: 'currency' }
  ]);

  cardActions = computed<DataViewAction[]>(() => [
    { id: 'edit', icon: 'edit', label: 'Edit' },
    { id: 'delete', icon: 'delete_outline', label: 'Delete', color: 'warn' }
  ]);

  onCardAction(event: { actionId: string, item: any }) {
    if (event.actionId === 'edit') this.editType(event.item);
    else if (event.actionId === 'delete') this.deleteType(event.item);
  }



  constructor(
    private dialog: MatDialog,
    private confirmService: ConfirmDialogService
  ) {
    effect(() => {
      this.dataSource.data = this.store.bottleTypes() || [];
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.store.loadBottleTypes({ search: term, pageIndex: 1 });
    });
  }

  onSearch(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  onStatusChange(status: number | undefined): void {
    this.store.loadBottleTypes({ status, pageIndex: 1 });
  }

  onPageChange(event: PageEvent): void {
    this.store.loadBottleTypes({ pageIndex: event.pageIndex + 1, pageSize: event.pageSize });
  }

  ngOnInit(): void {
    this.store.loadBottleTypes();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
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

