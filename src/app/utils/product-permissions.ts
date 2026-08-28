export type ProductRole = string | null | undefined;

export function normalizeProductRole(role: ProductRole): string {
  return (role ?? '').toLowerCase();
}

export function canViewProductDetails(): boolean {
  return true;
}

export function canEditProduct(role?: ProductRole): boolean {
  const r = normalizeProductRole(role);
  return r === 'admin' || r === 'administrator' || r === 'manager';
}

export function canDeleteProduct(role?: ProductRole): boolean {
  const r = normalizeProductRole(role);
  return r === 'admin' || r === 'administrator';
}

export function canAddProduct(role?: ProductRole): boolean {
  const r = normalizeProductRole(role);
  return r === 'admin' || r === 'administrator' || r === 'manager';
}

export function canViewProductCost(role?: ProductRole): boolean {
  return normalizeProductRole(role) !== 'sales';
}

export function getStockStatus(stock: number): { label: string; class: string } {
  if (stock <= 0) return { label: 'Out of stock', class: 'status--out' };
  if (stock <= 15) return { label: 'Low stock', class: 'status--low' };
  return { label: 'In stock', class: 'status--in' };
}
