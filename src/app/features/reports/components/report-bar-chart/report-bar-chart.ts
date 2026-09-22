import { Component, ChangeDetectionStrategy, input, computed, effect, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

export interface BarDataItem {
  name: string;
  value: number;
  secondaryValue?: number;
}

function getCssVariable(name: string): string {
  if (name.startsWith('var(')) {
    const varName = name.match(/var\(([^),]+)/)?.[1];
    if (varName) {
      return getComputedStyle(document.documentElement).getPropertyValue(varName.trim()).trim() || '#3b82f6';
    }
  }
  return name;
}

@Component({
  selector: 'app-report-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './report-bar-chart.html',
  styleUrl: './report-bar-chart.scss',
})
export class ReportBarChart implements OnDestroy {
  data = input<BarDataItem[]>([]);
  horizontal = input<boolean>(false);
  barColor = input<string>('var(--primary, #3b82f6)');
  formatAsCurrency = input<boolean>(true);

  private chartInstance: Chart | null = null;
  private canvasEl?: ElementRef<HTMLCanvasElement>;

  @ViewChild('chartCanvas') set canvas(el: ElementRef<HTMLCanvasElement> | undefined) {
    this.canvasEl = el;
    this.updateChart();
  }

  readonly hasData = computed(() => this.data().length > 0 && this.data().some(d => d.value > 0));

  constructor() {
    effect(() => {
      this.updateChart();
    });
  }

  private updateChart() {
    const data = this.data();
    const horizontal = this.horizontal();
    const barColor = getCssVariable(this.barColor());
    const hasData = this.hasData();

    if (!hasData) {
      this.destroyChart();
      return;
    }

    if (!this.canvasEl) return;
    const ctx = this.canvasEl.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.data.labels = data.map(d => d.name);
      this.chartInstance.data.datasets[0].data = data.map(d => d.value);
      this.chartInstance.data.datasets[0].backgroundColor = barColor;
      if (this.chartInstance.options.indexAxis !== (horizontal ? 'y' : 'x')) {
          this.chartInstance.options.indexAxis = horizontal ? 'y' : 'x';
      }
      this.chartInstance.update();
    } else {
      this.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.name),
          datasets: [{
            label: 'Value',
            data: data.map(d => d.value),
            backgroundColor: barColor,
          }]
        },
        options: {
          indexAxis: horizontal ? 'y' : 'x',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          }
        }
      });
    }
  }

  private destroyChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  ngOnDestroy() {
    this.destroyChart();
  }
}
