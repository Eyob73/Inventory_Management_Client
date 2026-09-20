import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, switchMap } from 'rxjs';
import { BottleReportsService, BottleReportResponse } from '../core/services/bottle-reports';

export interface BottleReportsState {
  isLoading: boolean;
  error: string | null;
  reportData: BottleReportResponse | null;
}

const initialState: BottleReportsState = {
  isLoading: false,
  error: null,
  reportData: null
};

export const BottleReportsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    movementData: computed(() => store.reportData()?.movementData || []),
    depositData: computed(() => store.reportData()?.depositData || []),
    customerData: computed(() => store.reportData()?.customerData || []),
    lossData: computed(() => store.reportData()?.lossData || [])
  })),
  withMethods((store, api = inject(BottleReportsService)) => ({
    generateReport: rxMethod<{ type: string; startDate?: string | null; endDate?: string | null }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null, reportData: null })),
        switchMap((payload) => 
          api.getReport(payload.type, payload.startDate, payload.endDate).pipe(
            tap((res) => {
              patchState(store, { isLoading: false, reportData: res });
            }),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to generate report' });
              return EMPTY;
            })
          )
        )
      )
    )
  }))
);
