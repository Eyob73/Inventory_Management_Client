import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LOW_STOCK_ALERTS } from '../../dashboard-data';

@Component({
  selector: 'app-low-stock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './low-stock.html',
  styleUrl: './low-stock.scss',
})
export class LowStock {
  lowStockAlerts = LOW_STOCK_ALERTS;
}
