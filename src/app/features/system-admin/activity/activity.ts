import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-system-activity',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">System Activity</h1>
      <p class="page-subtitle">View global system events and audit logs.</p>
    </div>
    <div class="empty-state" style="text-align: center; padding: 64px;">
      <h3 style="font-size: 18px; font-weight: 500;">Activity Logging Not Yet Implemented</h3>
      <p style="color: #64748b;">This feature is planned for a future update.</p>
    </div>
  `
})
export class SystemActivityComponent {}
