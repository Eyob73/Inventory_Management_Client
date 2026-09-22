import { Component, ChangeDetectionStrategy, input, computed, effect, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartPoint } from '../../../../models/reports.model';
import Chart from 'chart.js/auto';

function getCssVariable(name: string): string {
  if (name.startsWith('var(')) {
    const varName = name.match(/var\(([^)]+)\)/)?.[1];
    if (varName) {
      return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#14b8a6';
    }
  }
  return name;
}

@Component({
  selector: 'app-report-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './report-line-chart.html',
  styleUrl: './report-line-chart.scss',
})
export class ReportLineChart implements OnDestroy {
  data = input<ChartPoint[]>([]);
  color = input<string>('var(--teal)');
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
    const hasData = this.hasData();
    const resolvedColor = getCssVariable(this.color());

    if (!hasData) {
      this.destroyChart();
      return;
    }

    if (!this.canvasEl) return;
    const ctx = this.canvasEl.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.data.labels = data.map(d => d.label);
      this.chartInstance.data.datasets[0].data = data.map(d => d.value);
      this.chartInstance.data.datasets[0].borderColor = resolvedColor;
      this.chartInstance.data.datasets[0].backgroundColor = resolvedColor + '40'; // add transparency
      this.chartInstance.update();
    } else {
      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.label),
          datasets: [{
            label: 'Value',
            data: data.map(d => d.value),
            borderColor: resolvedColor,
            backgroundColor: resolvedColor + '40',
            fill: true,
            tension: 0.3, // smooth lines
            pointRadius: 4,
            pointHoverRadius: 6,
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
                    label += new Intl.NumberFormat().format(context.parsed.y);
                  }
                  // We could add the count here if we wanted to
                  const point = data[context.dataIndex];
                  if (point && point.count > 0) {
                     label += ` (${point.count} transactions)`;
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false }
            },
            y: {
              beginAtZero: true,
              border: { dash: [4, 4] },
              grid: {
                color: '#e2e8f0', // grid line color
                tickLength: 0
              }
            }
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
