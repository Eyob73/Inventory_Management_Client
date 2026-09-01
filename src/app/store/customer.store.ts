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
import { CustomerService, Customer, CreateCustomerDto, UpdateCustomerDto } from '../services/customer.service';

interface CustomerState {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  search: string;
  pageIndex: number;
  pageSize: number;
}

export const CustomerStore = signalStore(
  { providedIn: 'root' },
  withState<CustomerState>({
    customers: [],
    isLoading: false,
    error: null,
    search: '',
    pageIndex: 1,
    pageSize: 10,
  }),
  withComputed((store) => {
    const filteredCustomers = computed(() => {
      const all = store.customers();
      const term = store.search().toLowerCase().trim();
      if (!term) return all;
      return all.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.phoneNumber && c.phoneNumber.toLowerCase().includes(term)) ||
          (c.email && c.email.toLowerCase().includes(term)) ||
          (c.address && c.address.toLowerCase().includes(term))
      );
    });

    const paginatedCustomers = computed(() => {
      const list = filteredCustomers();
      const startIndex = (store.pageIndex() - 1) * store.pageSize();
      return list.slice(startIndex, startIndex + store.pageSize());
    });

    const stats = computed(() => {
      const all = store.customers();
      return {
        total: all.length,
        active: all.filter((c) => c.isActive !== false).length,
        inactive: all.filter((c) => c.isActive === false).length,
        totalSales: all.reduce((sum, c) => sum + (c.totalSalesCount || 0), 0),
        totalSpent: all.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
      };
    });

    return {
      filteredCustomers,
      paginatedCustomers,
      totalCount: computed(() => filteredCustomers().length),
      stats,
    };
  }),
  withMethods((store, api = inject(CustomerService)) => ({
    setSearch(search: string) {
      patchState(store, { search, pageIndex: 1 });
    },

    setPage(pageIndex: number, pageSize?: number) {
      patchState(store, {
        pageIndex,
        ...(pageSize ? { pageSize } : {}),
      });
    },

    loadCustomers: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          api.getAll().pipe(
            tap((customers) => {
              patchState(store, {
                customers,
                isLoading: false,
              });
            }),
            catchError((err) => {
              const msg = typeof err?.error === 'string' ? err.error : (err?.error?.detail || err.message || 'Failed to load customers');
              patchState(store, { isLoading: false, error: msg });
              return EMPTY;
            })
          )
        )
      )
    ),

    createCustomer: rxMethod<{ dto: CreateCustomerDto; onSuccess?: (newCust?: Customer) => void; onError?: (msg: string) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap(({ dto, onSuccess, onError }) =>
          api.create(dto).pipe(
            tap((created) => {
              patchState(store, { isLoading: false });
              if (onSuccess) onSuccess(created);
            }),
            switchMap(() => api.getAll()),
            tap((customers) => {
              patchState(store, { customers, isLoading: false });
            }),
            catchError((err) => {
              const msg = typeof err?.error === 'string' ? err.error : (err?.error?.detail || err.message || 'Failed to create customer');
              patchState(store, { isLoading: false, error: msg });
              if (onError) onError(msg);
              return EMPTY;
            })
          )
        )
      )
    ),

    updateCustomer: rxMethod<{ id: string; dto: UpdateCustomerDto; onSuccess?: () => void; onError?: (msg: string) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap(({ id, dto, onSuccess, onError }) =>
          api.update(id, dto).pipe(
            tap(() => {
              patchState(store, { isLoading: false });
              if (onSuccess) onSuccess();
            }),
            switchMap(() => api.getAll()),
            tap((customers) => {
              patchState(store, { customers, isLoading: false });
            }),
            catchError((err) => {
              const msg = typeof err?.error === 'string' ? err.error : (err?.error?.detail || err.message || 'Failed to update customer');
              patchState(store, { isLoading: false, error: msg });
              if (onError) onError(msg);
              return EMPTY;
            })
          )
        )
      )
    ),

    deleteCustomer: rxMethod<{ id: string; onSuccess?: () => void; onError?: (msg: string) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap(({ id, onSuccess, onError }) =>
          api.delete(id).pipe(
            tap(() => {
              patchState(store, { isLoading: false });
              if (onSuccess) onSuccess();
            }),
            switchMap(() => api.getAll()),
            tap((customers) => {
              patchState(store, { customers, isLoading: false });
            }),
            catchError((err) => {
              const msg = typeof err?.error === 'string' ? err.error : (err?.error?.detail || err.message || 'Failed to delete customer');
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
