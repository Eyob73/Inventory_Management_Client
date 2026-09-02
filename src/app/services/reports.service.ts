import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  ReportFilter,
  DashboardReport,
  SalesReport,
  PurchasesReport,
  InventoryReport,
  LowStockReport,
  ProductPerformanceReport,
  CustomerReport,
  SupplierReport,
  ProfitReport,
  StockMovementReport,
} from '../models/reports.model';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/reports`;

  private buildParams(filter: ReportFilter): HttpParams {
    let params = new HttpParams();
    if (filter.startDate) params = params.set('startDate', filter.startDate);
    if (filter.endDate) params = params.set('endDate', filter.endDate);
    if (filter.productId) params = params.set('productId', filter.productId);
    if (filter.categoryId) params = params.set('categoryId', filter.categoryId);
    if (filter.supplierId) params = params.set('supplierId', filter.supplierId);
    if (filter.customerId) params = params.set('customerId', filter.customerId);
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.transactionType) params = params.set('transactionType', filter.transactionType);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.page) params = params.set('page', String(filter.page));
    if (filter.pageSize) params = params.set('pageSize', String(filter.pageSize));
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.descending !== undefined) params = params.set('descending', String(filter.descending));
    return params;
  }

  getDashboard(filter: ReportFilter): Observable<DashboardReport> {
    return this.http.get<DashboardReport>(`${this.baseUrl}/dashboard`, {
      params: this.buildParams(filter),
    });
  }

  getSales(filter: ReportFilter): Observable<SalesReport> {
    return this.http.get<SalesReport>(`${this.baseUrl}/sales`, {
      params: this.buildParams(filter),
    });
  }

  getPurchases(filter: ReportFilter): Observable<PurchasesReport> {
    return this.http.get<PurchasesReport>(`${this.baseUrl}/purchases`, {
      params: this.buildParams(filter),
    });
  }

  getInventory(filter: ReportFilter): Observable<InventoryReport> {
    return this.http.get<InventoryReport>(`${this.baseUrl}/inventory`, {
      params: this.buildParams(filter),
    });
  }

  getLowStock(filter: ReportFilter): Observable<LowStockReport> {
    return this.http.get<LowStockReport>(`${this.baseUrl}/low-stock`, {
      params: this.buildParams(filter),
    });
  }

  getProducts(filter: ReportFilter): Observable<ProductPerformanceReport> {
    return this.http.get<ProductPerformanceReport>(`${this.baseUrl}/products`, {
      params: this.buildParams(filter),
    });
  }

  getCustomers(filter: ReportFilter): Observable<CustomerReport> {
    return this.http.get<CustomerReport>(`${this.baseUrl}/customers`, {
      params: this.buildParams(filter),
    });
  }

  getSuppliers(filter: ReportFilter): Observable<SupplierReport> {
    return this.http.get<SupplierReport>(`${this.baseUrl}/suppliers`, {
      params: this.buildParams(filter),
    });
  }

  getProfit(filter: ReportFilter): Observable<ProfitReport> {
    return this.http.get<ProfitReport>(`${this.baseUrl}/profit`, {
      params: this.buildParams(filter),
    });
  }

  getStockMovements(filter: ReportFilter): Observable<StockMovementReport> {
    return this.http.get<StockMovementReport>(`${this.baseUrl}/stock-transactions`, {
      params: this.buildParams(filter),
    });
  }

  exportReport(reportType: string, filter: ReportFilter, format: 'csv' | 'xlsx' = 'csv'): Observable<Blob> {
    const params = this.buildParams(filter).set('format', format);
    return this.http.get(`${this.baseUrl}/export/${reportType}`, {
      params,
      responseType: 'blob',
    });
  }
}
