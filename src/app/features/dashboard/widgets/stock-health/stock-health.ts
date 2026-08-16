import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CATEGORY_STOCK, CategoryStock } from '../../dashboard-data';

@Component({
  selector: 'app-stock-health',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatTooltipModule],
  templateUrl: './stock-health.html',
  styleUrl: './stock-health.scss',
})
export class StockHealth {
  categoryStock = CATEGORY_STOCK;

  stockPct(cat: CategoryStock): number {
    return Math.min(100, Math.round((cat.inStock / cat.capacity) * 100));
  }

  reorderPct(cat: CategoryStock): number {
    return Math.round((cat.reorderAt / cat.capacity) * 100);
  }

  isLow(cat: CategoryStock): boolean {
    return cat.inStock <= cat.reorderAt;
  }
}
