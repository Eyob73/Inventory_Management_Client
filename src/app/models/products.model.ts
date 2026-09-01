export interface Product {
    id: string;
    name: string;
    sku: string;
    description: string;
    price: number;
    cost: number;
    quantityInStock: number;
    minimumStock?: number;
    isActive?: boolean;
    categoryId: string;
    supplierId: string | null;
    createdAt: string;
    updatedAt: string | null;
    imageUrl?: string | null;
    minimumStockLevel?: number | null;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export type PagedProductResponse = PagedResult<Product>;

export interface ProductQueryFilter {
    search?: string;
    categoryId?: string;
    supplierId?: string;
    pageIndex?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}