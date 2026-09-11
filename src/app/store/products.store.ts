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
    updateEntity,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, switchMap, exhaustMap } from 'rxjs';
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
        search: '',
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
        loadProducts: rxMethod<{ pageIndex?: number; pageSize?: number; search?: string } | void>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((params) => {
                    const query = params || {};
                    const reqPageIndex = query.pageIndex ?? store.pageIndex();
                    const reqPageSize = query.pageSize ?? store.pageSize();
                    const search = query.search ?? store.search();

                    return api.getAll(reqPageIndex, reqPageSize, search || undefined).pipe(
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
                                        search,
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
                                        search,
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

        createProduct: rxMethod<{ payload: Partial<Product>; image?: File }>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                exhaustMap(({ payload, image }) =>
                    api.create(payload, image).pipe(
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

        updateProduct: rxMethod<{ id: string; payload: Partial<Product>; image?: File; removeImage?: boolean }>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                exhaustMap(({ id, payload, image, removeImage }) =>
                    api.update(id, payload, image, removeImage).pipe(
                        tap((updated) => {
                            patchState(store, updateEntity({ id, changes: updated }), { isLoading: false });
                        }),
                        catchError((err) => {
                            patchState(store, {
                                isLoading: false,
                                error: err.message || 'Failed to update product',
                            });
                            return EMPTY;
                        })
                    )
                )
            )
        ),

        deleteProduct: rxMethod<string>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                exhaustMap((id) =>
                    api.delete(id).pipe(
                        switchMap(() => {
                            const pageIndex =
                                store.entities().length <= 1 && store.pageIndex() > 1
                                    ? store.pageIndex() - 1
                                    : store.pageIndex();
                            return api.getAll(pageIndex, store.pageSize(), store.search() || undefined).pipe(
                                tap((res: PagedProductResponse | Product[]) => {
                                    if (Array.isArray(res)) {
                                        patchState(store, setAllEntities(res), {
                                            isLoading: false,
                                            totalCount: res.length,
                                            pageIndex: 1,
                                            pageSize: res.length,
                                            totalPages: 1,
                                            hasPreviousPage: false,
                                            hasNextPage: false,
                                        });
                                    } else {
                                        patchState(store, setAllEntities(res.items || []), {
                                            isLoading: false,
                                            totalCount: res.totalCount || 0,
                                            pageIndex: res.pageIndex || pageIndex,
                                            pageSize: res.pageSize || store.pageSize(),
                                            totalPages: res.totalPages || 1,
                                            hasPreviousPage: res.hasPreviousPage || false,
                                            hasNextPage: res.hasNextPage || false,
                                        });
                                    }
                                })
                            );
                        }),
                        catchError((err) => {
                            patchState(store, {
                                isLoading: false,
                                error: err.message || 'Failed to delete product',
                            });
                            return EMPTY;
                        })
                    )
                )
            )
        ),
    }))
);