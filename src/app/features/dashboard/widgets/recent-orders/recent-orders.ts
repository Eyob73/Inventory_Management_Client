import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Order, RECENT_ORDERS } from '../../dashboard-data';

@Component({
  selector: 'app-recent-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, NgClass, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './recent-orders.html',
  styleUrl: './recent-orders.scss',
})
export class RecentOrders {
  displayedColumns = ['id', 'customer', 'items', 'total', 'status'];
  recentOrders = RECENT_ORDERS;

  statusClass(status: Order['status']): string {
    return {
      Fulfilled: 'status-fulfilled',
      Processing: 'status-processing',
      Backordered: 'status-backordered',
    }[status];
  }
}
