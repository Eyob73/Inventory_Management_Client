import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogRef } from '@angular/material/dialog';
import { DashboardService } from '../../../services/dashboard';
import { DashboardWidget } from '../../../models/dashboard';

@Component({
  selector: 'app-widget-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatSlideToggleModule],
  templateUrl: './widget-panel.html',
  styleUrl: './widget-panel.scss',
})
export class WidgetPanel {
  readonly dashSvc = inject(DashboardService);
  private readonly dialogRef = inject(MatDialogRef<WidgetPanel>);

  readonly selectedCategory = signal<string>('all');
  readonly confirmingReset = signal<boolean>(false);

  readonly allWidgets = this.dashSvc.allWidgets;

  readonly filteredWidgets = computed<DashboardWidget[]>(() => {
    const cat = this.selectedCategory();
    const list = this.allWidgets();
    if (cat === 'all') return list;
    return list.filter((w) => w.category === cat);
  });

  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  toggle(id: string, currentlyVisible: boolean): void {
    if (currentlyVisible) {
      this.dashSvc.removeWidget(id);
    } else {
      this.dashSvc.addWidget(id);
    }
  }

  askReset(): void {
    this.confirmingReset.set(true);
  }

  cancelReset(): void {
    this.confirmingReset.set(false);
  }

  doReset(): void {
    this.dashSvc.resetDashboard();
    this.confirmingReset.set(false);
  }

  close(): void {
    this.confirmingReset.set(false);
    this.dialogRef.close();
  }
}
