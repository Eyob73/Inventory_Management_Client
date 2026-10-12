import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { ConnectionService } from '../services/connection.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const connectionService = inject(ConnectionService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Check for network connection drops or server unreachable (status 0, timeout, or 502/503/504)
      if (err.status === 0 || err.status === 408 || err.status === 502 || err.status === 503 || err.status === 504) {
        connectionService.reportHttpError(err.status, req.url, err.message);
        const networkMessage = err.status === 0
          ? 'Network connection error or server unreachable. Please verify your connection.'
          : 'The server is temporarily unavailable. Please try again in a few moments.';
        return throwError(() => new Error(networkMessage));
      }

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
        let extractedMessage = detailMessage;
        if (err.status === 400) {
          if (typeof err.error === 'string') {
            extractedMessage = err.error;
          } else if (err.error?.errors) {
            extractedMessage = Object.values(err.error.errors).flat().join(', ');
          } else if (err.error?.title) {
            extractedMessage = err.error.title;
          }
        }
        
        console.error('API Error Response:', extractedMessage);
        const customErr = new Error(extractedMessage);
        return throwError(() => customErr);
      }
    }),
  );
};
