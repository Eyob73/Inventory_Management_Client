import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, NgClass } from '@angular/common';
import { DashboardStore } from '../../../../store/dashboard.store';
import { TranslocoDirective } from '@jsverse/transloco';

export interface FormattedActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  icon: string;
  type: string;
}

@Component({
  selector: 'app-recent-activities',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DatePipe, NgClass, TranslocoDirective],
  templateUrl: './recent-activities.html',
  styleUrl: './recent-activities.scss',
})
export class RecentActivities {
  private readonly store = inject(DashboardStore);

  readonly activities = computed<FormattedActivity[]>(() => {
    const act = this.store.activities();
    if (!act) return [];
    
    return act.table.items.map(row => {
      let icon = 'sync_alt';
      let type = 'system';
      let actionKey = 'stockUpdated';
      let target = `${row.product} (${row.quantityChange > 0 ? '+' : ''}${row.quantityChange})`;

      if (row.transactionType.toLowerCase().includes('sale')) {
        icon = 'local_shipping';
        type = 'order';
        actionKey = 'saleProcessed';
        if (row.referenceNumber) target += ` [${row.referenceNumber}]`;
      } else if (row.transactionType.toLowerCase().includes('purchase')) {
        icon = 'post_add';
        type = 'supplier';
        actionKey = 'purchaseReceived';
        if (row.referenceNumber) target += ` [${row.referenceNumber}]`;
      } else if (row.transactionType.toLowerCase().includes('adjustment')) {
        icon = 'edit_note';
        type = 'stock';
        actionKey = 'stockAdjustment';
      }

      return {
        id: row.id,
        user: row.performedBy || '',
        action: actionKey,
        target,
        timestamp: row.date,
        icon,
        type
      };
    });
  });
}
