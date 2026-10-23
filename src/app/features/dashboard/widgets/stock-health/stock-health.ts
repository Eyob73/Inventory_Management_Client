import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DashboardStore } from '../../../../store/dashboard.store';

@Component({
  selector: 'app-stock-health',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './stock-health.html',
  styleUrl: './stock-health.scss',
})
export class StockHealth {
  private readonly store = inject(DashboardStore);
  
  readonly chartData = computed(() => {
    const data = this.store.data();
    if (!data) return [];
    return data.salesByCategory;
  });

  readonly categories = computed(() => {
    const data = this.chartData();
    if (!data.length) return [];
    const maxAmount = Math.max(...data.map(d => d.amount), 1);
    return data.map(item => ({
      name: item.name,
      amount: item.amount,
      quantity: item.quantity,
      formattedAmount: new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(item.amount),
      percent: Math.min(100, Math.max(4, Math.round((item.amount / maxAmount) * 100)))
    }));
  });
}
