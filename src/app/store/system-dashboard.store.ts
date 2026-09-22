import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, pipe, tap, switchMap, catchError, of } from 'rxjs';
import { SystemService, SystemDashboardDto, TenantDto } from '../services/system';

export interface SystemDashboardState {
  data: SystemDashboardDto | null;
  tenants: TenantDto[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SystemDashboardState = {
  data: null,
  tenants: [],
  isLoading: false,
  error: null,
};

export const SystemDashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, systemService = inject(SystemService)) => ({
    loadDashboard: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          forkJoin({
            data: systemService.getDashboard(),
            tenants: systemService.getTenants()
          }).pipe(
            tap(({ data, tenants }) => patchState(store, { data, tenants, isLoading: false })),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to load system dashboard' });
              return of(null);
            })
          )
        )
      )
    ),
  })),
  withHooks({
    onInit(store) {
      store.loadDashboard();
    }
  })
);
