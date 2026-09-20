import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, patchState, withState } from '@ngrx/signals';
import { withEntities, setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, exhaustMap, switchMap } from 'rxjs';
import { BottleInventoryService, BottleInventory, AdjustBottleInventoryRequest, PagedBottleInventoryResponse } from '../core/services/bottle-inventory';

export const BottleInventoryStore = signalStore(
  { providedIn: 'root' },
  withState({
    isLoading: false,
    error: null as string | null,
    pageIndex: 1,
    pageSize: 10,
    totalCount: 0,
    search: ''
  }),
  withEntities<BottleInventory>(),
  withComputed((store) => ({
    inventory: computed(() => store.entities()),
  })),
  withMethods((store, api = inject(BottleInventoryService)) => ({
    loadInventory: rxMethod<{ pageIndex?: number; pageSize?: number; search?: string } | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((params) => {
          const query = params || {};
          const reqPageIndex = query.pageIndex ?? store.pageIndex();
          const reqPageSize = query.pageSize ?? store.pageSize();
          const search = query.search ?? store.search();
          
          return api.getPagedInventory(reqPageIndex, reqPageSize, search).pipe(
            tap((res) => {
              patchState(store, setAllEntities(res.items || []), { 
                isLoading: false,
                totalCount: res.totalCount || 0,
                pageIndex: res.page || reqPageIndex,
                pageSize: res.pageSize || reqPageSize,
                search: search
              });
            }),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to load bottle inventory' });
              return EMPTY;
            })
          );
        })
      )
    ),
    adjustInventory: rxMethod<AdjustBottleInventoryRequest>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap((payload) =>
          api.adjustInventory(payload).pipe(
            switchMap(() => api.getPagedInventory(store.pageIndex(), store.pageSize(), store.search()).pipe(
               tap((res) => patchState(store, setAllEntities(res.items || []), {
                 isLoading: false,
                 totalCount: res.totalCount || 0
               }))
            )),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to adjust bottle inventory' });
              return EMPTY;
            })
          )
        )
      )
    )
  }))
);
