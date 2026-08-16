import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Supplier } from '../models/supplier.model';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5111/api/suppliers';

  getAll() {
    return this.http.get<Supplier[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Supplier>(`${this.baseUrl}/${id}`);
  }
}
