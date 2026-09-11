import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const detailMessage = err.error?.detail ?? err.error?.message ?? 'A system error occurred. Please try again.';
      
      if (err.status === 401) {
        // Don't intercept login or refresh requests
        if (req.url.toLowerCase().includes('/auth/login') || req.url.toLowerCase().includes('/auth/refresh')) {
          authService.removeToken();
          authService.currentUser.set(null);
          router.navigate(['/login']);
          return throwError(() => err);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refresh().pipe(
            switchMap((res) => {
              isRefreshing = false;
              const newToken = res.accessToken || res.token;
              refreshTokenSubject.next(newToken!);
              return next(req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              }));
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              authService.removeToken();
              authService.currentUser.set(null);
              router.navigate(['/login']);
              return throwError(() => refreshErr);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap((token) => {
              return next(req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
              }));
            })
          );
        }
      } else {
        console.error('API Error Response:', detailMessage);
      }
      return throwError(() => err);
    }),
  );
};
