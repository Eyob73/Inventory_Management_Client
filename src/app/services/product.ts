import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Product, PagedProductResponse, ProductQueryFilter } from "../models/products.model";

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
  private baseUrl = "http://localhost:5111/api/products";

  getAll() {
    return this.http.get<PagedProductResponse>(`${this.baseUrl}/paged`);
  }

  getById(id: string) {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(product: Partial<Product>) {
    return this.http.post<Product>(this.baseUrl, product);
  }
}