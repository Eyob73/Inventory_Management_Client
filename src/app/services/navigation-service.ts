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
      { label: 'Categories', path: '/categories', icon: 'category', roles: ['Admin', 'Manager', 'Sales'] },
      { label: 'Inventory', path: '/inventory', icon: 'tune', roles: ['Admin', 'Manager'] },
    ],
  },
  {
    label: 'Bottle Management',
          items: [
        { label: 'Bottle Dashboard', path: '/bottles/dashboard', icon: 'speed' },
        { label: 'Bottle Types', path: '/bottles/types', icon: 'local_drink' },
        { label: 'Bottle Inventory', path: '/bottles/inventory', icon: 'inventory' },
        { label: 'Customer Bottles', path: '/bottles/customers', icon: 'people' },
        { label: 'Bottle Transactions', path: '/bottles/transactions', icon: 'sync_alt' },
        { label: 'Bottle Reports', path: '/bottles/reports', icon: 'bar_chart' },
        { label: 'Bottle Settings', path: '/bottles/settings', icon: 'settings' },
      ],
  },

  {
    label: 'Transactions',
    items: [
      { label: 'POS Terminal', path: '/pos', icon: 'storefront' },
      { label: 'Sales History', path: '/sales-history', icon: 'receipt_long' },
      { label: 'Customers', path: '/customers', icon: 'people' },
      { label: 'Suppliers', path: '/suppliers', icon: 'local_shipping', roles: ['Admin', 'Manager', 'Sales'] },
      { label: 'Purchases', path: '/purchases', icon: 'local_mall', roles: ['Admin', 'Manager'] },
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
  {
    label: 'System Admin',
    roles: ['SystemAdmin'],
    items: [
      { label: 'Dashboard', path: '/system-admin/dashboard', icon: 'dashboard', roles: ['SystemAdmin'] },
      { label: 'Companies', path: '/system-admin/companies', icon: 'business', roles: ['SystemAdmin'] },
      { label: 'Users', path: '/system-admin/users', icon: 'manage_accounts', roles: ['SystemAdmin'] },
      { label: 'Activity', path: '/system-admin/activity', icon: 'local_activity', roles: ['SystemAdmin'] },
      { label: 'Settings', path: '/system-admin/settings', icon: 'settings', roles: ['SystemAdmin'] },
    ],
  },
];

const routeTitleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
    '/bottles/dashboard': 'Bottle Dashboard',
  '/bottles/types': 'Bottle Types',
  '/bottles/inventory': 'Bottle Inventory',
  '/bottles/customers': 'Customer Bottles',
  '/bottles/transactions': 'Bottle Transactions',
  '/bottles/reports': 'Bottle Reports',
  '/bottles/settings': 'Bottle Settings',
  '/products': 'Products',
  '/add-products': 'Add Product',
  '/categories': 'Categories',
  '/inventory': 'Inventory',
  '/pos': 'POS Terminal',
  '/sales-history': 'Sales History',
  '/sales': 'POS Terminal',
  '/purchases': 'Purchases',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/users': 'User Management',
  '/profile': 'My Profile',
  '/unauthorized': 'Access Denied',
  '/system-admin/dashboard': 'System Dashboard',
  '/system-admin/companies': 'Companies',
  '/system-admin/companies/new': 'Add Company',
  '/system-admin/users': 'System Users',
  '/system-admin/activity': 'System Activity',
  '/system-admin/settings': 'System Settings',
};

@Injectable({ providedIn: 'root' })
export class NavigationService {

  /**
   * Returns nav groups filtered to only items visible for the given role.
   * Pass role = 'Admin' | 'Manager' | 'Sales' (case-sensitive as returned by the API).
   */
  getNavGroups(role?: string): NavGroup[] {
    const normalizedRole = role?.toLowerCase() ?? '';

    return ALL_NAV_GROUPS
      .filter((group) => {
        if (!group.roles) {
           return normalizedRole !== 'systemadmin';
        }
        return group.roles.some((r) => r.toLowerCase() === normalizedRole);
      })
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!item.roles) {
            return normalizedRole !== 'systemadmin';
          }
          return item.roles.some((r) => r.toLowerCase() === normalizedRole);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }

  getTitleForUrl(url: string): string {
    const path = url.split('?')[0];
    if (routeTitleMap[path]) return routeTitleMap[path];
    if (/^\/products\/[^/]+\/edit$/.test(path)) return 'Edit Product';
    if (/^\/products\/[^/]+$/.test(path)) return 'Product Details';
    if (path === '/purchases/new') return 'New Purchase';
    if (/^\/purchases\/[^/]+\/edit$/.test(path)) return 'Edit Purchase';
    if (/^\/purchases\/[^/]+$/.test(path)) return 'Purchase Details';
    if (/^\/system-admin\/companies\/new$/.test(path)) return 'Add Company';
    if (/^\/system-admin\/companies\/[^/]+\/users$/.test(path)) return 'Company Users';
    if (/^\/system-admin\/companies\/[^/]+$/.test(path)) return 'Company Details';
    return this.formatTitle(url);
  }

  private formatTitle(url: string): string {
    const segment = url.split('/').filter(Boolean).pop() || 'Dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
  }
}
