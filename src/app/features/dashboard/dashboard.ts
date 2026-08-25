import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Widget } from '../../component/widget/widget';
import { WidgetPanel } from './widget-panel/widget-panel';
import { DashboardService } from '../../services/dashboard';
import { DashboardWidget } from '../../models/dashboard';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
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
  private readonly authStore = inject(AuthStore);

  readonly activeWidgets = this.dashSvc.activeWidgets;

  readonly userRole = computed(() => this.authStore.userRole());
  readonly isSales = computed(() => this.authStore.userRole()?.toLowerCase() === 'sales');
  readonly isAdmin = computed(() => this.authStore.userRole()?.toLowerCase() === 'admin');
  readonly userName = computed(() => {
    const u = this.authStore.user();
    return u?.firstName || u?.userName || 'there';
  });

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


