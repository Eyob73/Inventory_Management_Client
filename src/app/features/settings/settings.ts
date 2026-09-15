import { Component, signal, computed, inject, OnInit } from '@angular/core';
import {  CommonModule } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../store/auth.store';
import { TenantApiService } from '../../services/tenant';
import { LanguageService } from '../../services/language.service';
import {  } from '@jsverse/transloco';

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
    MatProgressSpinnerModule
  , TranslocoDirective],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent implements OnInit {
  private transloco = inject(TranslocoService);
  protected authStore = inject(AuthStore);
  private tenantApi = inject(TenantApiService);
  public languageService = inject(LanguageService);

  readonly userRole = computed(() => this.authStore.userRole());
  readonly normalizedRole = computed(() => (this.userRole() || '').toLowerCase());

  activeSection = signal<string>('');
  saveSuccess = signal<boolean>(false);
  resetSuccess = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  preferredLanguage = 'en';

  // ────────────────────────────────────────────────────────────────
  // Role-Based Sections Configuration
  // ────────────────────────────────────────────────────────────────
  readonly sections = computed<SettingsSection[]>(() => {
    const role = this.normalizedRole();
    const isSales = role === 'sales';
    const commonSection = { 
      id: 'localization', 
      label: isSales ? 'settingsFull.navLanguage' : 'settingsFull.navLanguageCurrency', 
      icon: 'language' 
    };

    if (role === 'sales') {
      return [
        { id: 'pos', label: 'settingsFull.navPosFastCheckout', icon: 'point_of_sale' },
        { id: 'terminal', label: 'settingsFull.navSalesTerminalDisplay', icon: 'desktop_windows' },
        commonSection,
        { id: 'salesAlerts', label: 'settingsFull.navTargetsAlerts', icon: 'track_changes' },
        { id: 'theme', label: 'settingsFull.navDisplayPreferences', icon: 'palette' },
      ];
    }

    if (role === 'manager') {
      return [
        { id: 'inventory', label: 'settingsFull.navStockReorderRules', icon: 'inventory_2' },
        { id: 'salesPolicies', label: 'settingsFull.navSalesDiscountPolicies', icon: 'local_offer' },
        commonSection,
        { id: 'managerNotifications', label: 'settingsFull.navNotificationsDigests', icon: 'notifications' }
      ];
    }

    // Default / Admin
    return [
      { id: 'company', label: 'settingsFull.companyProfile', icon: 'business' },
      { id: 'inventory', label: 'settingsFull.navInventoryAlerts', icon: 'inventory_2' },
      commonSection,
      { id: 'notifications', label: 'settingsFull.navNotifications', icon: 'notifications' },
      { id: 'security', label: 'settingsFull.navSecurity', icon: 'security' },
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
    name: this.authStore.user()?.tenantName || '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
  };

  adminInventory = {
    lowStockThreshold: 0,
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
    this.preferredLanguage = this.languageService.getCurrentLanguage();
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
      const role = this.normalizedRole();

      if (stored) {
        const data = JSON.parse(stored);
        
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
      }
      
      if (role === 'admin') {
        const cachedTenant = localStorage.getItem('inv_tenant_cache');
        if (cachedTenant) {
          try {
            const parsed = JSON.parse(cachedTenant);
            this.company = { ...this.company, ...parsed.company };
            if (parsed.lowStockThreshold !== undefined) {
              this.adminInventory.lowStockThreshold = parsed.lowStockThreshold;
            }
          } catch (e) {}
        }

        this.tenantApi.getMyTenant().subscribe({
          next: (tenant) => {
            if (tenant) {
              this.company = {
                name: tenant.name || this.company.name,
                address: tenant.address || this.company.address,
                phone: tenant.phone || this.company.phone,
                email: tenant.email || this.company.email,
                website: tenant.website || this.company.website,
                taxId: tenant.taxId || this.company.taxId,
              };
              if (tenant.lowStockThreshold !== undefined) {
                this.adminInventory.lowStockThreshold = tenant.lowStockThreshold;
              }
              // Update local cache silently
              const currentStored = localStorage.getItem(this.getStorageKey());
              const p = currentStored ? JSON.parse(currentStored) : {};
              p.company = this.company;
              p.adminInventory = this.adminInventory;
              localStorage.setItem(this.getStorageKey(), JSON.stringify(p));

              // Update the specific tenant cache
              localStorage.setItem('inv_tenant_cache', JSON.stringify({
                company: this.company,
                lowStockThreshold: this.adminInventory.lowStockThreshold
              }));
            }
          },
          error: (err) => {
            console.error('Failed to load tenant profile', err);
          },
        });
      }
    } catch (e) {
      console.warn('Could not parse stored settings', e);
      this.isLoading.set(false);
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

      if (this.languageService.getCurrentLanguage() !== this.preferredLanguage) {
        this.languageService.setLanguage(this.preferredLanguage).subscribe({
          next: () => console.log('Language updated successfully on server'),
          error: (err) => console.error('Failed to update language', err)
        });
      }

      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);

      if (role === 'admin') {
        localStorage.setItem('inv_tenant_cache', JSON.stringify({
          company: this.company,
          lowStockThreshold: this.adminInventory.lowStockThreshold
        }));

        this.tenantApi.updateMyTenant({
          name: this.company.name,
          address: this.company.address,
          phone: this.company.phone,
          email: this.company.email,
          website: this.company.website,
          taxId: this.company.taxId,
          lowStockThreshold: this.adminInventory.lowStockThreshold,
        }).subscribe({
          error: (err) => console.error('Failed to update tenant profile', err)
        });
      }
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
