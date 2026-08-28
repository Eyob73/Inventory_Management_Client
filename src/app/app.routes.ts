import { Routes } from '@angular/router';
import { roleGuard, authGuard } from './guards/role.guard';

export const routes: Routes = [
  // ── Public ──────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/auth/unauthorized/unauthorized').then((m) => m.UnauthorizedComponent),
  },

  // ── Authenticated Shell (requires any logged-in user) ───────────
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // ── All roles ────────────────────────────────────────────────
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/products').then((m) => m.Products),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./features/add-products/add-products').then((m) => m.AddProducts),
        canActivate: [roleGuard(['Admin', 'Manager'])],
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/products/product-details-page/product-details-page').then(
            (m) => m.ProductDetailsPage
          ),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },
      {
        path: 'sales',
        loadComponent: () => import('./features/sales/sales').then((m) => m.Sales),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customers').then((m) => m.Customers),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then((m) => m.ProfileComponent),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },

      // ── Admin + Manager only ─────────────────────────────────────
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories').then((m) => m.Categories),
        canActivate: [roleGuard(['Admin', 'Manager'])],
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory').then((m) => m.Inventory),
        canActivate: [roleGuard(['Admin', 'Manager'])],
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./features/suppliers/suppliers').then((m) => m.Suppliers),
        canActivate: [roleGuard(['Admin', 'Manager'])],
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
        canActivate: [roleGuard(['Admin', 'Manager'])],
      },

      // ── Admin only ───────────────────────────────────────────────
      {
        path: 'add-products',
        loadComponent: () =>
          import('./features/add-products/add-products').then((m) => m.AddProducts),
        canActivate: [roleGuard(['Admin', 'Manager'])],
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users').then((m) => m.UsersComponent),
        canActivate: [roleGuard('Admin')],
      },
      {
        path: 'users/edit/:id',
        loadComponent: () =>
          import('./features/users/edit-user/edit-user').then((m) => m.EditUserComponent),
        canActivate: [roleGuard('Admin')],
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsComponent),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },
      {
        path: 'purchases',
        loadComponent: () => import('./features/purchases/purchases').then((m) => m.Purchases),
        canActivate: [roleGuard(['Admin', 'Manager'])],
      },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────────────
  { path: '**', redirectTo: 'dashboard' },
];
