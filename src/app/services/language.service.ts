import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../environments/environment';
import { User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private transloco = inject(TranslocoService);
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Users/me/preferences`;

  initLanguage(user: User | null) {
    const savedLang = localStorage.getItem('inventory-language');
    let langToUse = 'en';
    
    if (savedLang) {
      langToUse = savedLang;
    } else if (user && user.preferredLanguage) {
      langToUse = user.preferredLanguage;
    }
    
    if (this.getSupportedLanguages().includes(langToUse)) {
      this.setLocalLanguage(langToUse);
    } else {
      this.setLocalLanguage('en');
    }
  }

  setLocalLanguage(lang: string) {
    this.transloco.setActiveLang(lang);
    localStorage.setItem('inventory-language', lang);
  }

  setLanguage(lang: string) {
    this.setLocalLanguage(lang);
    return this.http.put(this.baseUrl, { preferredLanguage: lang }, { withCredentials: true });
  }

  getCurrentLanguage(): string {
    return this.transloco.getActiveLang();
  }

  getSupportedLanguages(): string[] {
    return (this.transloco.getAvailableLangs() as string[]);
  }
}
