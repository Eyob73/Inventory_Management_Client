import { Component, Inject, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CustomerBottleBalance } from '../../../../core/services/customer-bottles';
import { CustomerService, CustomerDetail } from '../../../../services/customer.service';
import { BottleTypesService, BottleType } from '../../../../core/services/bottle-types';
import { BottleTransactionsService, BottleTransaction } from '../../../../core/services/bottle-transactions';

export interface CustomerBottleDetailsDialogData {
  balance: CustomerBottleBalance;
}

@Component({
  selector: 'app-customer-bottle-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    TranslocoDirective
  ],
  templateUrl: './customer-bottle-details-dialog.html',
  styleUrl: './customer-bottle-details-dialog.scss'
})
export class CustomerBottleDetailsDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CustomerBottleDetailsDialogComponent>);
  private customerService = inject(CustomerService);
  private bottleTypesService = inject(BottleTypesService);
  private transactionsService = inject(BottleTransactionsService);
  private translocoService = inject(TranslocoService);

  balance: CustomerBottleBalance;
  customer = signal<CustomerDetail | null>(null);
  bottleType = signal<BottleType | null>(null);
  recentTransactions = signal<BottleTransaction[]>([]);
  isLoadingCustomer = signal<boolean>(false);
  isLoadingTransactions = signal<boolean>(false);

  // Responsive view mode for recent transactions: 'cards' on mobile/tablet, 'table' on desktop
  historyViewMode = signal<'table' | 'cards'>(
    typeof window !== 'undefined' && window.innerWidth <= 680 ? 'cards' : 'table'
  );
  private userOverrodeViewMode = false;

  transactionColumns: string[] = ['createdAt', 'type', 'quantity', 'depositAmount', 'createdBy'];

  // Average deposit per bottle (accounting for additional bottle deposit)
  avgDepositPerBottle = computed<number>(() => {
    if (!this.balance || this.balance.balance <= 0) return 0;
    return this.balance.totalDeposit / this.balance.balance;
  });

  @HostListener('window:resize')
  onResize(): void {
    if (!this.userOverrodeViewMode && typeof window !== 'undefined') {
      this.historyViewMode.set(window.innerWidth <= 680 ? 'cards' : 'table');
    }
  }

  setHistoryViewMode(mode: 'table' | 'cards'): void {
    this.userOverrodeViewMode = true;
    this.historyViewMode.set(mode);
  }

  constructor(@Inject(MAT_DIALOG_DATA) public data: CustomerBottleDetailsDialogData) {
    this.balance = data.balance;
  }

  ngOnInit(): void {
    if (this.balance?.customerId) {
      this.loadCustomerDetails(this.balance.customerId);
    }

    if (this.balance?.bottleTypeId) {
      this.loadBottleTypeDetails(this.balance.bottleTypeId);
    }

    this.loadRecentTransactions();
  }

  private loadCustomerDetails(customerId: string): void {
    this.isLoadingCustomer.set(true);
    this.customerService.getById(customerId).subscribe({
      next: (details) => {
        this.customer.set(details);
        this.isLoadingCustomer.set(false);
      },
      error: () => {
        this.isLoadingCustomer.set(false);
      }
    });
  }

  private loadBottleTypeDetails(bottleTypeId: string): void {
    this.bottleTypesService.getBottleTypes().subscribe({
      next: (types) => {
        const found = types.find((t) => t.id === bottleTypeId);
        if (found) {
          this.bottleType.set(found);
        }
      },
      error: () => {}
    });
  }

  private loadRecentTransactions(): void {
    this.isLoadingTransactions.set(true);
    const searchFilter = this.balance.customerName?.trim() || undefined;

    this.transactionsService.getPagedTransactions(1, 15, searchFilter).subscribe({
      next: (res) => {
        const filtered = (res.items || []).filter(tx =>
          (!this.balance.customerName || (tx.customerName || '').toLowerCase() === this.balance.customerName.toLowerCase())
        );
        this.recentTransactions.set(filtered.slice(0, 8));
        this.isLoadingTransactions.set(false);
      },
      error: () => {
        this.isLoadingTransactions.set(false);
      }
    });
  }

  getTransactionBadgeClass(type: string | number): string {
    const t = String(type).toLowerCase();
    if (t.includes('issued') || t === '1') return 'badge--issued';
    if (t.includes('returned') || t === '2') return 'badge--returned';
    if (t.includes('damaged') || t === '3') return 'badge--damaged';
    if (t.includes('lost') || t === '4') return 'badge--lost';
    return 'badge--default';
  }

  getCardAccentClass(type: string | number): string {
    const t = String(type).toLowerCase();
    if (t.includes('issued') || t === '1') return 'card-accent--issued';
    if (t.includes('returned') || t === '2') return 'card-accent--returned';
    if (t.includes('damaged') || t === '3') return 'card-accent--damaged';
    if (t.includes('lost') || t === '4') return 'card-accent--lost';
    return '';
  }

  onReturn(): void {
    this.dialogRef.close({ action: 'return', balance: this.balance });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
