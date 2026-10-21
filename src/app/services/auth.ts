import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap } from 'rxjs';
import { LoginCredentials, RegisterCredentials, User, AuthResponse } from '../models/auth.model';
import { environment } from '../../environments/environment';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private languageService = inject(LanguageService);
  private baseUrl = `${environment.apiUrl}/Auth`;
  currentUser = signal<User | null>(null);

  hasRole(role: string): boolean {
    const user = this.currentUser();
    if (!user) return false;

    const userRoles: string[] = [];
    if (user.roles) {
      if (Array.isArray(user.roles)) userRoles.push(...user.roles);
      else userRoles.push(user.roles);
    }

    const normalized = userRoles.map((r) => String(r).toLowerCase());
    const target = role.toLowerCase();

    if (normalized.includes('admin') || normalized.includes('administrator')) {
      return true;
    }

    return normalized.includes(target);
  }

  private refreshTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'accessToken') {
          if (event.newValue) {
            this.scheduleTokenRefresh(event.newValue);
            this.getCurrentUser().subscribe();
          } else {
            this.currentUser.set(null);
            this.cancelTokenRefresh();
          }
        }
      });
    }
  }

  setTokens(accessToken: string, refreshToken?: string) {
    this.setToken(accessToken);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
    this.scheduleTokenRefresh(accessToken);
  }

  setToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  setRefreshToken(refreshToken: string) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  removeTokens() {
    this.cancelTokenRefresh();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  removeToken() {
    this.removeTokens();
  }

  isTokenExpired(token?: string | null, bufferSeconds = 30): boolean {
    const t = token ?? this.getToken();
    if (!t) return true;
    const decoded = this.decodeToken(t);
    if (!decoded || !decoded.exp) return true;
    const expiresAtMs = decoded.exp * 1000;
    return Date.now() >= (expiresAtMs - (bufferSeconds * 1000));
  }

  scheduleTokenRefresh(token?: string | null): void {
    this.cancelTokenRefresh();
    const t = token ?? this.getToken();
    if (!t || typeof window === 'undefined') return;

    const decoded = this.decodeToken(t);
    if (!decoded || !decoded.exp) return;

    const expiresAtMs = decoded.exp * 1000;
    const now = Date.now();
    // Proactively refresh 2 minutes before access token expiry
    const refreshBufferMs = 2 * 60 * 1000;
    let delayMs = expiresAtMs - now - refreshBufferMs;

    // If already within buffer or expired, schedule shortly
    if (delayMs <= 0) {
      delayMs = 5000;
    }

    this.refreshTimer = setTimeout(() => {
      this.refresh().subscribe({
        error: (err) => {
          // If refresh fails due to temporary network error, retry after 15 seconds
          if (err?.status === 0 || (err?.status >= 500 && err?.status <= 504)) {
            this.refreshTimer = setTimeout(() => this.scheduleTokenRefresh(), 15000);
          }
        }
      });
    }, delayMs);
  }

  cancelTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials, {
      withCredentials: true,
    }).pipe(
      tap(res => {
        const token = res.accessToken || res.token;
        if (token) {
          this.setTokens(token, res.refreshToken);
        }
      })
    );
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, credentials, {
      withCredentials: true,
    });
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, { refreshToken: refreshToken || null }, {
      withCredentials: true,
    }).pipe(
      tap(res => {
        const token = res.accessToken || res.token;
        if (token) {
          this.setTokens(token, res.refreshToken);
          this.getCurrentUser().subscribe(); // Re-decode and set current user
        }
      })
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<void>(`${this.baseUrl}/logout`, { refreshToken: refreshToken || null }, { withCredentials: true }).pipe(
      tap(() => {
        this.removeTokens();
        this.currentUser.set(null);
      }),
      catchError(() => {
        this.removeTokens();
        this.currentUser.set(null);
        return of(undefined);
      }),
    );
  }

  getCurrentUser(): Observable<User | null> {
    const token = this.getToken();
    if (!token) {
      this.currentUser.set(null);
      return of(null);
    }

    const decoded = this.decodeToken(token);
    if (!decoded) {
      this.currentUser.set(null);
      return of(null);
    }

    const user: User = {
      id: decoded.nameid || decoded.sub || decoded.id || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '',
      email: decoded.email || decoded.unique_name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '',
      userName: decoded.unique_name || decoded.userName || decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
      roles: decoded.role || decoded.roles || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || [],
      firstName: decoded.given_name || decoded.firstName || decoded.FirstName || decoded.firstname || '',
      lastName: decoded.family_name || decoded.lastName || decoded.LastName || decoded.lastname || '',
      tenantId: decoded.TenantId || decoded.tenantId || '',
      tenantName: decoded.TenantName || decoded.tenantName || '',
      preferredLanguage: decoded.PreferredLanguage || decoded.preferredLanguage
    };

    // Ensure roles is always an array for consistency
    if (typeof user.roles === 'string') {
      user.roles = [user.roles];
    }

    this.currentUser.set(user);
    this.languageService.initLanguage(user);
    if (!this.isTokenExpired(token) && !this.refreshTimer) {
      this.scheduleTokenRefresh(token);
    }
    return of(user);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/change-password`,
      { currentPassword, newPassword },
      { withCredentials: true }
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/forgot-password`,
      { email },
      { withCredentials: true }
    );
  }

  resetPassword(payload: any): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/reset-password`,
      payload,
      { withCredentials: true }
    );
  }
}
