import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Widget } from '../../component/widget/widget';
import { WidgetPanel } from './widget-panel/widget-panel';
import { DashboardService } from '../../services/dashboard';
import { DashboardWidget } from '../../models/dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    DragDropModule,
    Widget,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  readonly dashSvc = inject(DashboardService);
  private readonly dialog = inject(MatDialog);

  readonly activeWidgets = this.dashSvc.activeWidgets;

  openPanel(): void {
    this.dialog.open(WidgetPanel, {
      panelClass: 'widget-panel-dialog',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: false,
    });
  }

  onWidgetDrop(event: CdkDragDrop<DashboardWidget, DashboardWidget, DashboardWidget>): void {
    const draggedWidget = event.item.data;
    const targetWidget = event.container.data;

    if (!draggedWidget || !targetWidget || draggedWidget.id === targetWidget.id) {
      return;
    }

    const activeList = [...this.activeWidgets()];
    const fromIndex = activeList.findIndex((w) => w.id === draggedWidget.id);
    const toIndex = activeList.findIndex((w) => w.id === targetWidget.id);

    if (fromIndex !== -1 && toIndex !== -1) {
      moveItemInArray(activeList, fromIndex, toIndex);
      this.dashSvc.reorderWidgets(activeList.map((w) => w.id));
    }
  }

  resetLayout(): void {
    this.dashSvc.resetDashboard();
  }
}
