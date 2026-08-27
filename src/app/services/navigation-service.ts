import { Injectable } from '@angular/core';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[]; // undefined = all roles
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  roles?: string[]; // undefined = all roles
}

const ALL_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { label: 'Products', path: '/products', icon: 'inventory_2' },
      { label: 'Categories', path: '/categories', icon: 'category', roles: ['Admin', 'Manager'] },
      { label: 'Inventory', path: '/inventory', icon: 'tune', roles: ['Admin', 'Manager'] },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { label: 'Sales', path: '/sales', icon: 'point_of_sale' },
      { label: 'Customers', path: '/customers', icon: 'people' },
      { label: 'Suppliers', path: '/suppliers', icon: 'local_shipping', roles: ['Admin', 'Manager'] },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Reports', path: '/reports', icon: 'bar_chart', roles: ['Admin', 'Manager'] },
    ],
  },
  {
    label: 'Administration',
    roles: ['Admin', 'Manager', 'Sales'],
    items: [
      { label: 'Users', path: '/users', icon: 'manage_accounts', roles: ['Admin'] },
      { label: 'Settings', path: '/settings', icon: 'settings', roles: ['Admin', 'Manager', 'Sales'] },
    ],
  },
];

const routeTitleMap: Record<string, string> = {
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
  '/users': 'User Management',
  '/profile': 'My Profile',
  '/unauthorized': 'Access Denied',
};

@Injectable({ providedIn: 'root' })
export class NavigationService {

  /**
   * Returns nav groups filtered to only items visible for the given role.
   * Pass role = 'Admin' | 'Manager' | 'Sales' (case-sensitive as returned by the API).
   */
  getNavGroups(role?: string): NavGroup[] {
    const normalizedRole = role ?? '';

    return ALL_NAV_GROUPS
      .filter((group) => {
        // Filter out entire groups if role-restricted and user doesn't qualify
        if (!group.roles) return true;
        return group.roles.some((r) => r.toLowerCase() === normalizedRole.toLowerCase());
      })
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!item.roles) return true;
          return item.roles.some((r) => r.toLowerCase() === normalizedRole.toLowerCase());
        }),
      }))
      .filter((group) => group.items.length > 0);
  }

  getTitleForUrl(url: string): string {
    return routeTitleMap[url] || this.formatTitle(url);
  }

  private formatTitle(url: string): string {
    const segment = url.split('/').filter(Boolean).pop() || 'Dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
  }
}