import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardStore } from '../../../../store/dashboard.store';

@Component({
  selector: 'app-low-stock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './low-stock.html',
  styleUrl: './low-stock.scss',
})
export class LowStock {
  private readonly store = inject(DashboardStore);
  
  readonly lowStockAlerts = computed(() => {
    const low = this.store.lowStock();
    return low ? low.table.items : [];
  });
}
