import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-skeleton.html',
  styleUrl: './card-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSkeleton {
  /** 
   * The type of skeleton to render:
   * 'kpi' - A summary stat card (value + delta)
   * 'chart' - A chart widget
   * 'kpi-body' - Only the body of a KPI card (no card wrapper/header)
   * 'chart-body' - Only the body of a chart (no card wrapper/header)
   */
  type = input<'kpi' | 'chart' | 'kpi-body' | 'chart-body'>('kpi');
}
