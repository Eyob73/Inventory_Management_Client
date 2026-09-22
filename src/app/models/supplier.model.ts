export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  totalPurchasesCount?: number;
  totalPurchased?: number;
}

export interface SupplierPurchasedProduct {
  productId: string;
  productName: string;
  sku: string;
  totalQuantity: number;
}

export interface SupplierPurchaseHistory {
  id: string;
  purchaseNumber: string;
  purchaseDate: string;
  totalAmount: number;
  status: string;
  itemsCount: number;
}

export interface SupplierDetail extends Supplier {
  purchasedProducts?: SupplierPurchasedProduct[];
  purchaseHistory?: SupplierPurchaseHistory[];
}

export interface CreateSupplierDto {
  name: string;
  contactName?: string;
  email?: string;
  phoneNumber: string;
  address?: string;
  isActive: boolean;
}

export interface UpdateSupplierDto extends CreateSupplierDto {
  id: string;
}
