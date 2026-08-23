import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../models/category.model';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/Category`;

  getAll() {
    return this.http.get<Category[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }
}
