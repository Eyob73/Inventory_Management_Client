import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../services/auth';
import { AuthStore } from '../store/auth.store';

export const roleGuard = (requiredRole: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const store = inject(AuthStore);
    const router = inject(Router);

    const evaluateRole = () => {
      if (auth.hasRole(requiredRole)) {
        return true;
      }
      return router.createUrlTree(['/unauthorized']);
    };

    if (store.isLoading()) {
      return toObservable(store.isLoading).pipe(
        filter((isLoading) => !isLoading),
        map(() => evaluateRole())
      );
    }

    return evaluateRole();
  };
};
