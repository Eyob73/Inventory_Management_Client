import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { LoginCredentials, RegisterCredentials, User, AuthResponse } from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
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

  setToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  removeToken() {
    localStorage.removeItem('accessToken');
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
          this.setToken(token);
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
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, { refreshToken: null }, {
      withCredentials: true,
    }).pipe(
      tap(res => {
        const token = res.accessToken || res.token;
        if (token) {
          this.setToken(token);
          this.getCurrentUser().subscribe(); // Re-decode and set current user
        }
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.removeToken();
        this.currentUser.set(null);
      }),
      catchError(() => {
        this.removeToken();
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
      lastName: decoded.family_name || decoded.lastName || decoded.LastName || decoded.lastname || ''
    };

    // Ensure roles is always an array for consistency
    if (typeof user.roles === 'string') {
      user.roles = [user.roles];
    }

    this.currentUser.set(user);
    return of(user);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/change-password`,
      { currentPassword, newPassword },
      { withCredentials: true }
    );
  }
}
