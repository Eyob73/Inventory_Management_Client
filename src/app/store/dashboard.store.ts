import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap, catchError, of, forkJoin } from 'rxjs';
import { ReportsService } from '../services/reports.service';
import { DashboardReport, ReportFilter, LowStockReport, StockMovementReport } from '../models/reports.model';

export interface DashboardState {
  data: DashboardReport | null;
  lowStock: LowStockReport | null;
  activities: StockMovementReport | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  lowStock: null,
  activities: null,
  isLoading: false,
  error: null,
};

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, reportsService = inject(ReportsService)) => ({
    loadDashboard: rxMethod<ReportFilter>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((filter) =>
          forkJoin({
            dash: reportsService.getDashboard(filter),
            low: reportsService.getLowStock(filter),
            act: reportsService.getStockMovements({ ...filter, pageSize: 5, sortBy: 'date', descending: true })
          }).pipe(
            tap(({ dash, low, act }) => patchState(store, { data: dash, lowStock: low, activities: act, isLoading: false })),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to load dashboard' });
              return of(null);
            })
          )
        )
      )
    ),
  })),
  withHooks({
    onInit(store) {
      // By default load the last 30 days
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      store.loadDashboard({ startDate, endDate });
    }
  })
);
