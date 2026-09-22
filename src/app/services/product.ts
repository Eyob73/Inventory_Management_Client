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

  getAll(pageIndex = 1, pageSize = 10, search?: string, categoryId?: string) {
    let params = new HttpParams()
      .set('pageIndex', pageIndex)
      .set('pageNumber', pageIndex)
      .set('page', pageIndex)
      .set('pageSize', pageSize);

    if (search) {
      params = params.set('search', search).set('searchTerm', search);
    }

    if (categoryId && categoryId !== 'ALL') {
      params = params.set('categoryId', categoryId);
    }

    return this.http.get<PagedProductResponse>(`${this.baseUrl}/paged`, { params });
  }

  getCatalog() {
    return this.http.get<Product[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(product: Partial<Product>, image?: File) {
    const formData = new FormData();
    Object.keys(product).forEach((key) => {
      const val = (product as any)[key];
      if (val !== null && val !== undefined) {
        if (val === '' && (key === 'categoryId' || key === 'supplierId' || key === 'id')) {
          return;
        }
        formData.append(key, val.toString());
      }
    });
    if (image) {
      formData.append('image', image);
    }
    return this.http.post<Product>(this.baseUrl, formData);
  }

  update(id: string, product: Partial<Product>, image?: File, removeImage: boolean = false) {
    const formData = new FormData();
    Object.keys(product).forEach((key) => {
      const val = (product as any)[key];
      if (val !== null && val !== undefined) {
        if (val === '' && (key === 'categoryId' || key === 'supplierId' || key === 'id')) {
          return;
        }
        formData.append(key, val.toString());
      }
    });
    formData.append('id', id);
    if (image) {
      formData.append('image', image);
    }
    if (removeImage) {
      formData.append('removeImage', 'true');
    }
    return this.http.put<Product>(`${this.baseUrl}/${id}`, formData);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
