import { Component, input, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { DashboardStore } from '../../../../store/dashboard.store';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, TranslocoDirective],
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss',
})
export class KpiCard {
  private readonly store = inject(DashboardStore);

  /** Injected via NgComponentOutlet's ngComponentOutletInputs */
  kpiType = input.required<'revenue' | 'orders' | 'profit' | 'low-stock'>();

  readonly kpi = computed(() => {
    const data = this.store.data();
    if (!data) return { label: 'Loading...', value: '-', deltaStr: '', deltaKey: undefined, positive: true, sub: '', icon: 'sync' };

    switch (this.kpiType()) {
      case 'revenue':
        return {
          label: 'Revenue',
          value: new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(data.totalSales.value),
          deltaStr: data.totalSales.changePercent ? `${data.totalSales.changePercent > 0 ? '+' : ''}${data.totalSales.changePercent.toFixed(1)}%` : '-',
          positive: (data.totalSales.changePercent ?? 0) >= 0,
          sub: 'dashboardWidgets.vsPrevPeriod',
          deltaKey: undefined,
          icon: 'payments',
        };
      case 'profit':
        return {
          label: 'Total Profit',
          value: new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(data.totalProfit.value),
          deltaStr: data.totalProfit.changePercent ? `${data.totalProfit.changePercent > 0 ? '+' : ''}${data.totalProfit.changePercent.toFixed(1)}%` : '-',
          positive: (data.totalProfit.changePercent ?? 0) >= 0,
          sub: 'dashboardWidgets.vsPrevPeriod',
          deltaKey: undefined,
          icon: 'account_balance_wallet',
        };
      case 'orders':
        return {
          label: 'Products Sold',
          value: data.totalProductsSold.value.toString(),
          deltaStr: data.totalProductsSold.changePercent ? `${data.totalProductsSold.changePercent > 0 ? '+' : ''}${data.totalProductsSold.changePercent.toFixed(1)}%` : '-',
          positive: (data.totalProductsSold.changePercent ?? 0) >= 0,
          sub: 'dashboardWidgets.vsPrevPeriod',
          deltaKey: undefined,
          icon: 'shopping_cart',
        };
      case 'low-stock':
        return {
          label: 'Low Stock SKUs',
          value: data.lowStockProducts.toString(),
          deltaKey: data.outOfStockProducts > 0 ? { key: 'dashboardWidgets.outOfStockMsg', count: data.outOfStockProducts } : { key: 'dashboardWidgets.stockHealthy' },
          positive: data.outOfStockProducts === 0,
          sub: 'dashboardWidgets.requiresAction',
          deltaStr: undefined,
          icon: 'warning',
        };
    }
  });
}
