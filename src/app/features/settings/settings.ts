import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthStore } from '../../store/auth.store';

export interface SettingsSection {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent implements OnInit {
  protected authStore = inject(AuthStore);

  readonly userRole = computed(() => this.authStore.userRole());
  readonly normalizedRole = computed(() => (this.userRole() || '').toLowerCase());

  activeSection = signal<string>('');
  saveSuccess = signal<boolean>(false);
  resetSuccess = signal<boolean>(false);

  // ────────────────────────────────────────────────────────────────
  // Role-Based Sections Configuration
  // ────────────────────────────────────────────────────────────────
  readonly sections = computed<SettingsSection[]>(() => {
    const role = this.normalizedRole();

    if (role === 'sales') {
      return [
        { id: 'pos', label: 'POS & Fast Checkout', icon: 'point_of_sale' },
        { id: 'terminal', label: 'Sales Terminal Display', icon: 'desktop_windows' },
        { id: 'salesAlerts', label: 'Targets & Alerts', icon: 'track_changes' },
        { id: 'theme', label: 'Display & Preferences', icon: 'palette' },
      ];
    }

    if (role === 'manager') {
      return [
        { id: 'inventory', label: 'Stock & Reorder Rules', icon: 'inventory_2' },
        { id: 'salesPolicies', label: 'Sales & Discount Policies', icon: 'local_offer' },
        { id: 'managerNotifications', label: 'Notifications & Digests', icon: 'notifications' },
        { id: 'regionalView', label: 'Display & Region', icon: 'display_settings' },
      ];
    }

    // Default / Admin
    return [
      { id: 'company', label: 'Company Profile', icon: 'business' },
      { id: 'inventory', label: 'Inventory Alerts', icon: 'inventory_2' },
      { id: 'currency', label: 'Currency & Language', icon: 'payments' },
      { id: 'notifications', label: 'Notifications', icon: 'notifications' },
      { id: 'security', label: 'Security', icon: 'security' },
    ];
  });

  // ────────────────────────────────────────────────────────────────
  // Settings States
  // ────────────────────────────────────────────────────────────────

  // --- Sales Role Settings ---
  salesPos = {
    defaultPaymentMethod: 'Cash',
    autoPrintReceipt: true,
    printCustomerCopy: false,
    quickQtyStep: 1,
    defaultCustomerGroup: 'Retail',
  };

  salesTerminal = {
    layoutMode: 'grid',
    showProductImages: true,
    barcodeSound: true,
    showQuickShortcuts: true,
  };

  salesAlerts = {
    dailyTargetAlert: true,
    lowStockScanWarning: true,
    saleSuccessSound: true,
    personalTargetGoal: 50000,
  };

  salesTheme = {
    colorMode: 'system',
    fontSize: 'normal',
    language: 'en-US',
  };

  // --- Manager Role Settings ---
  managerInventory = {
    lowStockThreshold: 15,
    criticalStockThreshold: 5,
    autoReorderEnabled: true,
    defaultReorderQty: 50,
    fastMovingMultiplier: 1.5,
  };

  managerPolicies = {
    allowCustomDiscounts: true,
    maxDiscountPercent: 10,
    requireApprovalForReturn: true,
    defaultTaxRate: 15,
    defaultPaymentTerms: 'Instant',
  };

  managerNotifications = {
    dailyDigestEmail: true,
    highValueAlertThreshold: 25000,
    purchaseOrderAlerts: true,
    supplierDelayWarnings: true,
  };

  managerRegional = {
    currencySymbol: 'Br',
    currencyCode: 'ETB',
    decimalPlaces: 2,
    tableDensity: 'comfortable',
    language: 'en-US',
  };

  // --- Admin / General Settings ---
  company = {
    name: 'Inventory Pro Platform',
    address: 'Bole Road, Addis Ababa, Ethiopia',
    phone: '+251 911 234 567',
    email: 'contact@inventorypro.com',
    website: 'https://inventorypro.com',
    taxId: '100234987',
  };

  adminInventory = {
    lowStockThreshold: 15,
    criticalStockThreshold: 5,
    autoReorderEnabled: false,
    defaultReorderQty: 50,
  };

  adminCurrency = {
    code: 'ETB',
    symbol: 'Br',
    language: 'am-ET',
    decimalPlaces: 2,
  };

  adminNotifications = {
    lowStockAlerts: true,
    saleCompletedAlerts: true,
    userLoginAlerts: false,
    weeklyReportEmail: true,
  };

  adminSecurity = {
    sessionTimeout: 60,
    requirePasswordChange: false,
    twoFactorEnabled: false,
  };

  ngOnInit() {
    // Set initial active section
    const currentSections = this.sections();
    if (currentSections.length > 0) {
      this.activeSection.set(currentSections[0].id);
    }

    this.loadRoleSettings();
  }

  setSection(id: string) {
    this.activeSection.set(id);
  }

  // ────────────────────────────────────────────────────────────────
  // LocalStorage Persistence & Methods
  // ────────────────────────────────────────────────────────────────
  private getStorageKey(): string {
    return `inv_settings_${this.normalizedRole() || 'default'}`;
  }

