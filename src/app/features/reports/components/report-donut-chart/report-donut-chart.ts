import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { NamedAmount } from '../../../../models/reports.model';

const PALETTE = [
  'var(--cobalt)',
  'var(--moss)',
  'var(--teal)',
  'var(--amber)',
  'var(--rose)',
  'var(--slate)',
  'var(--cobalt-soft)',
  'var(--moss-soft)',
];

@Component({
  selector: 'app-report-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  templateUrl: './report-donut-chart.html',
  styleUrl: './report-donut-chart.scss',
})
export class ReportDonutChart {
  data = input<NamedAmount[]>([]);
  formatAsCurrency = input<boolean>(true);

  hoveredIndex = signal<number | null>(null);

  readonly hasData = computed(
    () => this.data().length > 0 && this.data().some((d) => d.amount > 0),
  );

  readonly totalAmount = computed(() => this.data().reduce((acc, curr) => acc + curr.amount, 0));

  readonly slices = computed(() => {
    const list = this.data();
    const total = this.totalAmount();
    if (!total || !list.length) return [];

    let currentAngle = 0;
    const center = 100;
    const radius = 80;
    const innerRadius = 52;

    return list.map((item, index) => {
      const percentage = item.amount / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const path = this.describeDonutSlice(
        center,
        center,
        radius,
        innerRadius,
        startAngle,
        endAngle,
      );
      const color = PALETTE[index % PALETTE.length];

      return {
        item,
        percentage: Math.round(percentage * 100),
        path,
        color,
      };
    });
  });

  private describeDonutSlice(
    cx: number,
    cy: number,
    rOuter: number,
    rInner: number,
    startAngle: number,
    endAngle: number,
  ): string {
    // If slice takes up full 300+ degrees, cap slightly to avoid SVG arc anomaly
    if (endAngle - startAngle >= 360) {
      endAngle = startAngle + 359.99;
    }

    const radStart = (startAngle - 90) * (Math.PI / 180);
    const radEnd = (endAngle - 90) * (Math.PI / 180);

    const x1Outer = cx + rOuter * Math.cos(radStart);
    const y1Outer = cy + rOuter * Math.sin(radStart);
    const x2Outer = cx + rOuter * Math.cos(radEnd);
    const y2Outer = cy + rOuter * Math.sin(radEnd);

    const x1Inner = cx + rInner * Math.cos(radEnd);
    const y1Inner = cy + rInner * Math.sin(radEnd);
    const x2Inner = cx + rInner * Math.cos(radStart);
    const y2Inner = cy + rInner * Math.sin(radStart);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${x1Outer.toFixed(2)} ${y1Outer.toFixed(2)}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2Outer.toFixed(2)} ${y2Outer.toFixed(2)}`,
      `L ${x1Inner.toFixed(2)} ${y1Inner.toFixed(2)}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x2Inner.toFixed(2)} ${y2Inner.toFixed(2)}`,
      'Z',
    ].join(' ');
  }
}
