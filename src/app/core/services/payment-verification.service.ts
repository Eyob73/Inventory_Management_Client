import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  PaymentVerificationItem,
  PaymentVerificationFilter,
  PaymentVerificationSummary,
  EligibleSale,
  ManualReviewRequest,
  PaginatedResponse
} from '../../models/payment-verification.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentVerificationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payments`;

  verifyPayment(request: VerifyPaymentRequest): Observable<VerifyPaymentResponse> {
    return this.http.post<VerifyPaymentResponse>(`${this.baseUrl}/verify`, request);
  }

  getVerifications(filter?: PaymentVerificationFilter): Observable<PaginatedResponse<PaymentVerificationItem>> {
    let params = new HttpParams();
    if (filter) {
      if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
      if (filter.provider) params = params.set('provider', filter.provider);
      if (filter.status !== undefined && filter.status !== null) params = params.set('status', filter.status.toString());
      if (filter.startDate) params = params.set('startDate', filter.startDate);
      if (filter.endDate) params = params.set('endDate', filter.endDate);
      if (filter.pageIndex) params = params.set('pageIndex', filter.pageIndex.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    }
    return this.http.get<PaginatedResponse<PaymentVerificationItem>>(`${this.baseUrl}/verifications`, { params });
  }

  getVerificationById(id: string): Observable<PaymentVerificationItem> {
    return this.http.get<PaymentVerificationItem>(`${this.baseUrl}/verifications/${id}`);
  }

  getSummary(): Observable<PaymentVerificationSummary> {
    return this.http.get<PaymentVerificationSummary>(`${this.baseUrl}/verifications/summary`);
  }

  getEligibleSales(search?: string): Observable<EligibleSale[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<EligibleSale[]>(`${this.baseUrl}/eligible-sales`, { params });
  }

  retryVerification(id: string): Observable<VerifyPaymentResponse> {
    return this.http.post<VerifyPaymentResponse>(`${this.baseUrl}/verifications/${id}/retry`, {});
  }

  processManualReview(id: string, request: ManualReviewRequest): Observable<PaymentVerificationItem> {
    return this.http.post<PaymentVerificationItem>(`${this.baseUrl}/verifications/${id}/manual-review`, request);
  }
}
