import { Component, ChangeDetectionStrategy, effect, ViewChild, ElementRef, OnDestroy, inject, computed } from '@angular/core';
import { DashboardStore } from '../../../../store/dashboard.store';
import Chart from 'chart.js/auto';

function getCssVariable(name: string): string {
  if (name.startsWith('var(')) {
    const varName = name.match(/var\(([^),]+)/)?.[1];
    if (varName) {
      return getComputedStyle(document.documentElement).getPropertyValue(varName.trim()).trim() || '#14b8a6';
    }
  }
  return name;
}

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './revenue-chart.html',
  styleUrl: './revenue-chart.scss',
})
export class RevenueChart implements OnDestroy {
  private readonly store = inject(DashboardStore);
  
  readonly chartData = computed(() => {
    const data = this.store.data();
    if (!data) return [];
    return data.salesOverTime;
  });

  readonly peakFormatted = computed(() => {
    const data = this.chartData();
    if (!data.length) return null;
    const max = Math.max(...data.map(d => d.value));
    if (max <= 0) return null;
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(max);
  });

  private chartInstance: Chart | null = null;
  private canvasEl?: ElementRef<HTMLCanvasElement>;
  private resizeObserver?: ResizeObserver;

  @ViewChild('chartCanvas') set canvas(el: ElementRef<HTMLCanvasElement> | undefined) {
    this.canvasEl = el;
    this.updateChart();
    this.setupResizeObserver();
  }

  constructor() {
    effect(() => {
      this.updateChart();
    });
  }

  private setupResizeObserver() {
    const parent = this.canvasEl?.nativeElement.parentElement;
    if (!parent) return;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (this.chartInstance) {
          this.chartInstance.resize();
        }
      });
    });
    this.resizeObserver.observe(parent);
  }

  private updateChart() {
    const data = this.chartData(); // Read signal early to track dependencies
    
    if (!this.canvasEl) return;
    const ctx = this.canvasEl.nativeElement.getContext('2d');
    if (!ctx) return;

    this.setupResizeObserver();

    const resolvedColor = getCssVariable('var(--moss)') || '#41674b';

    if (this.chartInstance) {
      this.chartInstance.data.labels = data.map(d => new Date(d.label).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
      this.chartInstance.data.datasets[0].data = data.map(d => d.value);
      this.chartInstance.data.datasets[0].borderColor = resolvedColor;
      this.chartInstance.update();
      this.chartInstance.resize();
    } else {
      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => new Date(d.label).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })),
          datasets: [{
            label: 'Revenue',
            data: data.map(d => d.value),
            borderColor: resolvedColor,
            backgroundColor: 'rgba(65, 103, 75, 0.18)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: resolvedColor,
            pointBorderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(context.parsed.y);
                  }
                  const point = this.chartData()[context.dataIndex];
                  if (point && point.count > 0) {
                    label += ` (${point.count} orders)`;
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: getCssVariable('var(--slate)') || '#64748b',
                font: { size: 10 }
              }
            },
            y: {
              beginAtZero: true,
              border: { dash: [4, 4] },
              grid: {
                color: getCssVariable('var(--border)') || '#e2e8f0',
                tickLength: 0
              },
              ticks: {
                color: getCssVariable('var(--slate)') || '#64748b',
                font: { size: 10 },
                maxTicksLimit: 5
              }
            }
          }
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
