export interface ReportFilter {
  dateRangePreset?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';
  startDate?: string; // ISO format or yyyy-MM-dd
  endDate?: string;
  productId?: string;
  categoryId?: string;
  supplierId?: string;
  customerId?: string;
  userId?: string;
  status?: string;
  transactionType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PeriodMetric {
  value: number;
  previousValue: number;
  changePercent?: number;
}

export interface ChartPoint {
  label: string;
  value: number;
  count: number;
}

export interface NamedAmount {
  id: string;
  name: string;
  amount: number;
  quantity: number;
}

export interface DashboardReport {
  startDate: string;
  endDate: string;
  totalSales: PeriodMetric;
  totalPurchases: PeriodMetric;
  totalProfit: PeriodMetric;
  totalProductsSold: PeriodMetric;
  totalCustomers: PeriodMetric;
  totalSuppliers: PeriodMetric;
  lowStockProducts: number;
  outOfStockProducts: number;
  salesOverTime: ChartPoint[];
  purchasesOverTime: ChartPoint[];
  topProducts: NamedAmount[];
  salesByCategory: NamedAmount[];
}

export interface SalesReportSummary {
  totalSalesAmount: number;
  numberOfSales: number;
  totalProductsSold: number;
  averageSaleValue: number;
  totalDiscounts: number;
  totalTax: number;
}

export interface SalesReportRow {
  id: string;
  invoiceNumber: string;
  customer: string;
  date: string;
  numberOfItems: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
}

export interface SalesReport {
  summary: SalesReportSummary;
  table: PagedResult<SalesReportRow>;
  salesByDay: ChartPoint[];
  salesByWeek: ChartPoint[];
  salesByMonth: ChartPoint[];
  topSellingProducts: NamedAmount[];
  salesByCategory: NamedAmount[];
}

export interface PurchasesReportSummary {
  totalPurchaseAmount: number;
  numberOfPurchases: number;
  totalProductsPurchased: number;
  averagePurchaseValue: number;
}

export interface PurchasesReportRow {
  id: string;
  purchaseNumber: string;
  supplier: string;
  purchaseDate: string;
  numberOfItems: number;
  totalAmount: number;
  status: string;
}

export interface PurchasesReport {
  summary: PurchasesReportSummary;
  table: PagedResult<PurchasesReportRow>;
  purchasesOverTime: ChartPoint[];
  purchasesBySupplier: NamedAmount[];
  mostPurchasedProducts: NamedAmount[];
  purchaseAmountByCategory: NamedAmount[];
}

export interface InventoryReportSummary {
  totalProducts: number;
  totalStockQuantity: number;
  inventoryValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  criticalStockProducts: number;
}

export interface InventoryReportRow {
  productId: string;
  product: string;
  sku: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  sellingPrice: number;
  unitCost: number;
  inventoryValue: number;
  stockStatus: string; // 'In Stock' | 'Low Stock' | 'Critical Stock' | 'Out of Stock'
  recommendedAction: string;
}

export interface InventoryReport {
  summary: InventoryReportSummary;
  table: PagedResult<InventoryReportRow>;
}

export interface LowStockReport {
  outOfStock: number;
  criticalStock: number;
  lowStock: number;
  table: PagedResult<InventoryReportRow>;
}

export interface ProductPerformanceRow {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  unitsSold: number;
  salesRevenue: number;
  purchaseQuantity: number;
  currentStock: number;
  profit: number;
}

export interface ProductPerformanceReport {
  table: PagedResult<ProductPerformanceRow>;
  topSelling: ProductPerformanceRow[];
  leastSelling: ProductPerformanceRow[];
  mostProfitable: ProductPerformanceRow[];
  noSales: ProductPerformanceRow[];
}

export interface CustomerReportRow {
  customerId: string;
  customerName: string;
  phoneNumber: string;
  numberOfPurchases: number;
  totalAmountSpent: number;
  averagePurchaseValue: number;
  lastPurchaseDate?: string;
}

export interface CustomerReport {
  table: PagedResult<CustomerReportRow>;
  topBySpending: CustomerReportRow[];
  mostFrequent: CustomerReportRow[];
  noRecentPurchases: CustomerReportRow[];
}

export interface SupplierReportRow {
  supplierId: string;
  supplierName: string;
  contactPerson: string;
  numberOfPurchases: number;
  totalPurchaseAmount: number;
  productsSupplied: number;
  lastPurchaseDate?: string;
}

export interface SupplierPurchaseHistoryRow {
  id: string;
  purchaseNumber: string;
  purchaseDate: string;
  totalAmount: number;
  status: string;
  itemsCount: number;
}

export interface SupplierReport {
  table: PagedResult<SupplierReportRow>;
  topByAmount: SupplierReportRow[];
  mostFrequent: SupplierReportRow[];
  purchaseHistory: SupplierPurchaseHistoryRow[];
}

export interface ProfitReport {
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossProfitMargin: number;
  costBasis: string;
  profitOverTime: ChartPoint[];
}

export interface StockMovementRow {
  id: string;
  date: string;
  product: string;
  transactionType: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  referenceType?: string;
  referenceNumber?: string;
  performedBy: string;
}

export interface StockMovementReport {
  table: PagedResult<StockMovementRow>;
}
