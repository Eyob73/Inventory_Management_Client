export interface Customer {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  totalSalesCount: number;
  totalSpent: number;
}

export interface CustomerSaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerSale {
  id: string;
  saleNumber: string;
  createdAt: string;
  totalAmount: number;
  paymentMethod: string;
  itemsCount: number;
  status: string;
  items: CustomerSaleItem[];
}

export interface CustomerDetail extends Customer {
  salesHistory: CustomerSale[];
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phoneNumber: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateCustomerDto {
  id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  address?: string;
  isActive: boolean;
}
