import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  CreateStockAdjustmentDto,
  InventoryTransactionFilter,
  PagedInventoryTransactions,
  ProductStock,
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/inventory`;

  getTransactions(filter: InventoryTransactionFilter): Observable<PagedInventoryTransactions> {
    let params = new HttpParams()
      .set('pageIndex', String(filter.pageIndex ?? 1))
      .set('pageSize', String(filter.pageSize ?? 20));

    if (filter.productId) params = params.set('productId', filter.productId);
    if (filter.type) params = params.set('type', filter.type);
    if (filter.startDate) params = params.set('startDate', filter.startDate);
    if (filter.endDate) params = params.set('endDate', filter.endDate);
    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);

    return this.http.get<PagedInventoryTransactions>(`${this.baseUrl}/transactions`, { params });
  }

  getProductStock(productId: string): Observable<ProductStock> {
    return this.http.get<ProductStock>(`${this.baseUrl}/products/${productId}`);
  }

  adjust(dto: CreateStockAdjustmentDto): Observable<ProductStock> {
    return this.http.post<ProductStock>(`${this.baseUrl}/adjustments`, dto);
  }
}
