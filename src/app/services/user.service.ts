import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SystemUser {
  id: string;
  email: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Users`;

  getUsers(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[]>(this.baseUrl, { withCredentials: true });
  }

  getUserById(id: string): Observable<SystemUser> {
    return this.http.get<SystemUser>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  createUser(dto: CreateUserDto): Observable<SystemUser> {
    return this.http.post<SystemUser>(this.baseUrl, dto, { withCredentials: true });
  }

  updateUser(id: string, dto: UpdateUserDto): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.baseUrl}/${id}`, dto, { withCredentials: true });
  }

  toggleActive(id: string, isActive: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/${id}/status`,
      { isActive },
      { withCredentials: true }
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
