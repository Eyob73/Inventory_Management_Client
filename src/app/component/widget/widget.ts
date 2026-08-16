import {
  Component,
  input,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkDragHandle, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { DashboardWidget, WidgetSettings } from '../../models/dashboard';
import { DashboardService } from '../../services/dashboard';

@Component({
  selector: 'app-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgComponentOutlet,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CdkDragHandle,
    CdkDragPlaceholder,
  ],
  templateUrl: './widget.html',
  styleUrl: './widget.scss',
  host: {
    '[class]': "'bg-variant-' + (widget().settings.bgStyle || 'default')",
  },
})
export class Widget {
  private readonly dashSvc = inject(DashboardService);

  readonly widget = input.required<DashboardWidget>();

  remove(): void {
    this.dashSvc.removeWidget(this.widget().id);
  }

  resize(columns: number, rows: number): void {
    this.dashSvc.resizeWidget(this.widget().id, columns, rows);
  }

  setBgStyle(bgStyle: WidgetSettings['bgStyle']): void {
    this.dashSvc.updateWidgetSettings(this.widget().id, { bgStyle });
  }

  refresh(): void {
    this.dashSvc.reloadWidget(this.widget().id);
  }
}
