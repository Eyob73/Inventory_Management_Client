import { Injectable, signal, effect, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

/** Keep in sync with the inline script in index.html */
export const THEME_STORAGE_KEY = 'inv-mgmt-theme-dark';

function readStoredDarkPreference(): boolean {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
  } catch {
    // localStorage may be unavailable
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyDarkClass(dark: boolean): void {
  document.documentElement.classList.toggle('dark-theme', dark);
  document.body?.classList.toggle('dark-theme', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  /** Seed from storage immediately so we never overwrite dark → light on boot */
  private isDarkSignal = signal<boolean>(readStoredDarkPreference());

  /** Readonly signal — use in templates with isDark() */
  isDark = this.isDarkSignal.asReadonly();

  /** Observable that emits true when on a mobile/tablet-portrait viewport */
  isMobile$: Observable<boolean> = this.breakpointObserver
    .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
    .pipe(
      map((result) => result.matches),
      shareReplay(1)
    );

  constructor() {
    applyDarkClass(this.isDarkSignal());

    effect(() => {
      const dark = this.isDarkSignal();
      applyDarkClass(dark);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, String(dark));
      } catch {
        // ignore quota / private mode errors
      }
    });
  }

  /** Safe to call anytime — re-syncs from storage (idempotent) */
  initializeTheme(): void {
    const dark = readStoredDarkPreference();
    this.isDarkSignal.set(dark);
    applyDarkClass(dark);
  }

  toggleTheme(): void {
    this.isDarkSignal.update((v) => !v);
  }
}
