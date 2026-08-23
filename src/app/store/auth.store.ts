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
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { User, LoginCredentials, RegisterCredentials } from '../models/auth.model';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    currentUser: computed(() => store.user()),
    userRole: computed(() => store.user()?.role ?? 'Guest'),
    isLoggedIn: computed(() => store.isAuthenticated()),
  })),
  withMethods((store, authService = inject(AuthService), router = inject(Router)) => ({
    login: rxMethod<LoginCredentials>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap((credentials) =>
          authService.login(credentials).pipe(
            tap((response) => {
              if (response.token) {
                localStorage.setItem('auth_token', response.token);
              }
              patchState(store, {
                user: response.user,
                token: response.token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              router.navigate(['/dashboard']);
            }),
            catchError((err) => {
              patchState(store, {
                isLoading: false,
                error: err.message || 'Login failed',
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
            catchError((err) => {
              patchState(store, {
                isLoading: false,
                error: err.message || 'Registration failed',
              });
              return EMPTY;
            })
          )
        )
      )
    ),

    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);