  loadRoleSettings() {
    try {
      const globalLang = localStorage.getItem('inv_user_language');
      if (globalLang) {
        this.salesTheme.language = globalLang;
        this.managerRegional.language = globalLang;
        this.adminCurrency.language = globalLang;
      }

      const stored = localStorage.getItem(this.getStorageKey());
      if (!stored) return;

      const data = JSON.parse(stored);
      const role = this.normalizedRole();

      if (role === 'sales') {
        if (data.salesPos) this.salesPos = { ...this.salesPos, ...data.salesPos };
        if (data.salesTerminal) this.salesTerminal = { ...this.salesTerminal, ...data.salesTerminal };
        if (data.salesAlerts) this.salesAlerts = { ...this.salesAlerts, ...data.salesAlerts };
        if (data.salesTheme) this.salesTheme = { ...this.salesTheme, ...data.salesTheme };
      } else if (role === 'manager') {
        if (data.managerInventory) this.managerInventory = { ...this.managerInventory, ...data.managerInventory };
        if (data.managerPolicies) this.managerPolicies = { ...this.managerPolicies, ...data.managerPolicies };
        if (data.managerNotifications) this.managerNotifications = { ...this.managerNotifications, ...data.managerNotifications };
        if (data.managerRegional) this.managerRegional = { ...this.managerRegional, ...data.managerRegional };
      } else {
        if (data.company) this.company = { ...this.company, ...data.company };
        if (data.adminInventory) this.adminInventory = { ...this.adminInventory, ...data.adminInventory };
        if (data.adminCurrency) this.adminCurrency = { ...this.adminCurrency, ...data.adminCurrency };
        if (data.adminNotifications) this.adminNotifications = { ...this.adminNotifications, ...data.adminNotifications };
        if (data.adminSecurity) this.adminSecurity = { ...this.adminSecurity, ...data.adminSecurity };
      }
    } catch (e) {
      console.warn('Could not parse stored settings', e);
    }
  }

  saveSettings() {
    try {
      const role = this.normalizedRole();
      let payload = {};

      if (role === 'sales') {
        payload = {
          salesPos: this.salesPos,
          salesTerminal: this.salesTerminal,
          salesAlerts: this.salesAlerts,
          salesTheme: this.salesTheme,
        };
      } else if (role === 'manager') {
        payload = {
          managerInventory: this.managerInventory,
          managerPolicies: this.managerPolicies,
          managerNotifications: this.managerNotifications,
          managerRegional: this.managerRegional,
        };
      } else {
        payload = {
          company: this.company,
          adminInventory: this.adminInventory,
          adminCurrency: this.adminCurrency,
          adminNotifications: this.adminNotifications,
          adminSecurity: this.adminSecurity,
        };
      }

      localStorage.setItem(this.getStorageKey(), JSON.stringify(payload));

      // Synchronize active user language globally
      let selectedLang = 'en-US';
      if (role === 'sales') selectedLang = this.salesTheme.language;
      else if (role === 'manager') selectedLang = this.managerRegional.language;
      else selectedLang = this.adminCurrency.language;

      localStorage.setItem('inv_user_language', selectedLang);

      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  resetDefaults() {
    const role = this.normalizedRole();
    localStorage.removeItem(this.getStorageKey());

    if (role === 'sales') {
      this.salesPos = {
        defaultPaymentMethod: 'Cash',
        autoPrintReceipt: true,
        printCustomerCopy: false,
        quickQtyStep: 1,
        defaultCustomerGroup: 'Retail',
      };
      this.salesTerminal = {
        layoutMode: 'grid',
        showProductImages: true,
        barcodeSound: true,
        showQuickShortcuts: true,
      };
      this.salesAlerts = {
        dailyTargetAlert: true,
        lowStockScanWarning: true,
        saleSuccessSound: true,
        personalTargetGoal: 50000,
      };
      this.salesTheme = {
        colorMode: 'system',
        fontSize: 'normal',
        language: 'en-US',
      };
    } else if (role === 'manager') {
      this.managerInventory = {
        lowStockThreshold: 15,
        criticalStockThreshold: 5,
        autoReorderEnabled: true,
        defaultReorderQty: 50,
        fastMovingMultiplier: 1.5,
      };
      this.managerPolicies = {
        allowCustomDiscounts: true,
        maxDiscountPercent: 10,
        requireApprovalForReturn: true,
        defaultTaxRate: 15,
        defaultPaymentTerms: 'Instant',
      };
      this.managerNotifications = {
        dailyDigestEmail: true,
        highValueAlertThreshold: 25000,
        purchaseOrderAlerts: true,
        supplierDelayWarnings: true,
      };
      this.managerRegional = {
        currencySymbol: 'Br',
        currencyCode: 'ETB',
        decimalPlaces: 2,
        tableDensity: 'comfortable',
        language: 'en-US',
      };
    }

    this.resetSuccess.set(true);
    setTimeout(() => this.resetSuccess.set(false), 3000);
  }
}
