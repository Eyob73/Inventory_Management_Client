import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5111/api/categories';

  getAll() {
    return this.http.get<Category[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }
}
