import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

interface SettingsSection {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  activeSection = signal('company');
  saveSuccess = signal(false);

  readonly sections: SettingsSection[] = [
    { id: 'company', label: 'Company Profile', icon: 'business' },
    { id: 'inventory', label: 'Inventory Alerts', icon: 'inventory_2' },
    { id: 'currency', label: 'Currency & Locale', icon: 'payments' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'security', label: 'Security', icon: 'security' },
  ];

  // ── Company ──────────────────────────────────────────────────────
  company = {
    name: 'My Company',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
  };

  // ── Inventory ────────────────────────────────────────────────────
  inventory = {
    lowStockThreshold: 15,
    criticalStockThreshold: 5,
    autoReorderEnabled: false,
    defaultReorderQty: 50,
  };

  // ── Currency ─────────────────────────────────────────────────────
  currency = {
    code: 'ETB',
    symbol: 'Br',
    locale: 'am-ET',
    decimalPlaces: 2,
  };

  // ── Notifications ────────────────────────────────────────────────
  notifications = {
    lowStockAlerts: true,
    saleCompletedAlerts: true,
    userLoginAlerts: false,
    weeklyReportEmail: true,
  };

  // ── Security ─────────────────────────────────────────────────────
  security = {
    sessionTimeout: 60,
    requirePasswordChange: false,
    twoFactorEnabled: false,
  };

  setSection(id: string) {
    this.activeSection.set(id);
  }

  saveSettings() {
    // In a real implementation, call the API
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }
}
