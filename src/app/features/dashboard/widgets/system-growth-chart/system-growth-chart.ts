import { Component, ChangeDetectionStrategy, effect, ViewChild, ElementRef, OnDestroy, inject, computed } from '@angular/core';
import { SystemDashboardStore } from '../../../../store/system-dashboard.store';
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
  selector: 'app-system-growth-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: '<div class="chart-container">@if (chartData().length > 0) {<canvas #chartCanvas></canvas>} @else {<div class="empty-state">No data available</div>}</div>',
  styles: [':host { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 200px; } .chart-container { flex: 1; position: relative; width: 100%; height: 100%; padding: 12px; } .empty-state { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--slate); font-size: 14px; }']
})
export class SystemGrowthChart implements OnDestroy {
  private readonly store = inject(SystemDashboardStore);
  
  readonly chartData = computed(() => {
    const tenants = this.store.tenants();
    if (!tenants || tenants.length === 0) return [];
    
    const grouped = new Map<string, number>();
    
    tenants.forEach(t => {
      const d = new Date(t.createdAt);
      const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    const result = Array.from(grouped.entries()).map(([label, count]) => {
      const date = new Date(label + ' 1');
      return { label, count, timestamp: date.getTime() };
    });
    
    result.sort((a, b) => a.timestamp - b.timestamp);
    
    return result.slice(-6).map(r => ({ label: r.label, count: r.count }));
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

    if (!this.canvasEl || data.length === 0) return;
    const ctx = this.canvasEl.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const lineColor = getCssVariable('var(--cobalt)');
    const bgColor = getCssVariable('var(--cobalt-soft)');
    const gridColor = getCssVariable('var(--border)');
    const textColor = getCssVariable('var(--slate)');

    if (this.chartInstance) {
      this.chartInstance.data.labels = data.map(d => d.label);
      this.chartInstance.data.datasets[0].data = data.map(d => d.count);
      this.chartInstance.update();
    } else {
      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.label),
          datasets: [
            {
              label: 'New Tenants',
              data: data.map(d => d.count),
              borderColor: lineColor,
              backgroundColor: bgColor,
              borderWidth: 2,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: lineColor,
              pointRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor }
            },
            y: {
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: { color: textColor, precision: 0 }
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
