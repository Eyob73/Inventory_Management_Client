import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Supplier } from '../models/supplier.model';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Supplier`;

  getAll() {
    return this.http.get<Supplier[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Supplier>(`${this.baseUrl}/${id}`);
  }
}
