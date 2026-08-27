import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  userName?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: string;
  phoneNumber?: string;
  tenantId?: string;
}

export interface UpdateUserDto {
  email?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phoneNumber?: string;
  tenantId?: string;
}

export interface PagedUserResponse {
  items: SystemUser[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
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

  getPagedUsers(page = 1, pageSize = 10, search?: string): Observable<PagedUserResponse> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http
      .get<PagedUserResponse>(`${this.baseUrl}/paged`, { params, withCredentials: true })
      .pipe(
        map((res) => ({
          ...res,
          items: res.items.map((u) => ({ ...u, isActive: !u.isLockedOut })),
        }))
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
