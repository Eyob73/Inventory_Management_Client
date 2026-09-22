import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BottleMovementReportDto {
  date: string;
  transactionType: string;
  bottleTypeName: string;
  customerName: string;
  quantity: number;
  reference: string;
}

export interface BottleDepositReportDto {
  date: string;
  customerName: string;
  bottleTypeName: string;
  depositAmount: number;
  transactionType: string;
}

export interface CustomerBottleBalanceReportDto {
  customerName: string;
  bottleTypeName: string;
  unreturnedBottles: number;
  totalDeposit: number;
  lastUpdatedAt: string;
}

export interface BottleLossReportDto {
  date: string;
  bottleTypeName: string;
  transactionType: string;
  quantity: number;
  notes: string;
}

export interface BottleReportResponse {
  reportType: string;
  movementData: BottleMovementReportDto[];
  depositData: BottleDepositReportDto[];
  customerData: CustomerBottleBalanceReportDto[];
  lossData: BottleLossReportDto[];
}

@Injectable({ providedIn: 'root' })
export class BottleReportsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/BottleReports';

  getReport(type: string, startDate?: string | null, endDate?: string | null): Observable<BottleReportResponse> {
    let params = new HttpParams().set('type', type);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<BottleReportResponse>(this.apiUrl, { params });
  }

  getDashboardStats(): Observable<BottleDashboardStats> {
    return this.http.get<BottleDashboardStats>(this.apiUrl + '/stats');
  }
}

export interface BottleDashboardStats {
  totalFullBottles: number;
  totalEmptyBottles: number;
  totalBottlesWithCustomers: number;
  totalPendingDepositLiability: number;
}
