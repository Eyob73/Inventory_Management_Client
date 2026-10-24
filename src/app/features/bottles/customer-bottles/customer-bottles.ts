import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Component, OnInit, OnDestroy, inject, ViewChild, effect, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ReturnBottleDialogComponent } from './return-bottle-dialog/return-bottle-dialog';
import { CustomerBottleDetailsDialogComponent } from './customer-bottle-details-dialog/customer-bottle-details-dialog';
import { CustomerBottleBalance } from '../../../core/services/customer-bottles';
import { CustomerBottlesStore } from '../../../store/customer-bottles.store';
import { BottleTypesStore } from '../../../store/bottle-types.store';
import { TableSkeleton } from '../../../ui/table-skeleton/table-skeleton';
import { DataViewComponent, DataViewCardField, DataViewAction } from '../../../shared/components/data-view/data-view.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-customer-bottles',
  standalone: true,
  imports: [
    TranslocoModule, 
    CommonModule, 
    MatTableModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule,
    MatPaginatorModule, 
    TableSkeleton, 
    FormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    DataViewComponent
  ],
  templateUrl: './customer-bottles.html',
  styleUrls: ['./customer-bottles.scss']
})
export class CustomerBottlesComponent implements OnInit, OnDestroy {
  store = inject(CustomerBottlesStore);
  bottleTypesStore = inject(BottleTypesStore);
  transloco = inject(TranslocoService, { optional: true });
  private currentLang = this.transloco
    ? toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() })
    : signal('en');

  displayedColumns: string[] = ['customerName', 'bottleTypeName', 'balance', 'totalDeposit', 'actions'];

  dataSource = new MatTableDataSource<CustomerBottleBalance>([]);
  pageSizeOptions = [5, 10, 25, 50];
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  cardFields = computed<DataViewCardField[]>(() => {
    this.currentLang();
    return [
      { key: 'customerName', label: this.transloco?.translate('bottles.customer') || 'Customer', type: 'text' },
      { key: 'bottleTypeName', label: this.transloco?.translate('bottles.bottleType') || 'Bottle Type', type: 'text' },
      { key: 'balance', label: this.transloco?.translate('bottles.unreturnedBottles') || 'Unreturned Bottles', type: 'badge', badgeClassFn: (t) => t.balance > 0 ? 'status--active' : 'status--inactive', valueFn: (t) => String(t.balance) },
      { key: 'totalDeposit', label: this.transloco?.translate('bottles.totalDeposit') || 'Total Deposit', type: 'currency' }
    ];
  });

  cardActions = computed<DataViewAction[]>(() => {
    this.currentLang();
    return [
      { id: 'view', icon: 'visibility', label: this.transloco?.translate('bottles.viewDetails') || 'View Details' },
      { id: 'return', icon: 'keyboard_return', label: this.transloco?.translate('bottles.return') || 'Return', visibleFn: (t: any) => t.balance > 0, hideFn: (t: any) => t.balance === 0 } as any
    ];
  });

  onCardAction(event: { actionId: string, item: any }) {
    if (event.actionId === 'view') this.openViewDialog(event.item);
    else if (event.actionId === 'return') this.openReturnDialog(event.item);
  }

  constructor(private dialog: MatDialog) {
    effect(() => {
      this.dataSource.data = this.store.balances() || [];
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.store.loadBalances({ search: term, pageIndex: 1 });
    });
  }

  onSearch(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  onBottleTypeChange(bottleTypeId: string | undefined): void {
    this.store.loadBalances({ bottleTypeId, pageIndex: 1 });
  }

  onHasBalanceChange(hasBalance: boolean | undefined): void {
    this.store.loadBalances({ hasBalance, pageIndex: 1 });
  }

  openViewDialog(element: CustomerBottleBalance): void {
    const dialogRef = this.dialog.open(CustomerBottleDetailsDialogComponent, {
      width: '760px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      panelClass: 'customer-bottle-details-dialog-panel',
      data: { balance: element }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'return' && result.balance) {
        this.openReturnDialog(result.balance);
      }
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
    this.bottleTypesStore.loadBottleTypes({ pageSize: 100 });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }
}
