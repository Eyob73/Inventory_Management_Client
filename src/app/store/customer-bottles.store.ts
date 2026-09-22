import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, patchState, withState } from '@ngrx/signals';
import { withEntities, setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, exhaustMap, switchMap } from 'rxjs';
import { CustomerBottlesService, CustomerBottleBalance, PagedCustomerBottleResponse } from '../core/services/customer-bottles';

export const CustomerBottlesStore = signalStore(
  { providedIn: 'root' },
  withState({
    isLoading: false,
    error: null as string | null,
    pageIndex: 1,
    pageSize: 10,
    totalCount: 0,
    search: '',
    bottleTypeId: undefined as string | undefined,
    hasBalance: undefined as boolean | undefined
  }),
  withEntities<CustomerBottleBalance>(),
  withComputed((store) => ({
    balances: computed(() => store.entities())
  })),
  withMethods((store, api = inject(CustomerBottlesService)) => ({
    loadBalances: rxMethod<{ pageIndex?: number; pageSize?: number; search?: string; bottleTypeId?: string; hasBalance?: boolean } | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((params) => {
          const query = params || {};
          const reqPageIndex = query.pageIndex ?? store.pageIndex();
          const reqPageSize = query.pageSize ?? store.pageSize();
          const search = query.search ?? store.search();
          const bottleTypeId = query.bottleTypeId !== undefined ? query.bottleTypeId : store.bottleTypeId();
          const hasBalance = query.hasBalance !== undefined ? query.hasBalance : store.hasBalance();
          
          return api.getPagedBalances(reqPageIndex, reqPageSize, search, bottleTypeId, hasBalance).pipe(
            tap((res) => {
              patchState(store, setAllEntities(res.items || []), { 
                isLoading: false,
                totalCount: res.totalCount || 0,
                pageIndex: res.page || reqPageIndex,
                pageSize: res.pageSize || reqPageSize,
                search: search,
                bottleTypeId: bottleTypeId,
                hasBalance: hasBalance
              });
            }),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to load customer bottles' });
              return EMPTY;
            })
          );
        })
      )
    ),
    returnBottles: rxMethod<{ customerId: string | null; bottleTypeId: string; quantity: number; refundAmount: number }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap((payload) =>
          api.returnBottles(payload).pipe(
            switchMap(() => api.getPagedBalances(store.pageIndex(), store.pageSize(), store.search(), store.bottleTypeId(), store.hasBalance()).pipe(
               tap((res) => patchState(store, setAllEntities(res.items || []), {
                 isLoading: false,
                 totalCount: res.totalCount || 0
               }))
            )),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to return bottles' });
              return EMPTY;
            })
          )
        )
      )
    )
  }))
);
