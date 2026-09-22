import { TranslocoModule } from '@jsverse/transloco';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BottleDashboardStore } from '../../../store/bottle-dashboard.store';
import { BottleTransactionsStore } from '../../../store/bottle-transactions.store';
import { BottleInventoryStore } from '../../../store/bottle-inventory.store';
import { BottleTypesStore } from '../../../store/bottle-types.store';
import { AuthStore } from '../../../store/auth.store';
import { CardSkeleton } from '../../../ui/card-skeleton/card-skeleton';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bottle-dashboard',
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatCardModule, MatIconModule, CardSkeleton, RouterModule],
  templateUrl: './bottle-dashboard.html',
  styleUrls: ['./bottle-dashboard.scss']
})
export class BottleDashboardComponent implements OnInit {
  store = inject(BottleDashboardStore);
  transactionsStore = inject(BottleTransactionsStore);
  inventoryStore = inject(BottleInventoryStore);
  typesStore = inject(BottleTypesStore);
  authStore = inject(AuthStore);

  ngOnInit(): void {
    this.store.loadDashboardStats();
    this.transactionsStore.loadTransactions({ pageIndex: 1, pageSize: 5 });
    this.inventoryStore.loadInventory({ pageIndex: 1, pageSize: 100 });
    this.typesStore.loadBottleTypes({ pageIndex: 1, pageSize: 100 });
  }

  getBottleTypeDetails(bottleTypeId: string) {
    return this.typesStore.bottleTypes().find(t => t.id === bottleTypeId);
  }

  getBottleTypeDetailsByName(bottleTypeName: string) {
    return this.typesStore.bottleTypes().find(t => t.name === bottleTypeName);
  }

  canEditTypes(): boolean {
    return ['Admin', 'Manager'].includes(this.authStore.userRole() || '');
  }

  getTxColorClass(type: string | number): string {
    const typeStr = String(type).toLowerCase();
    if (typeStr.includes('issued')) return 'tx-issued';
    if (typeStr.includes('returned')) return 'tx-returned';
    if (typeStr.includes('deposit') && typeStr.includes('collected')) return 'tx-deposit-collected';
    if (typeStr.includes('deposit') && typeStr.includes('refunded')) return 'tx-deposit-refunded';
    if (typeStr.includes('exchange')) return 'tx-exchange';
    if (typeStr.includes('received') || typeStr.includes('add')) return 'tx-added';
    if (typeStr.includes('adjustment') || typeStr.includes('lost') || typeStr.includes('damaged')) return 'tx-adjustment';
    return 'tx-default';
  }

  getTxIcon(type: string | number): string {
    const typeStr = String(type).toLowerCase();
    if (typeStr.includes('issued')) return 'arrow_outward';
    if (typeStr.includes('returned')) return 'arrow_downward';
    if (typeStr.includes('deposit') && typeStr.includes('collected')) return 'attach_money';
    if (typeStr.includes('deposit') && typeStr.includes('refunded')) return 'money_off';
    if (typeStr.includes('exchange')) return 'sync_alt';
    if (typeStr.includes('received') || typeStr.includes('add')) return 'add_circle';
    if (typeStr.includes('adjustment') || typeStr.includes('lost') || typeStr.includes('damaged')) return 'remove_circle';
    return 'swap_horiz';
  }

  getTxLabel(type: string | number): string {
    const typeStr = String(type);
    if (!Number.isNaN(Number(typeStr))) {
        const num = Number(typeStr);
        switch (num) {
            case 0: return 'transactionTypes.received';
            case 1: return 'transactionTypes.issued';
            case 2: return 'transactionTypes.returned';
            case 3: return 'transactionTypes.adjustment';
            case 4: return 'transactionTypes.lost';
            case 5: return 'transactionTypes.damaged';
        }
    }
    return 'transactionTypes.' + typeStr.toLowerCase();
  }

  getInventoryStatus(inv: any): string {
    const minStock = 50; 
    if (inv.emptyBottles <= minStock / 2) return 'inventoryStatus.critical';
    if (inv.emptyBottles <= minStock) return 'inventoryStatus.lowStock';
    return 'inventoryStatus.good';
  }

  getInventoryStatusClass(inv: any): string {
    const minStock = 50;
    if (inv.emptyBottles <= minStock / 2) return 'status--critical';
    if (inv.emptyBottles <= minStock) return 'status--low-stock';
    return 'status--active';
  }
}
