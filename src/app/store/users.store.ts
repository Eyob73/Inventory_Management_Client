import { computed, inject } from '@angular/core';
import {
    signalStore,
    withComputed,
    withMethods,
    patchState,
    withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, switchMap } from 'rxjs';
import { UserService, SystemUser } from '../services/user.service';

interface UserState {
    users: SystemUser[];
    isLoading: boolean;
    error: string | null;
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    search: string;
}

export const UserStore = signalStore(
    { providedIn: 'root' },
    withState<UserState>({
        users: [],
        isLoading: false,
        error: null,
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
        search: '',
    }),
    withComputed((store) => ({
        stats: computed(() => {
            const all = store.users();
            return {
                total: store.totalCount(),
                active: all.filter((u) => u.isActive).length,
                admin: all.filter((u) => u.roles.includes('Admin')).length,
                manager: all.filter((u) => u.roles.includes('Manager')).length,
                sales: all.filter((u) => u.roles.includes('Sales') || u.roles.includes('User')).length,
            };
        }),
    })),
    withMethods((store, api = inject(UserService)) => ({
        loadUsers: rxMethod<{ page?: number; pageSize?: number; search?: string } | void>(
            pipe(
                tap(() => patchState(store, { isLoading: true, error: null })),
                switchMap((params) => {
                    const p = params || {};
                    const page = p.page ?? store.page();
                    const pageSize = p.pageSize ?? store.pageSize();
                    const search = p.search ?? store.search();

                    return api.getPagedUsers(page, pageSize, search || undefined).pipe(
                        tap((res) => {
                            patchState(store, {
                                users: res.items,
                                isLoading: false,
                                totalCount: res.totalCount,
                                page: res.page,
                                pageSize: res.pageSize,
                                totalPages: res.totalPages,
                                hasPrevious: res.hasPrevious,
                                hasNext: res.hasNext,
                                search,
                            });
                        }),
                        catchError((err) => {
                            patchState(store, {
                                isLoading: false,
                                error: err?.error?.detail || err.message || 'Failed to load users',
                            });
                            return EMPTY;
                        })
                    );
                })
            )
        ),
    }))
);
