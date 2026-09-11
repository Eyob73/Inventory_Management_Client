import { Component, input, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DashboardStore } from '../../../../store/dashboard.store';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss',
})
export class KpiCard {
  private readonly store = inject(DashboardStore);

  /** Injected via NgComponentOutlet's ngComponentOutletInputs */
  kpiType = input.required<'revenue' | 'orders' | 'profit' | 'low-stock'>();

  readonly kpi = computed(() => {
    const data = this.store.data();
    if (!data) return { label: 'Loading...', value: '-', delta: '', positive: true, sub: '', icon: 'sync' };

    switch (this.kpiType()) {
      case 'revenue':
        return {
          label: 'Revenue',
          value: new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(data.totalSales.value),
          delta: data.totalSales.changePercent ? `${data.totalSales.changePercent > 0 ? '+' : ''}${data.totalSales.changePercent.toFixed(1)}%` : '-',
          positive: (data.totalSales.changePercent ?? 0) >= 0,
          sub: 'vs prev period',
          icon: 'payments',
        };
      case 'profit':
        return {
          label: 'Total Profit',
          value: new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(data.totalProfit.value),
          delta: data.totalProfit.changePercent ? `${data.totalProfit.changePercent > 0 ? '+' : ''}${data.totalProfit.changePercent.toFixed(1)}%` : '-',
          positive: (data.totalProfit.changePercent ?? 0) >= 0,
          sub: 'vs prev period',
          icon: 'account_balance_wallet',
        };
      case 'orders':
        return {
          label: 'Products Sold',
          value: data.totalProductsSold.value.toString(),
          delta: data.totalProductsSold.changePercent ? `${data.totalProductsSold.changePercent > 0 ? '+' : ''}${data.totalProductsSold.changePercent.toFixed(1)}%` : '-',
          positive: (data.totalProductsSold.changePercent ?? 0) >= 0,
          sub: 'vs prev period',
          icon: 'shopping_cart',
        };
      case 'low-stock':
        return {
          label: 'Low Stock SKUs',
          value: data.lowStockProducts.toString(),
          delta: data.outOfStockProducts > 0 ? `${data.outOfStockProducts} out of stock` : 'Stock is healthy',
          positive: data.outOfStockProducts === 0,
          sub: 'requires action',
          icon: 'warning',
        };
    }
  });
}
