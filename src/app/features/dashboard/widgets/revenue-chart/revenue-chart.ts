import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { REVENUE_TREND } from '../../dashboard-data';

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  templateUrl: './revenue-chart.html',
  styleUrl: './revenue-chart.scss',
})
export class RevenueChart {
  private readonly chartW = 560;
  private readonly chartH = 190;
  private readonly padY = 16;

  private readonly data = REVENUE_TREND;

  private readonly maxRevenue = Math.max(...this.data.map((d) => d.revenue));
  private readonly minRevenue = Math.min(...this.data.map((d) => d.revenue));

  readonly chartPoints = computed(() => {
    const max = this.maxRevenue;
    const min = this.minRevenue;
    const range = max - min || 1;
    const stepX = this.chartW / (this.data.length - 1);
    const usableH = this.chartH - this.padY * 2;

    return this.data.map((d, i) => {
      const x = i * stepX;
      const y = this.padY + usableH - ((d.revenue - min) / range) * usableH;
      return { x, y, ...d };
    });
  });

  readonly linePath = computed(() =>
    this.chartPoints()
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' '),
  );

  readonly areaPath = computed(() => {
    const pts = this.chartPoints();
    const line = this.linePath();
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.x.toFixed(1)} ${this.chartH} L ${first.x.toFixed(1)} ${this.chartH} Z`;
  });

  hoveredPoint = signal<number | null>(null);
}
