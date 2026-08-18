import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login/login').then(
                (m) => m.LoginComponent,
            ),
    },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: '',
        loadComponent: () =>
            import('./layout/shell/shell').then((m) => m.Shell),
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./features/dashboard/dashboard').then(
                        (m) => m.Dashboard,
                    ),
            },
            {
                path: 'products',
                loadComponent: () =>
                    import('./features/products/products').then(
                        (m) => m.Products,
                    ),
            },
            {
                path: 'add-products',
                loadComponent: () =>
                    import('./features/add-products/add-products').then(
                        (m) => m.AddProducts,
                    ),
            },
            {
                path: 'categories',
                loadComponent: () =>
                    import('./features/categories/categories').then(
                        (m) => m.Categories,
                    ),
            },
            {
                path: 'inventory',
                loadComponent: () =>
                    import('./features/inventory/inventory').then(
                        (m) => m.Inventory,
                    ),
            },
            {
                path: 'sales',
                loadComponent: () =>
                    import('./features/sales/sales').then(
                        (m) => m.Sales,
                    ),
            },
            {
                path: 'purchases',
                loadComponent: () =>
                    import('./features/purchases/purchases').then(
                        (m) => m.Purchases,
                    ),
            },
            {
                path: 'customers',
                loadComponent: () =>
                    import('./features/customers/customers').then(
                        (m) => m.Customers,
                    ),
            },
            {
                path: 'suppliers',
                loadComponent: () =>
                    import('./features/suppliers/suppliers').then(
                        (m) => m.Suppliers,
                    ),
            },
            {
                path: 'reports',
                loadComponent: () =>
                    import('./features/reports/reports').then(
                        (m) => m.Reports,
                    ),
            },
        ],
    },
];
