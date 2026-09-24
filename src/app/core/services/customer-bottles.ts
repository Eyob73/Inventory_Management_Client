import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CustomerBottleBalance {
  id: string;
  customerId: string | null;
  customerName: string;
  bottleTypeId: string;
  bottleTypeName: string;
  balance: number;
  totalDeposit: number;
  lastUpdatedAt: Date;
}

export interface PagedCustomerBottleResponse {
  items: CustomerBottleBalance[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerBottlesService {
  private apiUrl = environment.apiUrl + '/CustomerBottles';

  constructor(private http: HttpClient) {}

  getBalances(): Observable<CustomerBottleBalance[]> {
    return this.http.get<CustomerBottleBalance[]>(this.apiUrl);
  }

  getPagedBalances(pageIndex: number, pageSize: number, search?: string, bottleTypeId?: string, hasBalance?: boolean): Observable<PagedCustomerBottleResponse> {
    let params = new HttpParams()
      .set('page', pageIndex.toString())
      .set('pageSize', pageSize.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (bottleTypeId) {
      params = params.set('bottleTypeId', bottleTypeId);
    }
    if (hasBalance !== undefined && hasBalance !== null) {
      params = params.set('hasBalance', hasBalance.toString());
    }

    return this.http.get<PagedCustomerBottleResponse>(this.apiUrl + '/paged', { params });
  }

  returnBottles(request: { customerId: string | null, bottleTypeId: string, quantity: number, refundAmount: number }): Observable<void> {
    return this.http.post<void>(this.apiUrl + '/return', request);
  }
}
