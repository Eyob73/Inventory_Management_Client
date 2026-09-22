import { Injectable, inject } from '@angular/core';
import { TenantApiService } from './tenant';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[]; // undefined = all roles
  description?: string;
  keywords?: string[];
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
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', description: 'Main overview and analytics', keywords: ['home', 'start', 'overview'] },
      { label: 'Products', path: '/products', icon: 'inventory_2', description: 'Manage inventory products', keywords: ['items', 'stock', 'goods'] },
      { label: 'Categories', path: '/categories', icon: 'category', roles: ['Admin', 'Manager', 'Sales'], description: 'Product categories and classification', keywords: ['types', 'groups', 'classification'] },
      { label: 'Inventory', path: '/inventory', icon: 'tune', roles: ['Admin', 'Manager'], description: 'Stock levels and inventory adjustments', keywords: ['stock', 'levels', 'adjust'] },
    ],
  },
  {
    label: 'Bottle Management',
    roles: ['Admin', 'Manager', 'Sales'],
    items: [
      { label: 'Bottle Dashboard', path: '/bottles/dashboard', icon: 'speed', roles: ['Admin', 'Manager'], description: 'Bottle returns and overview', keywords: ['empty', 'returns', 'overview'] },
      { label: 'Bottle Types', path: '/bottles/types', icon: 'local_drink', roles: ['Admin', 'Manager'], description: 'Manage bottle sizes and types', keywords: ['sizes', 'crates', 'glass'] },
      { label: 'Bottle Inventory', path: '/bottles/inventory', icon: 'inventory', roles: ['Admin', 'Manager'], description: 'Bottle stock and tracking', keywords: ['stock', 'count'] },
      { label: 'Customer Bottles', path: '/bottles/customers', icon: 'people', roles: ['Admin', 'Manager', 'Sales'], description: 'Bottles currently with customers', keywords: ['held', 'pending', 'returns'] },
      { label: 'Bottle Transactions', path: '/bottles/transactions', icon: 'sync_alt', roles: ['Admin', 'Manager', 'Sales'], description: 'History of bottle movements', keywords: ['history', 'movements', 'logs'] },
      { label: 'Bottle Reports', path: '/bottles/reports', icon: 'bar_chart', roles: ['Admin', 'Manager'], description: 'Analytics for bottle returns', keywords: ['charts', 'analytics'] },
      { label: 'Bottle Settings', path: '/bottles/settings', icon: 'settings', roles: ['Admin', 'Manager'], description: 'Bottle configuration, pricing, and rules', keywords: ['config', 'configuration', 'setup', 'deposit', 'policy'] },
    ],
  },

  {
    label: 'Transactions',
    items: [
      { label: 'POS Terminal', path: '/pos', icon: 'storefront', description: 'Point of Sale terminal for making sales', keywords: ['sell', 'cash register', 'checkout', 'till'] },
      { label: 'Sales History', path: '/sales-history', icon: 'receipt_long', description: 'Past sales and receipts', keywords: ['receipts', 'past', 'history'] },
      { label: 'Customers', path: '/customers', icon: 'people', description: 'Manage customer accounts', keywords: ['clients', 'buyers', 'accounts'] },
      { label: 'Suppliers', path: '/suppliers', icon: 'local_shipping', roles: ['Admin', 'Manager', 'Sales'], description: 'Manage vendors and suppliers', keywords: ['vendors', 'distributors'] },
      { label: 'Purchases', path: '/purchases', icon: 'local_mall', roles: ['Admin', 'Manager'], description: 'Incoming stock and purchase orders', keywords: ['buy', 'restock', 'orders', 'stock in'] },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Reports', path: '/reports', icon: 'bar_chart', roles: ['Admin', 'Manager'], description: 'Sales and inventory reports', keywords: ['analytics', 'charts', 'graphs', 'statistics'] },
    ],
  },
  {
    label: 'Administration',
    roles: ['Admin', 'Manager', 'Sales'],
    items: [
      { label: 'Users', path: '/users', icon: 'manage_accounts', roles: ['Admin'], description: 'Manage system users and access', keywords: ['employees', 'staff', 'access', 'roles'] },
      { label: 'Settings', path: '/settings', icon: 'settings', roles: ['Admin', 'Manager', 'Sales'], description: 'System configurations, company details, preferences', keywords: ['config', 'configuration', 'setup', 'preferences', 'company', 'system'] },
    ],
  },
  {
    label: 'System Admin',
    roles: ['SystemAdmin'],
    items: [
      { label: 'Dashboard', path: '/system-admin/dashboard', icon: 'dashboard', roles: ['SystemAdmin'], description: 'Global system overview', keywords: ['overview', 'stats'] },
      { label: 'Companies', path: '/system-admin/companies', icon: 'business', roles: ['SystemAdmin'], description: 'Manage tenants and companies', keywords: ['tenants', 'organizations'] },
      { label: 'Users', path: '/system-admin/users', icon: 'manage_accounts', roles: ['SystemAdmin'], description: 'Global user management', keywords: ['global', 'accounts'] },
      { label: 'Activity', path: '/system-admin/activity', icon: 'local_activity', roles: ['SystemAdmin'], description: 'Global system logs', keywords: ['logs', 'audit', 'history'] },
      { label: 'Settings', path: '/system-admin/settings', icon: 'settings', roles: ['SystemAdmin'], description: 'Global system configurations', keywords: ['config', 'configuration', 'setup', 'global'] },
    ],
  },
];

const EXTRA_SEARCH_ITEMS: NavItem[] = [
  { label: 'My Profile', path: '/profile', icon: 'person', description: 'Manage your personal account and preferences', keywords: ['account', 'password', 'avatar', 'personal', 'settings'] },
  { label: 'Add Product', path: '/add-products', icon: 'add_circle', description: 'Create a new inventory product', keywords: ['new', 'create', 'inventory', 'item'] },
  { label: 'New Purchase', path: '/purchases/new', icon: 'add_shopping_cart', roles: ['Admin', 'Manager'], description: 'Record a new supplier purchase', keywords: ['buy', 'restock', 'stock in', 'supplier'] },
  { label: 'Add Company', path: '/system-admin/companies/new', icon: 'business', roles: ['SystemAdmin'], description: 'Create a new tenant company', keywords: ['new', 'create', 'tenant'] },
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
  private tenantService = inject(TenantApiService);

  /**
   * Returns nav groups filtered to only items visible for the given role.
   * Pass role = 'Admin' | 'Manager' | 'Sales' (case-sensitive as returned by the API).
   */
  getNavGroups(role?: string): NavGroup[] {
    const normalizedRole = role?.toLowerCase() ?? '';
    const isBottleEnabled = this.tenantService.isBottleManagementEnabled();

    return ALL_NAV_GROUPS
      .filter((group) => {
        if (group.label === 'Bottle Management' && !isBottleEnabled) {
          return false;
        }
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

  /**
   * Returns a comprehensive list of searchable features and settings, filtered by user role.
   */
  getSearchableItems(role?: string): NavItem[] {
    const navGroups = this.getNavGroups(role);
    const navItems = navGroups.flatMap(g => g.items);
    
    const normalizedRole = role?.toLowerCase() ?? '';
    const extraItems = EXTRA_SEARCH_ITEMS.filter((item) => {
      if (!item.roles) {
        return normalizedRole !== 'systemadmin';
      }
      return item.roles.some((r) => r.toLowerCase() === normalizedRole);
    });

    return [...navItems, ...extraItems];
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
