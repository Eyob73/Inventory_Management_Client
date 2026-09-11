import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { DashboardStore } from '../../../../store/dashboard.store';

@Component({
  selector: 'app-top-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './recent-orders.html',
  styleUrl: './recent-orders.scss',
})
export class RecentOrders {
  private readonly store = inject(DashboardStore);
  
  readonly topProducts = computed(() => {
    const data = this.store.data();
    return data ? data.topProducts : [];
  });

  displayedColumns = ['name', 'quantity', 'amount'];
}
