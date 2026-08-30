export interface SaleItem {
  id?: string;
  saleId?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
  totalPrice: number;
}

export interface CreateSaleItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  saleDate: string;
  customerId?: string | null;
  customerName?: string | null;
  userId?: string | null;
  cashierName?: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Mobile Payment' | string;
  amountReceived: number;
  changeAmount: number;
  notes?: string | null;
  status: 'Completed' | 'Cancelled' | string;
  createdAt: string;
  items: SaleItem[];
}

export interface CreateSaleRequest {
  customerId?: string | null;
  customerName?: string | null;
  paymentMethod: string;
  amountReceived: number;
  discountAmount: number;
  taxAmount: number;
  notes?: string | null;
  items: CreateSaleItemRequest[];
}

export interface SaleFilter {
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  status?: string;
  userId?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface PagedSaleResponse {
  items: Sale[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
