import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, patchState, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, switchMap, exhaustMap } from 'rxjs';
import { SupplierService } from '../services/supplier';
import { CreateSupplierDto, Supplier, UpdateSupplierDto } from '../models/supplier.model';

interface SupplierState {
  suppliers: Supplier[];
  isLoading: boolean;
  error: string | null;
  search: string;
  pageIndex: number;
  pageSize: number;
}

function errMsg(err: any, fallback: string): string {
  return typeof err?.error === 'string' ? err.error : (err?.error?.detail || err.message || fallback);
}

export const SupplierStore = signalStore(
  { providedIn: 'root' },
  withState<SupplierState>({
    suppliers: [],
    isLoading: false,
    error: null,
    search: '',
    pageIndex: 1,
    pageSize: 10,
  }),
  withComputed((store) => {
    const filtered = computed(() => {
      const all = store.suppliers();
      const term = store.search().toLowerCase().trim();
      if (!term) return all;
      return all.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          (s.contactName && s.contactName.toLowerCase().includes(term)) ||
          (s.phoneNumber && s.phoneNumber.toLowerCase().includes(term)) ||
          (s.email && s.email.toLowerCase().includes(term))
      );
    });

    return {
      filteredSuppliers: filtered,
      paginatedSuppliers: computed(() => {
        const list = filtered();
        const start = (store.pageIndex() - 1) * store.pageSize();
        return list.slice(start, start + store.pageSize());
      }),
      totalCount: computed(() => filtered().length),
      stats: computed(() => {
        const all = store.suppliers();
        return {
          total: all.length,
          active: all.filter((s) => s.isActive !== false).length,
          inactive: all.filter((s) => s.isActive === false).length,
          totalPurchased: all.reduce((sum, s) => sum + (s.totalPurchased || 0), 0),
        };
      }),
    };
  }),
  withMethods((store, api = inject(SupplierService)) => ({
    setSearch(search: string) {
      patchState(store, { search, pageIndex: 1 });
    },
    setPage(pageIndex: number, pageSize?: number) {
      patchState(store, { pageIndex, ...(pageSize ? { pageSize } : {}) });
    },
    loadSuppliers: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          api.getAll().pipe(
            tap((suppliers) => patchState(store, { suppliers, isLoading: false })),
            catchError((err) => {
              patchState(store, { isLoading: false, error: errMsg(err, 'Failed to load suppliers') });
              return EMPTY;
            })
          )
        )
      )
    ),
    createSupplier: rxMethod<{ dto: CreateSupplierDto; onSuccess?: () => void; onError?: (msg: string) => void }>(
      pipe(
        exhaustMap(({ dto, onSuccess, onError }) =>
          api.create(dto).pipe(
            tap(() => onSuccess?.()),
            switchMap(() => api.getAll()),
            tap((suppliers) => patchState(store, { suppliers, isLoading: false })),
            catchError((err) => {
              const msg = errMsg(err, 'Failed to create supplier');
              patchState(store, { error: msg });
              onError?.(msg);
              return EMPTY;
            })
          )
        )
      )
    ),
    updateSupplier: rxMethod<{ id: string; dto: UpdateSupplierDto; onSuccess?: () => void; onError?: (msg: string) => void }>(
      pipe(
        exhaustMap(({ id, dto, onSuccess, onError }) =>
          api.update(id, dto).pipe(
            tap(() => onSuccess?.()),
            switchMap(() => api.getAll()),
            tap((suppliers) => patchState(store, { suppliers })),
            catchError((err) => {
              const msg = errMsg(err, 'Failed to update supplier');
              patchState(store, { error: msg });
              onError?.(msg);
              return EMPTY;
            })
          )
        )
      )
    ),
    deleteSupplier: rxMethod<{ id: string; onSuccess?: () => void; onError?: (msg: string) => void }>(
      pipe(
        exhaustMap(({ id, onSuccess, onError }) =>
          api.delete(id).pipe(
            tap(() => onSuccess?.()),
            switchMap(() => api.getAll()),
            tap((suppliers) => patchState(store, { suppliers })),
            catchError((err) => {
              const msg = errMsg(err, 'Failed to delete supplier');
              patchState(store, { error: msg });
              onError?.(msg);
              return EMPTY;
            })
          )
        )
      )
    ),
    clearError() {
      patchState(store, { error: null });
    },
  }))
);
