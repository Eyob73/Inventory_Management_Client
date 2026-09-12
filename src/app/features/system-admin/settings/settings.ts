import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">System Settings</h1>
      <p class="page-subtitle">Manage global system configuration.</p>
    </div>
    <div class="empty-state" style="text-align: center; padding: 64px;">
      <h3 style="font-size: 18px; font-weight: 500;">Settings Not Yet Implemented</h3>
      <p style="color: #64748b;">Global system configuration is coming soon.</p>
    </div>
  `
})
export class SystemSettingsComponent {}
