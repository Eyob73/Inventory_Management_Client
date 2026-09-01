import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, patchState, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, switchMap } from 'rxjs';
import { PurchaseService } from '../services/purchase';
import { Purchase } from '../models/purchase.model';

interface PurchaseState {
  purchases: Purchase[];
  isLoading: boolean;
  error: string | null;
  search: string;
  pageIndex: number;
  pageSize: number;
}

function errMsg(err: any, fallback: string): string {
  return typeof err?.error === 'string' ? err.error : (err?.error?.detail || err.message || fallback);
}

export const PurchaseStore = signalStore(
  { providedIn: 'root' },
  withState<PurchaseState>({
    purchases: [],
    isLoading: false,
    error: null,
    search: '',
    pageIndex: 1,
    pageSize: 10,
  }),
  withComputed((store) => {
    const filtered = computed(() => {
      const all = store.purchases();
      const term = store.search().toLowerCase().trim();
      if (!term) return all;
      return all.filter(
        (p) =>
          p.purchaseNumber.toLowerCase().includes(term) ||
          (p.supplierName || '').toLowerCase().includes(term) ||
          p.status.toLowerCase().includes(term)
      );
    });

    return {
      filteredPurchases: filtered,
      paginatedPurchases: computed(() => {
        const list = filtered();
        const start = (store.pageIndex() - 1) * store.pageSize();
        return list.slice(start, start + store.pageSize());
      }),
      totalCount: computed(() => filtered().length),
      stats: computed(() => {
        const all = store.purchases();
        return {
          total: all.length,
          drafts: all.filter((p) => p.status === 'Draft').length,
          completed: all.filter((p) => p.status === 'Completed').length,
          cancelled: all.filter((p) => p.status === 'Cancelled').length,
          totalAmount: all
            .filter((p) => p.status === 'Completed')
            .reduce((sum, p) => sum + (p.totalAmount || 0), 0),
        };
      }),
    };
  }),
  withMethods((store, api = inject(PurchaseService)) => ({
    setSearch(search: string) {
      patchState(store, { search, pageIndex: 1 });
    },
    setPage(pageIndex: number, pageSize?: number) {
      patchState(store, { pageIndex, ...(pageSize ? { pageSize } : {}) });
    },
    loadPurchases: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          api.getAll().pipe(
            tap((purchases) => patchState(store, { purchases, isLoading: false })),
            catchError((err) => {
              patchState(store, { isLoading: false, error: errMsg(err, 'Failed to load purchases') });
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
