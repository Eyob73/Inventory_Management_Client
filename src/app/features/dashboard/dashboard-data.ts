export interface Kpi {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  sub: string;
  icon: string;
}

export interface RevenuePoint {
  day: string;
  revenue: number;
  orders: number;
}

export interface CategoryStock {
  name: string;
  inStock: number;
  reorderAt: number;
  capacity: number;
}

export interface Order {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: 'Fulfilled' | 'Processing' | 'Backordered';
}

export interface LowStockItem {
  sku: string;
  name: string;
  onHand: number;
  reorderPoint: number;
}

export interface RecentActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  icon: string;
  type: 'order' | 'stock' | 'supplier' | 'system';
}

export const DASHBOARD_KPIS: Kpi[] = [
  {
    label: 'Revenue (7d)',
    value: 'ETB 40,300.00',
    delta: '12.4%',
    positive: true,
    sub: 'vs last week',
    icon: 'payments',
  },
  {
    label: 'Orders (7d)',
    value: '339',
    delta: '6.1%',
    positive: true,
    sub: 'vs last week',
    icon: 'shopping_cart',
  },
  {
    label: 'Inventory value',
    value: 'ETB 184,230.00',
    delta: '2.8%',
    positive: false,
    sub: 'vs last week',
    icon: 'inventory_2',
  },
  {
    label: 'Low stock SKUs',
    value: '14',
    delta: '4 new',
    positive: false,
    sub: 'need reorder',
    icon: 'warning',
  },
];

export const REVENUE_TREND: RevenuePoint[] = [
  { day: 'Mon', revenue: 4200, orders: 38 },
  { day: 'Tue', revenue: 5100, orders: 44 },
  { day: 'Wed', revenue: 4800, orders: 41 },
  { day: 'Thu', revenue: 6300, orders: 52 },
  { day: 'Fri', revenue: 7400, orders: 61 },
  { day: 'Sat', revenue: 6900, orders: 57 },
  { day: 'Sun', revenue: 5600, orders: 46 },
];

export const CATEGORY_STOCK: CategoryStock[] = [
  { name: 'Beverages', inStock: 1840, reorderAt: 500, capacity: 2400 },
  { name: 'Snacks & Confectionery', inStock: 620, reorderAt: 600, capacity: 2000 },
  { name: 'Dairy & Chilled', inStock: 340, reorderAt: 450, capacity: 1200 },
  { name: 'Household', inStock: 1120, reorderAt: 400, capacity: 1600 },
  { name: 'Personal Care', inStock: 210, reorderAt: 350, capacity: 900 },
];

export const RECENT_ORDERS: Order[] = [
  { id: 'SO-10482', customer: 'Bramwell & Co.', items: 12, total: 1284.5, status: 'Fulfilled' },
  { id: 'SO-10481', customer: 'Nairobi Retail Group', items: 4, total: 386.0, status: 'Processing' },
  { id: 'SO-10480', customer: 'Coastal Mart', items: 27, total: 3120.75, status: 'Fulfilled' },
  { id: 'SO-10479', customer: 'Green Valley Foods', items: 8, total: 642.2, status: 'Backordered' },
  { id: 'SO-10478', customer: 'Union Square Deli', items: 15, total: 1058.9, status: 'Fulfilled' },
  { id: 'SO-10477', customer: 'Bramwell & Co.', items: 3, total: 214.0, status: 'Processing' },
];

export const LOW_STOCK_ALERTS: LowStockItem[] = [
  { sku: 'PC-0231', name: 'Aloe Hand Wash 500ml', onHand: 18, reorderPoint: 60 },
  { sku: 'DC-1042', name: 'Oat Milk 1L', onHand: 24, reorderPoint: 80 },
  { sku: 'SN-0765', name: 'Sea Salt Crackers 200g', onHand: 31, reorderPoint: 75 },
  { sku: 'PC-0118', name: 'Bamboo Toothbrush 2pk', onHand: 9, reorderPoint: 50 },
];

export const RECENT_ACTIVITIES: RecentActivity[] = [
  { id: 'act-1', user: 'Sarah Jenkins', action: 'Created Purchase Order', target: 'PO-2026-89', timestamp: '10 min ago', icon: 'post_add', type: 'order' },
  { id: 'act-2', user: 'Abebe Bikila', action: 'Adjusted Stock Level', target: 'SKU PC-0231 (+50 units)', timestamp: '25 min ago', icon: 'edit_note', type: 'stock' },
  { id: 'act-3', user: 'System', action: 'Low Stock Alert Triggered', target: 'Oat Milk 1L', timestamp: '1 hour ago', icon: 'warning_amber', type: 'system' },
  { id: 'act-4', user: 'Elena Rostova', action: 'Approved Supplier Invoice', target: 'INV-4401', timestamp: '3 hours ago', icon: 'receipt', type: 'supplier' },
  { id: 'act-5', user: 'Michael Scott', action: 'Fulfilling Order', target: 'SO-10482', timestamp: '5 hours ago', icon: 'local_shipping', type: 'order' },
];
