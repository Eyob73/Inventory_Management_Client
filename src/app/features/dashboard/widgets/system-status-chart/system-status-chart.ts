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
  selector: 'app-system-status-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: '<div class="chart-container">@if (chartData().length > 0) {<canvas #chartCanvas></canvas>} @else {<div class="empty-state">No data available</div>}</div>',
  styles: [':host { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 200px; } .chart-container { flex: 1; position: relative; width: 100%; height: 100%; padding: 12px; } .empty-state { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--slate); font-size: 14px; }']
})
export class SystemStatusChart implements OnDestroy {
  private readonly store = inject(SystemDashboardStore);
  
  readonly chartData = computed(() => {
    const data = this.store.data();
    if (!data) return [];
    return [
      { label: 'Active', value: data.activeCompanies, color: getCssVariable('var(--moss)') },
      { label: 'Suspended', value: data.suspendedCompanies, color: getCssVariable('var(--amber)') },
      { label: 'Deactivated', value: data.totalCompanies - (data.activeCompanies + data.suspendedCompanies), color: getCssVariable('var(--rose)') }
    ].filter(d => d.value > 0);
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
    
    if (this.chartInstance) {
      this.chartInstance.data.labels = data.map(d => d.label);
      this.chartInstance.data.datasets[0].data = data.map(d => d.value);
      this.chartInstance.data.datasets[0].backgroundColor = data.map(d => d.color);
      this.chartInstance.update();
    } else {
      this.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.label),
          datasets: [
            {
              data: data.map(d => d.value),
              backgroundColor: data.map(d => d.color),
              borderWidth: 0,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: getCssVariable('var(--slate)'),
                padding: 20,
                usePointStyle: true,
                font: { family: 'Inter', size: 12 }
              }
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
