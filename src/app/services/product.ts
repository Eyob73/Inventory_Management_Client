import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Product } from "../models/products.model";

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = "http://localhost:5111/api/products";

  getAll() {
    return this.http.get<Product[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }
}