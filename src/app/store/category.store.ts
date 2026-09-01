import { computed, inject } from '@angular/core';
import {
  signalStore,
  withComputed,
  withMethods,
  patchState,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, switchMap, exhaustMap } from 'rxjs';
import { CategoryService, Category, CreateCategoryDto, UpdateCategoryDto } from '../services/category';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  search: string;
  pageIndex: number;
  pageSize: number;
}

export const CategoryStore = signalStore(
  { providedIn: 'root' },
  withState<CategoryState>({
    categories: [],
    isLoading: false,
    error: null,
    search: '',
    pageIndex: 1,
    pageSize: 10,
  }),
  withComputed((store) => {
    const filteredCategories = computed(() => {
      const all = store.categories();
      const term = store.search().toLowerCase().trim();
      if (!term) return all;
      return all.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.description && c.description.toLowerCase().includes(term))
      );
    });

    const paginatedCategories = computed(() => {
      const list = filteredCategories();
      const startIndex = (store.pageIndex() - 1) * store.pageSize();
      return list.slice(startIndex, startIndex + store.pageSize());
    });

    const stats = computed(() => {
      const all = store.categories();
      return {
        total: all.length,
        active: all.filter((c) => c.isActive !== false).length,
        inactive: all.filter((c) => c.isActive === false).length,
        totalProducts: all.reduce((sum, c) => sum + (c.productCount || 0), 0),
      };
    });

    return {
      filteredCategories,
      paginatedCategories,
      totalCount: computed(() => filteredCategories().length),
      stats,
    };
  }),
  withMethods((store, api = inject(CategoryService)) => ({
    setSearch(search: string) {
      patchState(store, { search, pageIndex: 1 });
    },

    setPage(pageIndex: number, pageSize?: number) {
      patchState(store, {
        pageIndex,
        ...(pageSize ? { pageSize } : {}),
      });
    },

    loadCategories: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          api.getAll().pipe(
            tap((categories) => {
              patchState(store, {
                categories,
                isLoading: false,
              });
            }),
            catchError((err) => {
              const msg = err?.error?.detail || err.message || 'Failed to load categories';
              patchState(store, { isLoading: false, error: msg });
              return EMPTY;
            })
          )
        )
      )
    ),

    createCategory: rxMethod<{ dto: CreateCategoryDto; onSuccess?: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap(({ dto, onSuccess }) =>
          api.create(dto).pipe(
            tap(() => {
              patchState(store, { isLoading: false });
              if (onSuccess) onSuccess();
            }),
            switchMap(() => api.getAll()),
            tap((categories) => {
              patchState(store, { categories, isLoading: false });
            }),
            catchError((err) => {
              const msg = err?.error?.detail || err.message || 'Failed to create category';
              patchState(store, { isLoading: false, error: msg });
              return EMPTY;
            })
          )
        )
      )
    ),

    updateCategory: rxMethod<{ id: string; dto: UpdateCategoryDto; onSuccess?: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap(({ id, dto, onSuccess }) =>
          api.update(id, dto).pipe(
            tap(() => {
              patchState(store, { isLoading: false });
              if (onSuccess) onSuccess();
            }),
            switchMap(() => api.getAll()),
            tap((categories) => {
              patchState(store, { categories, isLoading: false });
            }),
            catchError((err) => {
              const msg = err?.error?.detail || err.message || 'Failed to update category';
              patchState(store, { isLoading: false, error: msg });
              return EMPTY;
            })
          )
        )
      )
    ),

    deleteCategory: rxMethod<{ id: string; onSuccess?: () => void; onError?: (msg: string) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap(({ id, onSuccess, onError }) =>
          api.delete(id).pipe(
            tap(() => {
              patchState(store, { isLoading: false });
              if (onSuccess) onSuccess();
            }),
            switchMap(() => api.getAll()),
            tap((categories) => {
              patchState(store, { categories, isLoading: false });
            }),
            catchError((err) => {
              const msg = err?.error?.detail || err.message || 'Failed to delete category';
              patchState(store, { isLoading: false, error: msg });
              if (onError) onError(msg);
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
