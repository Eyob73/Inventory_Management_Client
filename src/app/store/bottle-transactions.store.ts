import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, patchState, withState } from '@ngrx/signals';
import { withEntities, setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, exhaustMap, switchMap } from 'rxjs';
import { BottleTransactionsService, BottleTransaction, PagedBottleTransactionResponse } from '../core/services/bottle-transactions';

export const BottleTransactionsStore = signalStore(
  { providedIn: 'root' },
  withState({
    isLoading: false,
    error: null as string | null,
    pageIndex: 1,
    pageSize: 10,
    totalCount: 0,
    search: '',
    status: undefined as number | undefined
  }),
  withEntities<BottleTransaction>(),
  withComputed((store) => ({
    transactions: computed(() => store.entities()),
  })),
  withMethods((store, api = inject(BottleTransactionsService)) => ({
    loadTransactions: rxMethod<{ pageIndex?: number; pageSize?: number; search?: string; status?: number } | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((params) => {
          const query = params || {};
          const reqPageIndex = query.pageIndex ?? store.pageIndex();
          const reqPageSize = query.pageSize ?? store.pageSize();
          const search = query.search ?? store.search();
          const status = query.status !== undefined ? query.status : store.status();
          
          return api.getPagedTransactions(reqPageIndex, reqPageSize, search, status).pipe(
            tap((res) => {
              patchState(store, setAllEntities(res.items || []), { 
                isLoading: false,
                totalCount: res.totalCount || 0,
                pageIndex: res.page || reqPageIndex,
                pageSize: res.pageSize || reqPageSize,
                search: search,
                status: status
              });
            }),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to load bottle transactions' });
              return EMPTY;
            })
          );
        })
      )
    )
  }))
);
