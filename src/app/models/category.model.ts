import { Product } from './products.model';

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CategoryDetail extends Category {
  products: Product[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateCategoryDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}
