import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sale, CreateSaleRequest, SaleFilter, PagedSaleResponse } from '../models/sale.model';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Sales`;

  createSale(request: CreateSaleRequest): Observable<Sale> {
    return this.http.post<Sale>(this.baseUrl, request);
  }

  getPagedSales(filter: SaleFilter): Observable<PagedSaleResponse> {
    let params = new HttpParams()
      .set('pageIndex', filter.pageIndex ?? 1)
      .set('pageSize', filter.pageSize ?? 10);

    if (filter.searchTerm) {
      params = params.set('searchTerm', filter.searchTerm);
    }
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    if (filter.paymentMethod) {
      params = params.set('paymentMethod', filter.paymentMethod);
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.userId) {
      params = params.set('userId', filter.userId);
    }

    return this.http.get<PagedSaleResponse>(`${this.baseUrl}/paged`, { params });
  }

  getSaleById(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.baseUrl}/${id}`);
  }

  cancelSale(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
