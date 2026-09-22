import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, exhaustMap } from 'rxjs';
import { BottleReportsService, BottleDashboardStats } from '../core/services/bottle-reports';

export const BottleDashboardStore = signalStore(
  { providedIn: 'root' },
  withState({
    stats: null as BottleDashboardStats | null,
    isLoading: false,
    error: null as string | null,
  }),
  withMethods((store, api = inject(BottleReportsService)) => ({
    loadDashboardStats: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap(() =>
          api.getDashboardStats().pipe(
            tap((stats) => patchState(store, { stats, isLoading: false })),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to load dashboard stats' });
              return EMPTY;
            })
          )
        )
      )
    )
  }))
);
