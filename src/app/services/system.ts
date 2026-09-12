import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SystemDashboardDto {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  activeUsers: number;
}

export interface TenantDto {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  status: number; // 0=Active, 1=Suspended, 2=Deactivated
  createdAt: string;
}

export interface TenantUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/system`;

  getDashboard(): Observable<SystemDashboardDto> {
    return this.http.get<SystemDashboardDto>(`${this.baseUrl}/dashboard`);
  }

  getTenants(): Observable<TenantDto[]> {
    return this.http.get<TenantDto[]>(`${this.baseUrl}/tenants`);
  }

  getTenant(id: string): Observable<TenantDto> {
    return this.http.get<TenantDto>(`${this.baseUrl}/tenants/${id}`);
  }

  createTenant(data: any): Observable<TenantDto> {
    return this.http.post<TenantDto>(`${this.baseUrl}/tenants`, data);
  }

  activateTenant(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/tenants/${id}/activate`, {});
  }

  suspendTenant(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/tenants/${id}/suspend`, {});
  }

  deactivateTenant(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/tenants/${id}/deactivate`, {});
  }

  getTenantUsers(id: string): Observable<TenantUserDto[]> {
    return this.http.get<TenantUserDto[]>(`${this.baseUrl}/tenants/${id}/users`);
  }
}
