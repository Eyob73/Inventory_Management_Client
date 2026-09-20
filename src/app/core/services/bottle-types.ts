import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BottleType {
  id: string;
  name: string;
  description: string;
  depositAmount: number;
  capacity: string;
  material: string;
  isActive: boolean;
  createdAt: Date;
}

export interface PagedBottleTypeResponse {
  items: BottleType[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class BottleTypesService {
  private apiUrl = environment.apiUrl + '/BottleTypes';

  constructor(private http: HttpClient) {}

  getBottleTypes(): Observable<BottleType[]> {
    return this.http.get<BottleType[]>(this.apiUrl);
  }

  getPagedBottleTypes(pageIndex: number, pageSize: number, search?: string): Observable<PagedBottleTypeResponse> {
    let params = new HttpParams()
      .set('page', pageIndex.toString())
      .set('pageSize', pageSize.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PagedBottleTypeResponse>(this.apiUrl + '/paged', { params });
  }

  createBottleType(bottleType: Partial<BottleType>): Observable<string> {
    return this.http.post<string>(this.apiUrl, bottleType);
  }

  updateBottleType(id: string, bottleType: Partial<BottleType>): Observable<void> {
    return this.http.put<void>(this.apiUrl + '/' + id, bottleType);
  }

  deleteBottleType(id: string): Observable<void> {
    return this.http.delete<void>(this.apiUrl + '/' + id);
  }
}
