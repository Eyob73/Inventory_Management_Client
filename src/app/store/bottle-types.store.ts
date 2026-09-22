import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, patchState, withState } from '@ngrx/signals';
import { withEntities, setAllEntities, addEntity, updateEntity, removeEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, exhaustMap, switchMap } from 'rxjs';
import { BottleTypesService, BottleType, PagedBottleTypeResponse } from '../core/services/bottle-types';

export const BottleTypesStore = signalStore(
  { providedIn: 'root' },
  withState({
    isLoading: false,
    error: null as string | null,
    pageIndex: 1,
    pageSize: 10,
    totalCount: 0,
    search: ''
  }),
  withEntities<BottleType>(),
  withComputed((store) => ({
    bottleTypes: computed(() => store.entities()),
    activeBottleTypes: computed(() => store.entities().filter(b => b.isActive))
  })),
  withMethods((store, api = inject(BottleTypesService)) => ({
    loadBottleTypes: rxMethod<{ pageIndex?: number; pageSize?: number; search?: string } | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((params) => {
          const query = params || {};
          const reqPageIndex = query.pageIndex ?? store.pageIndex();
          const reqPageSize = query.pageSize ?? store.pageSize();
          const search = query.search ?? store.search();
          
          return api.getPagedBottleTypes(reqPageIndex, reqPageSize, search).pipe(
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
              patchState(store, { isLoading: false, error: err.message || 'Failed to load bottle types' });
              return EMPTY;
            })
          );
        })
      )
    ),
    createBottleType: rxMethod<Partial<BottleType>>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap((payload) =>
          api.createBottleType(payload).pipe(
            switchMap(() => api.getPagedBottleTypes(store.pageIndex(), store.pageSize(), store.search()).pipe(
               tap((res) => patchState(store, setAllEntities(res.items || []), {
                 isLoading: false,
                 totalCount: res.totalCount || 0
               }))
            )),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to create bottle type' });
              return EMPTY;
            })
          )
        )
      )
    ),
    updateBottleType: rxMethod<{ id: string; payload: Partial<BottleType> }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap(({ id, payload }) =>
          api.updateBottleType(id, payload).pipe(
            switchMap(() => api.getPagedBottleTypes(store.pageIndex(), store.pageSize(), store.search()).pipe(
               tap((res) => patchState(store, setAllEntities(res.items || []), {
                 isLoading: false,
                 totalCount: res.totalCount || 0
               }))
            )),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to update bottle type' });
              return EMPTY;
            })
          )
        )
      )
    ),
    deleteBottleType: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap((id) =>
          api.deleteBottleType(id).pipe(
            switchMap(() => {
              let pIndex = store.pageIndex();
              if (store.entities().length === 1 && pIndex > 1) {
                pIndex--;
              }
              return api.getPagedBottleTypes(pIndex, store.pageSize(), store.search()).pipe(
                 tap((res) => patchState(store, setAllEntities(res.items || []), {
                   isLoading: false,
                   totalCount: res.totalCount || 0,
                   pageIndex: res.page || pIndex
                 }))
              );
            }),
            catchError((err) => {
              patchState(store, { isLoading: false, error: err.message || 'Failed to delete bottle type' });
              return EMPTY;
            })
          )
        )
      )
    )
  }))
);
