export interface PurchaseLine {
  id?: string;
  purchaseId?: string;
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  unitCost: number;
  totalCost?: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string | null;
  supplierName?: string | null;
  purchaseDate: string;
  totalAmount: number;
  status: string;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  items: PurchaseLine[];
}

export interface PurchaseLineInput {
  productId: string;
  quantity: number;
}

export interface CreatePurchaseDto {
  supplierId?: string | null;
  purchaseDate?: string;
  notes?: string;
  items: PurchaseLineInput[];
}

export interface UpdatePurchaseDto extends CreatePurchaseDto {
  id: string;
}
