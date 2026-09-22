import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { LanguageService } from '../../../services/language.service';
import { TranslocoDirective } from '@jsverse/transloco';

export interface SystemSettingsSection {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    TranslocoDirective
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class SystemSettingsComponent implements OnInit {
  private languageService = inject(LanguageService);

  activeSection = signal<string>('general');
  saveSuccess = signal<boolean>(false);

  preferredLanguage = 'en';

  readonly sections = computed<SystemSettingsSection[]>(() => [
    { id: 'general', label: 'General Configuration', icon: 'settings' },
    { id: 'localization', label: 'Language', icon: 'language' },
    { id: 'limits', label: 'Company Limits', icon: 'corporate_fare' },
    { id: 'security', label: 'Security & Compliance', icon: 'security' }
  ]);

  generalSettings = {
    platformName: 'Acme Inventory System',
    supportEmail: 'support@acme.com',
    maintenanceMode: false,
    allowSelfRegistration: true
  };

  limitSettings = {
    maxUsersPerCompany: 50,
    maxProductsPerCompany: 10000
  };

  securitySettings = {
    requireComplexPasswords: true,
    forceMfa: false,
    sessionTimeoutMinutes: 60
  };

  ngOnInit(): void {
    this.preferredLanguage = this.languageService.getCurrentLanguage();
    this.loadSettings();
  }

  setSection(id: string): void {
    this.activeSection.set(id);
  }

  private getStorageKey(): string {
    return 'inv_global_system_settings';
  }

  loadSettings(): void {
    const globalLang = localStorage.getItem('inv_user_language');
    if (globalLang) {
      this.preferredLanguage = globalLang;
    }

    const stored = localStorage.getItem(this.getStorageKey());
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.generalSettings) this.generalSettings = { ...this.generalSettings, ...data.generalSettings };
        if (data.limitSettings) this.limitSettings = { ...this.limitSettings, ...data.limitSettings };
        if (data.securitySettings) this.securitySettings = { ...this.securitySettings, ...data.securitySettings };
      } catch (e) {
        console.error('Failed to parse system settings', e);
      }
    }
  }

  saveSettings(): void {
    const payload = {
      generalSettings: this.generalSettings,
      limitSettings: this.limitSettings,
      securitySettings: this.securitySettings
    };
    
    localStorage.setItem(this.getStorageKey(), JSON.stringify(payload));
    
    if (this.languageService.getCurrentLanguage() !== this.preferredLanguage) {
      this.languageService.setLanguage(this.preferredLanguage).subscribe({
        next: () => console.log('Language updated successfully on server'),
        error: (err) => console.error('Failed to update language', err)
      });
    }

    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }

  resetDefaults(): void {
    localStorage.removeItem(this.getStorageKey());
    this.generalSettings = {
      platformName: 'Acme Inventory System',
      supportEmail: 'support@acme.com',
      maintenanceMode: false,
      allowSelfRegistration: true
    };
    this.limitSettings = {
      maxUsersPerCompany: 50,
      maxProductsPerCompany: 10000
    };
    this.securitySettings = {
      requireComplexPasswords: true,
      forceMfa: false,
      sessionTimeoutMinutes: 60
    };
    
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }
}
