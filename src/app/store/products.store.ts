import { computed, inject } from '@angular/core';
import {
    signalStore,
    withComputed,
    withMethods,
    patchState,
    withState,
} from '@ngrx/signals';
import {
    withEntities,
    setAllEntities,
    addEntity,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, concatMap, tap, catchError, EMPTY, switchMap, exhaustMap } from 'rxjs';
import { ProductService } from '../services/product';
import { Product, PagedProductResponse } from '../models/products.model';

export const ProductStore = signalStore(
    { providedIn: 'root' },
    withState({
        isLoading: false,
        error: null as string | null,
        totalCount: 0,
        pageIndex: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
    }),
    withEntities<Product>(),
    withComputed((store) => ({
        products: computed(() => store.entities()),
        totalProducts: computed(() => store.entities().length),
        lowStockCount: computed(
            () => store.entities().filter((p) => p.quantityInStock > 0 && p.quantityInStock <= 15).length
        ),
        outOfStockCount: computed(
            () => store.entities().filter((p) => p.quantityInStock <= 0).length
        ),
        totalInventoryValue: computed(
            () => store.entities().reduce((sum, p) => sum + (p.price || 0) * (p.quantityInStock || 0), 0)
        ),
    })),
    withMethods((store, api = inject(ProductService)) => ({
        loadProducts: rxMethod<{ pageIndex?: number; pageSize?: number } | void>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((params) => {
                    const query = params || {};
                    const reqPageIndex = query.pageIndex ?? store.pageIndex();
                    const reqPageSize = query.pageSize ?? store.pageSize();

                    return api.getAll(reqPageIndex, reqPageSize).pipe(
                        tap((res: PagedProductResponse | Product[]) => {
                            if (Array.isArray(res)) {
                                patchState(
                                    store,
                                    setAllEntities(res),
                                    {
                                        isLoading: false,
                                        totalCount: res.length,
                                        pageIndex: 1,
                                        pageSize: res.length,
                                        totalPages: 1,
                                        hasPreviousPage: false,
                                        hasNextPage: false,
                                    }
                                );
                            } else {
                                patchState(
                                    store,
                                    setAllEntities(res.items || []),
                                    {
                                        isLoading: false,
                                        totalCount: res.totalCount || 0,
                                        pageIndex: res.pageIndex || reqPageIndex,
                                        pageSize: res.pageSize || reqPageSize,
                                        totalPages: res.totalPages || 1,
                                        hasPreviousPage: res.hasPreviousPage || false,
                                        hasNextPage: res.hasNextPage || false,
                                    }
                                );
                            }
                        }),
                        catchError((err) => {
                            patchState(store, {
                                isLoading: false,
                                error: err.message || 'Failed to load products',
                            });
                            return EMPTY;
                        })
                    );
                })
            )
        ),

        createProduct: rxMethod<Partial<Product>>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                exhaustMap((payload) =>
                    api.create(payload).pipe(
                        tap((newProduct) => {
                            patchState(store, addEntity(newProduct), { isLoading: false });
                        }),
                        catchError((err) => {
                            patchState(store, {
                                isLoading: false,
                                error: err.message || 'Failed to create product',
                            });
                            return EMPTY;
                        })
                    )
                )
            )
        ),
    }))
);