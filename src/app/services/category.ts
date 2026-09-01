import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category, CategoryDetail, CreateCategoryDto, UpdateCategoryDto } from '../models/category.model';
import { environment } from '../../environments/environment.development';

export type { Category, CategoryDetail, CreateCategoryDto, UpdateCategoryDto };

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Categories`;

  getAll() {
    return this.http.get<Category[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<CategoryDetail>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateCategoryDto) {
    return this.http.post<Category>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.http.put<Category>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
