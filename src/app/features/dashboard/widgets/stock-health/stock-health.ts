import { Component, ChangeDetectionStrategy, effect, ViewChild, ElementRef, OnDestroy, inject, computed } from '@angular/core';
import { DashboardStore } from '../../../../store/dashboard.store';
import Chart from 'chart.js/auto';

function getCssVariable(name: string): string {
  if (name.startsWith('var(')) {
    const varName = name.match(/var\(([^)]+)\)/)?.[1];
    if (varName) {
      return getComputedStyle(document.documentElement).getPropertyValue(varName.trim()).trim() || '#3b82f6';
    }
  }
  return name;
}

@Component({
  selector: 'app-stock-health',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './stock-health.html',
  styleUrl: './stock-health.scss',
})
export class StockHealth implements OnDestroy {
  private readonly store = inject(DashboardStore);
  
  readonly chartData = computed(() => {
    const data = this.store.data();
    if (!data) return [];
    return data.salesByCategory;
  });

  private chartInstance: Chart | null = null;
  private canvasEl?: ElementRef<HTMLCanvasElement>;

  @ViewChild('chartCanvas') set canvas(el: ElementRef<HTMLCanvasElement> | undefined) {
    this.canvasEl = el;
    this.updateChart();
  }

  constructor() {
    effect(() => {
      this.updateChart();
    });
  }

  private updateChart() {
    const data = this.chartData();

    if (!this.canvasEl) return;
    const ctx = this.canvasEl.nativeElement.getContext('2d');
    if (!ctx) return;
    const amounts = data.map(d => d.amount);
    const normalColor = getCssVariable('var(--moss)');
    const gridColor = getCssVariable('var(--border)');
    const textColor = getCssVariable('var(--slate)');

    if (this.chartInstance) {
      this.chartInstance.data.labels = data.map(d => d.name);
      this.chartInstance.data.datasets[0].data = amounts;
      this.chartInstance.update();
    } else {
      this.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.name),
          datasets: [
            {
              label: 'Sales Revenue',
              data: amounts,
              backgroundColor: normalColor,
              barThickness: 20,
              borderRadius: 4,
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const idx = context.dataIndex;
                  const cat = this.chartData()[idx];
                  if (!cat) return '';
                  return `Sales: ${new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(cat.amount)} (${cat.quantity} items)`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor }
            },
            y: {
              grid: { display: false },
              ticks: { color: textColor }
            }
          }
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
