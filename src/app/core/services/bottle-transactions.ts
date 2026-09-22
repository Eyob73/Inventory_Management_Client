import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BottleTransaction {
  id: string;
  bottleTypeName: string;
  customerName: string | null;
  transactionType: string;
  quantity: number;
  depositAmount: number;
  notes: string;
  createdAt: Date;
  createdBy: string;
}

export interface PagedBottleTransactionResponse {
  items: BottleTransaction[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class BottleTransactionsService {
  private apiUrl = environment.apiUrl + '/BottleTransactions';

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<BottleTransaction[]> {
    return this.http.get<BottleTransaction[]>(this.apiUrl);
  }

  getPagedTransactions(pageIndex: number, pageSize: number, search?: string, status?: number): Observable<PagedBottleTransactionResponse> {
    let params = new HttpParams()
      .set('page', pageIndex.toString())
      .set('pageSize', pageSize.toString())
      .set('descending', 'true');

    if (search) {
      params = params.set('search', search);
    }
    if (status !== undefined && status !== null) {
      params = params.set('status', status.toString());
    }

    return this.http.get<PagedBottleTransactionResponse>(this.apiUrl + '/paged', { params });
  }
}
