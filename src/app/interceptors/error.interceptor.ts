import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, catchError, filter, switchMap, take, throwError, finalize, shareReplay } from 'rxjs';
import { AuthService } from '../services/auth';
import { ConnectionService } from '../services/connection.service';

let refreshObservable: Observable<string> | null = null;

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
        // Do not intercept login requests — let login component handle credential errors
        if (req.url.toLowerCase().includes('/auth/login')) {
          return throwError(() => err);
        }

        // If refresh itself failed with 401/403, session cannot be renewed
        if (req.url.toLowerCase().includes('/auth/refresh')) {
          authService.removeTokens();
          authService.currentUser.set(null);
          const currentUrl = router.url;
          if (currentUrl && !currentUrl.includes('/login')) {
            router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
          } else {
            router.navigate(['/login']);
          }
          return throwError(() => err);
        }

        // Concurrency-safe token renewal: all concurrent 401s share the same in-flight refresh observable
        if (!refreshObservable) {
          refreshObservable = authService.refresh().pipe(
            switchMap((res) => {
              const newToken = res.accessToken || res.token;
              if (!newToken) {
                return throwError(() => new Error('No access token received from refresh'));
              }
              return of(newToken);
            }),
            catchError((refreshErr) => {
              // Do not log out on temporary network failure during refresh
              if (
                refreshErr.status === 0 ||
                refreshErr.status === 408 ||
                (refreshErr.status >= 502 && refreshErr.status <= 504)
              ) {
                connectionService.reportHttpError(refreshErr.status, req.url, refreshErr.message);
                return throwError(() => refreshErr);
              }

              // Genuine auth rejection (401/403/invalid refresh token): logout and redirect
              authService.removeTokens();
              authService.currentUser.set(null);
              const currentUrl = router.url;
              if (currentUrl && !currentUrl.includes('/login')) {
                router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
              } else {
                router.navigate(['/login']);
              }
              return throwError(() => refreshErr);
            }),
            finalize(() => {
              refreshObservable = null;
            }),
            shareReplay({ bufferSize: 1, refCount: false })
          );
        }

        return refreshObservable.pipe(
          take(1),
          switchMap((newToken) => {
            return next(req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            }));
          })
        );
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
