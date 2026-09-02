import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';

export interface BarDataItem {
  name: string;
  value: number;
  secondaryValue?: number;
}

@Component({
  selector: 'app-report-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  templateUrl: './report-bar-chart.html',
  styleUrl: './report-bar-chart.scss',
})
export class ReportBarChart {
  data = input<BarDataItem[]>([]);
  horizontal = input<boolean>(false);
  barColor = input<string>('var(--primary, #3b82f6)');
  formatAsCurrency = input<boolean>(true);

  hoveredIndex = signal<number | null>(null);

  readonly hasData = computed(() => this.data().length > 0 && this.data().some(d => d.value > 0));

  readonly maxVal = computed(() => {
    const list = this.data();
    if (!list.length) return 1;
    const max = Math.max(...list.map(d => d.value));
    return max === 0 ? 1 : max;
  });
}
