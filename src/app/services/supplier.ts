import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  Supplier,
  SupplierDetail,
  CreateSupplierDto,
  UpdateSupplierDto,
} from '../models/supplier.model';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Suppliers`;

  getAll(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.baseUrl);
  }

  getById(id: string): Observable<SupplierDetail> {
    return this.http.get<SupplierDetail>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateSupplierDto): Observable<Supplier> {
    return this.http.post<Supplier>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateSupplierDto): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
