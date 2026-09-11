import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, NgClass } from '@angular/common';
import { DashboardStore } from '../../../../store/dashboard.store';

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
  imports: [MatIconModule, DatePipe, NgClass],
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
      let action = 'Stock Updated';
      let target = `${row.product} (${row.quantityChange > 0 ? '+' : ''}${row.quantityChange})`;

      if (row.transactionType.toLowerCase().includes('sale')) {
        icon = 'local_shipping';
        type = 'order';
        action = 'Sale Processed';
        if (row.referenceNumber) target += ` [${row.referenceNumber}]`;
      } else if (row.transactionType.toLowerCase().includes('purchase')) {
        icon = 'post_add';
        type = 'supplier';
        action = 'Purchase Received';
        if (row.referenceNumber) target += ` [${row.referenceNumber}]`;
      } else if (row.transactionType.toLowerCase().includes('adjustment')) {
        icon = 'edit_note';
        type = 'stock';
        action = 'Stock Adjustment';
      }

      return {
        id: row.id,
        user: row.performedBy || 'System',
        action,
        target,
        timestamp: row.date,
        icon,
        type
      };
    });
  });
}
