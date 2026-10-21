import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TenantProfile {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  lowStockThreshold?: number;
  enableBottleManagement?: boolean;
  posPaymentVerificationEnabled?: boolean;
}

export interface UpdateTenantProfile {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  lowStockThreshold?: number;
  enableBottleManagement?: boolean;
  posPaymentVerificationEnabled?: boolean;
}

export interface PosPaymentVerificationSetting {
  enabled: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TenantApiService {
  public isBottleManagementEnabled = signal<boolean>(false);
  public isPaymentVerificationEnabled = signal<boolean>(false);
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Tenants`;
  private settingsUrl = `${environment.apiUrl}/settings`;

  getMyTenant(): Observable<TenantProfile> {
    return this.http.get<TenantProfile>(`${this.baseUrl}/mine`);
  }

  updateMyTenant(data: UpdateTenantProfile): Observable<TenantProfile> {
    return this.http.put<TenantProfile>(`${this.baseUrl}/mine`, data);
  }

  getPosPaymentVerification(): Observable<PosPaymentVerificationSetting> {
    return this.http.get<PosPaymentVerificationSetting>(`${this.settingsUrl}/pos-payment-verification`);
  }

  updatePosPaymentVerification(enabled: boolean): Observable<PosPaymentVerificationSetting> {
    return this.http.put<PosPaymentVerificationSetting>(`${this.settingsUrl}/pos-payment-verification`, { enabled });
  }
}


