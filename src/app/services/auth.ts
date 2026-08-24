import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap } from 'rxjs';
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

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials, {
      withCredentials: true,
    });
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, credentials, {
      withCredentials: true,
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.currentUser.set(null);
      }),
      catchError(() => {
        this.currentUser.set(null);
        return of(undefined);
      }),
    );
  }

  getCurrentUser(): Observable<User | null> {
    return this.http.get<User>(`${this.baseUrl}/me`, { withCredentials: true }).pipe(
      tap((user) => this.currentUser.set(user)),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      }),
    );
  }
}
