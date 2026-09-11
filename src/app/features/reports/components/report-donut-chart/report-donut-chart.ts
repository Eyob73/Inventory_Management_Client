import { Component, ChangeDetectionStrategy, input, computed, effect, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NamedAmount } from '../../../../models/reports.model';
import Chart from 'chart.js/auto';

const PALETTE = [
  '#3b82f6', // cobalt
  '#10b981', // moss
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#64748b', // slate
  '#93c5fd', // cobalt-soft
  '#6ee7b7', // moss-soft
];

@Component({
  selector: 'app-report-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './report-donut-chart.html',
  styleUrl: './report-donut-chart.scss',
})
export class ReportDonutChart implements OnDestroy {
  data = input<NamedAmount[]>([]);
  formatAsCurrency = input<boolean>(true);

  private chartInstance: Chart | null = null;
  private canvasEl?: ElementRef<HTMLCanvasElement>;

  @ViewChild('chartCanvas') set canvas(el: ElementRef<HTMLCanvasElement> | undefined) {
    this.canvasEl = el;
    this.updateChart();
  }

  readonly hasData = computed(
    () => this.data().length > 0 && this.data().some((d) => d.amount > 0),
  );

  constructor() {
    effect(() => {
      this.updateChart();
    });
  }

  private updateChart() {
    const data = this.data();
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
      this.chartInstance.data.datasets[0].data = data.map(d => d.amount);
      this.chartInstance.update();
    } else {
      this.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.name),
          datasets: [{
            data: data.map(d => d.amount),
            backgroundColor: PALETTE,
            borderWidth: 1,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { 
              position: 'right',
              labels: {
                usePointStyle: true,
                boxWidth: 8
              }
            },
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
