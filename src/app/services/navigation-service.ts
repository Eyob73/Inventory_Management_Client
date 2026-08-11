import { Injectable, signal } from '@angular/core';

export interface NavItem {
    label: string;
    path: string;
    icon: string;
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private navGroups: NavGroup[] = [
        {
            label: 'Main',
            items: [
                { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
                { label: 'Products', path: '/products', icon: 'inventory_2' },
                { label: 'Categories', path: '/categories', icon: 'category' },
                { label: 'Inventory', path: '/inventory', icon: 'tune' },
            ],
        },
        {
            label: 'Transactions',
            items: [
                { label: 'Sales', path: '/sales', icon: 'point_of_sale' },
                { label: 'Purchases', path: '/purchases', icon: 'shopping_cart' },
                { label: 'Customers', path: '/customers', icon: 'people' },
                { label: 'Suppliers', path: '/suppliers', icon: 'local_shipping' },
            ],
        },
        {
            label: 'Analytics',
            items: [{ label: 'Reports', path: '/reports', icon: 'bar_chart' }],
        },
        {
            label: 'System',
            items: [{ label: 'Settings', path: '/settings', icon: 'settings' }],
        },
    ];

    private routeTitleMap: Record<string, string> = {
        '/dashboard': 'Dashboard',
        '/products': 'Products',
        '/add-products': 'Add Product',
        '/categories': 'Categories',
        '/inventory': 'Inventory',
        '/sales': 'Sales',
        '/purchases': 'Purchases',
        '/customers': 'Customers',
        '/suppliers': 'Suppliers',
        '/reports': 'Reports',
        '/settings': 'Settings',
    };

    getNavGroups() {
        return this.navGroups;
    }

    getTitleForUrl(url: string): string {
        return this.routeTitleMap[url] || this.formatTitle(url);
    }

    private formatTitle(url: string): string {
        const segment = url.split('/').filter(Boolean).pop() || 'Dashboard';
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
}