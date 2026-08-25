import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthStore } from '../store/auth.store';

/**
 * Role guard factory. Accepts a single role string or an array of allowed roles.
 * Admin users always have access (admin is super-role).
 * Redirects to /unauthorized when access is denied.
 *
 * Usage:
 *   canActivate: [roleGuard('Admin')]
 *   canActivate: [roleGuard(['Admin', 'Manager'])]
 */
export const roleGuard = (allowedRoles: string | string[]): CanActivateFn => {
  return () => {
    const store = inject(AuthStore);
    const router = inject(Router);

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    const evaluateRole = () => {
      const userRole = store.userRole();
      if (!userRole || userRole === 'Guest') {
        return router.createUrlTree(['/login']);
      }

      const normalizedUserRole = userRole.toLowerCase();
      // Admin always has full access
      if (normalizedUserRole === 'admin' || normalizedUserRole === 'administrator') {
        return true;
      }

      const allowed = roles.some((r) => r.toLowerCase() === normalizedUserRole);
      if (allowed) return true;

      return router.createUrlTree(['/unauthorized']);
    };

    // Wait for auth loading to finish before evaluating
    if (store.isLoading()) {
      return toObservable(store.isLoading).pipe(
        filter((isLoading) => !isLoading),
        map(() => evaluateRole())
      );
    }

    return evaluateRole();
  };
};

/**
 * Auth guard — requires any authenticated user (used for the main shell layout).
 */
export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  const evaluate = () => {
    if (store.isLoggedIn()) return true;
    return router.createUrlTree(['/login']);
  };

  if (store.isLoading()) {
    return toObservable(store.isLoading).pipe(
      filter((isLoading) => !isLoading),
      map(() => evaluate())
    );
  }

  return evaluate();
};
