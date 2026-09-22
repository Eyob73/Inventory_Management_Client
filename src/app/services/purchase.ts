import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { CreatePurchaseDto, Purchase, UpdatePurchaseDto } from '../models/purchase.model';

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Purchases`;

  getAll(): Observable<Purchase[]> {
    return this.http.get<Purchase[]>(this.baseUrl);
  }

  getById(id: string): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreatePurchaseDto): Observable<Purchase> {
    return this.http.post<Purchase>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdatePurchaseDto): Observable<Purchase> {
    return this.http.put<Purchase>(`${this.baseUrl}/${id}`, dto);
  }

  complete(id: string): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.baseUrl}/${id}/complete`, {});
  }

  cancel(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/cancel`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
