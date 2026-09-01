export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
  createdAt: string;
  createdBy?: string | null;
}

export interface InventoryTransactionFilter {
  productId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface PagedInventoryTransactions {
  items: InventoryTransaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface CreateStockAdjustmentDto {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface ProductStock {
  productId: string;
  productName: string;
  sku: string;
  quantityInStock: number;
  minimumStock: number;
  recentTransactions: InventoryTransaction[];
}
