import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChartPoint } from '../../../../models/reports.model';

@Component({
  selector: 'app-report-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  templateUrl: './report-line-chart.html',
  styleUrl: './report-line-chart.scss',
})
export class ReportLineChart {
  readonly Math = Math;
  data = input<ChartPoint[]>([]);
  color = input<string>('var(--teal)');
  formatAsCurrency = input<boolean>(true);

  readonly width = 600;
  readonly height = 220;
  readonly padY = 24;
  readonly padX = 20;

  readonly hasData = computed(() => this.data().length > 0 && this.data().some(d => d.value > 0));

  private readonly maxVal = computed(() => {
    const list = this.data();
    if (!list.length) return 1;
    const max = Math.max(...list.map(d => d.value));
    return max === 0 ? 1 : max;
  });

  private readonly minVal = computed(() => {
    const list = this.data();
    if (!list.length) return 0;
    return Math.min(0, ...list.map(d => d.value));
  });

  readonly chartPoints = computed(() => {
    const list = this.data();
    if (!list.length) return [];
    const max = this.maxVal();
    const min = this.minVal();
    const range = max - min || 1;
    const stepX = (this.width - this.padX * 2) / Math.max(1, list.length - 1);
    const usableH = this.height - this.padY * 2;

    return list.map((d, i) => {
      const x = this.padX + i * stepX;
      const y = this.padY + usableH - ((d.value - min) / range) * usableH;
      return { x, y, ...d };
    });
  });

  readonly linePath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
  });

  readonly areaPath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    const line = this.linePath();
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.x.toFixed(1)} ${this.height - 10} L ${first.x.toFixed(1)} ${this.height - 10} Z`;
  });

  hoveredPoint = signal<number | null>(null);
}
