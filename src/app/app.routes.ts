import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { roleGuard, authGuard } from './guards/role.guard';
import { AuthStore } from './store/auth.store';

export const routes: Routes = [
  // ── Public ──────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then((m) => m.ResetPasswordComponent),
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
      { 
        path: '', 
        pathMatch: 'full',
        redirectTo: () => {
          const store = inject(AuthStore);
          const role = store.userRole();
          return role?.toLowerCase() === 'systemadmin' ? 'system-admin/dashboard' : 'dashboard';
        }
      },

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
        path: 'pos',
        loadComponent: () => import('./features/pos/pos').then((m) => m.PosComponent),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },
      {
        path: 'sales-history',
        loadComponent: () =>
          import('./features/sales-history/sales-history').then((m) => m.SalesHistoryComponent),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },
      {
        path: 'sales-history/:id',
        loadComponent: () =>
          import('./features/sales-history/sales-history').then((m) => m.SalesHistoryComponent),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },
      {
        path: 'sales',
        redirectTo: 'pos',
        pathMatch: 'full'
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customers').then((m) => m.Customers),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then((m) => m.ProfileComponent),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales', 'SystemAdmin'])],
      },

      // ── Admin + Manager only ─────────────────────────────────────
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories').then((m) => m.Categories),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory').then((m) => m.Inventory),
        canActivate: [roleGuard(['Admin', 'Manager'])],
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./features/suppliers/suppliers').then((m) => m.Suppliers),
        canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
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
        path: 'users/add',
        loadComponent: () =>
          import('./features/users/add-user/add-user').then((m) => m.AddUserComponent),
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
      {
        path: 'purchases/new',
        loadComponent: () =>
          import('./features/purchases/purchase-form/purchase-form').then((m) => m.PurchaseFormComponent),
        canActivate: [roleGuard(['Admin', 'Manager'])],
      },
      {
        path: 'purchases/:id/edit',
        loadComponent: () =>
          import('./features/purchases/purchase-form/purchase-form').then((m) => m.PurchaseFormComponent),
        canActivate: [roleGuard(['Admin', 'Manager'])],
      },
      {
        path: 'purchases/:id',
        loadComponent: () =>
          import('./features/purchases/purchase-details/purchase-details').then(
            (m) => m.PurchaseDetailsComponent
          ),
        canActivate: [roleGuard(['Admin', 'Manager'])],
      },

      
      // ── Bottles ──────────────────────────────────────────────────
      {
        path: 'bottles',
        loadChildren: () => import('./features/bottles/bottles.routes').then((m) => m.BOTTLE_ROUTES),
      },

      // ── System Admin only ────────────────────────────────────────
      {
        path: 'system-admin/dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        canActivate: [roleGuard('SystemAdmin')],
      },
      {
        path: 'system-admin/companies',
        loadComponent: () => import('./features/system-admin/companies/companies').then((m) => m.Companies),
        canActivate: [roleGuard('SystemAdmin')],
      },
      {
        path: 'system-admin/companies/new',
        loadComponent: () => import('./features/system-admin/add-company/add-company').then((m) => m.AddCompanyComponent),
        canActivate: [roleGuard('SystemAdmin')],
      },
      {
        path: 'system-admin/companies/:id/users',
        loadComponent: () => import('./features/system-admin/company-users/company-users').then((m) => m.CompanyUsersComponent),
        canActivate: [roleGuard('SystemAdmin')],
      },
      {
        path: 'system-admin/companies/:id',
        loadComponent: () => import('./features/system-admin/company-details/company-details').then((m) => m.CompanyDetailsComponent),
        canActivate: [roleGuard('SystemAdmin')],
      },
      {
        path: 'system-admin/users',
        loadComponent: () => import('./features/system-admin/users/users').then((m) => m.SystemUsersComponent),
        canActivate: [roleGuard('SystemAdmin')],
      },
      {
        path: 'system-admin/activity',
        loadComponent: () => import('./features/system-admin/activity/activity').then((m) => m.SystemActivityComponent),
        canActivate: [roleGuard('SystemAdmin')],
      },
      {
        path: 'system-admin/settings',
        loadComponent: () => import('./features/system-admin/settings/settings').then((m) => m.SystemSettingsComponent),
        canActivate: [roleGuard('SystemAdmin')],
      },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────────────
  { path: '**', redirectTo: 'dashboard' },
];

