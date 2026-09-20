import { TranslocoModule } from '@jsverse/transloco';
import { Routes } from '@angular/router';
import { roleGuard } from '../../guards/role.guard';

export const BOTTLE_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./bottle-dashboard/bottle-dashboard').then(m => m.BottleDashboardComponent),
    canActivate: [roleGuard(['Admin', 'Manager'])],
  },
  {
    path: 'types',
    loadComponent: () => import('./bottle-types/bottle-types').then(m => m.BottleTypesComponent),
    canActivate: [roleGuard(['Admin', 'Manager'])],
  },
  {
    path: 'inventory',
    loadComponent: () => import('./bottle-inventory/bottle-inventory').then(m => m.BottleInventoryComponent),
    canActivate: [roleGuard(['Admin', 'Manager'])],
  },
  {
    path: 'customers',
    loadComponent: () => import('./customer-bottles/customer-bottles').then(m => m.CustomerBottlesComponent),
    canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
  },
  {
    path: 'transactions',
    loadComponent: () => import('./bottle-transactions/bottle-transactions').then(m => m.BottleTransactionsComponent),
    canActivate: [roleGuard(['Admin', 'Manager', 'Sales'])],
  },
  {
    path: 'reports',
    loadComponent: () => import('./bottle-reports/bottle-reports').then(m => m.BottleReportsComponent),
    canActivate: [roleGuard(['Admin', 'Manager'])],
  },
  {
    path: 'settings',
    loadComponent: () => import('./bottle-settings/bottle-settings').then(m => m.BottleSettingsComponent),
    canActivate: [roleGuard(['Admin', 'Manager'])],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

