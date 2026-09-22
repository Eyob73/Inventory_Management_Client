import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BottleInventory {
  id: string;
  bottleTypeId: string;
  bottleTypeName: string;
  fullBottles: number;
  emptyBottles: number;
  damagedBottles: number;
  lostBottles: number;
  withCustomers: number;
  lastUpdatedAt: Date;
}

export interface PagedBottleInventoryResponse {
  items: BottleInventory[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdjustBottleInventoryRequest {
  bottleTypeId: string;
  adjustmentType: number; // 0=Damaged, 1=Lost, 2=Found, 3=Correction
  quantity: number;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class BottleInventoryService {
  private apiUrl = environment.apiUrl + '/BottleInventory';

  constructor(private http: HttpClient) {}

  getInventory(): Observable<BottleInventory[]> {
    return this.http.get<BottleInventory[]>(this.apiUrl);
  }

  getPagedInventory(pageIndex: number, pageSize: number, search?: string): Observable<PagedBottleInventoryResponse> {
    let params = new HttpParams()
      .set('page', pageIndex.toString())
      .set('pageSize', pageSize.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PagedBottleInventoryResponse>(this.apiUrl + '/paged', { params });
  }

  adjustInventory(request: AdjustBottleInventoryRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl + '/adjust', request);
  }
}
