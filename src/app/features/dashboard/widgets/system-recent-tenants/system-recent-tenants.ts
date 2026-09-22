import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemDashboardStore } from '../../../../store/system-dashboard.store';

@Component({
  selector: 'app-system-recent-tenants',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: '<div class="list-container">@if (tenants().length > 0) {<div class="tenant-item" *ngFor="let t of tenants()"><div class="t-info"><span class="t-name">{{ t.name }}</span><span class="t-code">{{ t.code }}</span></div><div class="t-meta"><span class="status-badge" [ngClass]="getStatusClass(t.status)">{{ getStatusText(t.status) }}</span><span class="t-date">{{ t.createdAt | date:\'shortDate\' }}</span></div></div>} @else {<div class="empty-state">No tenants found</div>}</div>',
  styles: [':host { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 200px; overflow-y: auto; } .list-container { display: flex; flex-direction: column; padding: 12px; gap: 12px; } .empty-state { padding: 20px; text-align: center; color: var(--slate); font-size: 14px; } .tenant-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border); } .tenant-item:last-child { border-bottom: none; padding-bottom: 0; } .t-info { display: flex; flex-direction: column; gap: 4px; } .t-name { font-weight: 600; color: var(--ink); font-size: 14px; } .t-code { font-size: 12px; color: var(--slate); font-family: \'JetBrains Mono\', monospace; } .t-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; } .t-date { font-size: 11px; color: var(--slate); } .status-badge { display: inline-flex; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; } .status-active { background: var(--moss-soft); color: var(--moss); } .status-suspended { background: rgba(245, 158, 11, 0.12); color: #f59e0b; } .status-deactivated { background: var(--rose-soft); color: var(--error); }']
})
export class SystemRecentTenants {
  private readonly store = inject(SystemDashboardStore);
  
  readonly tenants = computed(() => {
    const list = [...this.store.tenants()];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  });

  getStatusClass(status: number): string {
    switch(status) {
      case 0: return 'status-active';
      case 1: return 'status-suspended';
      case 2: return 'status-deactivated';
      default: return '';
    }
  }

  getStatusText(status: number): string {
    switch(status) {
      case 0: return 'Active';
      case 1: return 'Suspended';
      case 2: return 'Deactivated';
      default: return 'Unknown';
    }
  }
}
