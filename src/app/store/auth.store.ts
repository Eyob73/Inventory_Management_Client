import { computed, inject } from '@angular/core';
import {
  signalStore,
  withComputed,
  withMethods,
  patchState,
  withState,
  withHooks,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, of, switchMap, exhaustMap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { User, LoginCredentials, RegisterCredentials } from '../models/auth.model';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    currentUser: computed(() => store.user()),
    userRole: computed(() => {
      const u = store.user();
      if (!u) return 'Guest';
      const r = u.roles;
      if (Array.isArray(r)) return r[0] ?? 'Guest';
      return r ?? 'Guest';
    }),
    isLoggedIn: computed(() => store.isAuthenticated()),
  })),
  withMethods((store, authService = inject(AuthService), router = inject(Router)) => ({
    checkAuth: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          if (localStorage.getItem('logged_out') === 'true') {
            patchState(store, {
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return of(null);
          }
          return authService.getCurrentUser().pipe(
            tap((user) => {
              if (user) {
                patchState(store, {
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                });
                if (router.url.includes('/login')) {
                  router.navigate(['/dashboard']);
                }
              } else {
                patchState(store, {
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              }
            }),
            catchError(() => {
              patchState(store, {
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return EMPTY;
            })
          );
        })
      )
    ),

    login: rxMethod<LoginCredentials>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        tap(() => localStorage.removeItem('logged_out')),
        exhaustMap((credentials) =>
          authService.login(credentials).pipe(
            switchMap(() =>
              authService.getCurrentUser().pipe(
                tap((user) => {
                  if (user) {
                    patchState(store, {
                      user,
                      isAuthenticated: true,
                      isLoading: false,
                      error: null,
                    });
                    router.navigate(['/dashboard']);
                  } else {
                    patchState(store, {
                      user: null,
                      isAuthenticated: false,
                      isLoading: false,
                      error: 'Login succeeded, but user profile could not be loaded.',
                    });
                  }
                })
              )
            ),
            catchError((err) => {
              patchState(store, {
                isLoading: false,
                error: err?.error?.message || err?.message || 'Login failed',
              });
              return EMPTY;
            })
          )
        )
      )
    ),

    register: rxMethod<RegisterCredentials>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap((credentials) =>
          authService.register(credentials).pipe(
            tap(() => {
              patchState(store, { isLoading: false, error: null });
            }),
            catchError((err) => {
              patchState(store, {
                isLoading: false,
                error: err?.error?.message || err?.message || 'Registration failed',
              });
              return EMPTY;
            })
          )
        )
      )
    ),

    logout: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap(() =>
          authService.logout().pipe(
            tap(() => {
              localStorage.setItem('logged_out', 'true');
              patchState(store, {
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
              router.navigate(['/login']);
            }),
            catchError(() => {
              localStorage.setItem('logged_out', 'true');
              patchState(store, {
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
              router.navigate(['/login']);
              return EMPTY;
            })
          )
        )
      )
    ),

    clearError(): void {
      patchState(store, { error: null });
    },
  })),
  withHooks({
    onInit(store) {
      store.checkAuth();
    },
  })
);
