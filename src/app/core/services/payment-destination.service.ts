import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentDestination,
  CreatePaymentDestinationRequest,
  UpdatePaymentDestinationRequest,
  SupportedBank
} from '../../models/payment-verification.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentDestinationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payment-destinations`;

  getAll(activeOnly?: boolean): Observable<PaymentDestination[]> {
    let params = new HttpParams();
    if (activeOnly !== undefined && activeOnly !== null) {
      params = params.set('activeOnly', activeOnly.toString());
    }
    return this.http.get<PaymentDestination[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<PaymentDestination> {
    return this.http.get<PaymentDestination>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreatePaymentDestinationRequest): Observable<PaymentDestination> {
    return this.http.post<PaymentDestination>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdatePaymentDestinationRequest): Observable<PaymentDestination> {
    return this.http.put<PaymentDestination>(`${this.baseUrl}/${id}`, dto);
  }

  setDefault(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/default`, {});
  }

  setStatus(id: string, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/status`, { isActive });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getSupportedBanks(): Observable<SupportedBank[]> {
    return this.http.get<SupportedBank[]>(`${this.baseUrl}/supported-banks`);
  }
}
