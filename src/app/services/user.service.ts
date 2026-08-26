import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SystemUser {
  id: string;
  email: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  tenantId?: string;
  roles: string[];
  isLockedOut?: boolean;
  isActive?: boolean;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: string;
  phoneNumber?: string;
  tenantId?: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phoneNumber?: string;
  tenantId?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Users`;

  getUsers(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[]>(this.baseUrl, { withCredentials: true }).pipe(
      map((users) => users.map((u) => ({ ...u, isActive: !u.isLockedOut })))
    );
  }

  getUserById(id: string): Observable<SystemUser> {
    return this.http.get<SystemUser>(`${this.baseUrl}/${id}`, { withCredentials: true }).pipe(
      map((u) => ({ ...u, isActive: !u.isLockedOut }))
    );
  }

  createUser(dto: CreateUserDto): Observable<SystemUser> {
    return this.http.post<SystemUser>(this.baseUrl, dto, { withCredentials: true }).pipe(
      map((u) => ({ ...u, isActive: !u.isLockedOut }))
    );
  }

  updateUser(id: string, dto: UpdateUserDto): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.baseUrl}/${id}`, dto, { withCredentials: true }).pipe(
      map((u) => ({ ...u, isActive: !u.isLockedOut }))
    );
  }

  toggleActive(id: string): Observable<{ isLockedOut: boolean; message: string }> {
    return this.http.post<{ isLockedOut: boolean; message: string }>(
      `${this.baseUrl}/${id}/toggle-lock`,
      {},
      { withCredentials: true }
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
