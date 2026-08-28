import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Product, PagedProductResponse, ProductQueryFilter } from '../models/products.model';
import { environment } from '../../environments/environment.development';

export interface ProductPayload {
  name: string;
  description: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  supplierId: null | string;
  quantityInStock: number;
  categoryId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Products`;

  getAll(pageIndex = 1, pageSize = 10, search?: string) {
    let params = new HttpParams()
      .set('pageIndex', pageIndex)
      .set('pageNumber', pageIndex)
      .set('page', pageIndex)
      .set('pageSize', pageSize);

    if (search) {
      params = params.set('search', search).set('searchTerm', search);
    }

    return this.http.get<PagedProductResponse>(`${this.baseUrl}/paged`, { params });
  }

  getById(id: string) {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(product: Partial<Product>) {
    return this.http.post<Product>(this.baseUrl, product);
  }

  update(id: string, product: Partial<Product>) {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, { ...product, id });
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
