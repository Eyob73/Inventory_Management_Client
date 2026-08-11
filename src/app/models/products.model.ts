export interface Product {
    id: string;
    name: string;
    sku: string;
    description: string;
    price: number;
    cost: number;
    quantityInStock: number;
    categoryId: string;
    supplierId: string | null;
    createdAt: string;
    updatedAt: string | null;
}