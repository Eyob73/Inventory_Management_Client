import { Component, inject, ViewChild, effect, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Product } from '../../models/products.model';
import { ProductStore } from '../../store/products.store';
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';
import { AuthStore } from '../../store/auth.store';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import {
  canAddProduct,
  canDeleteProduct,
  canEditProduct,
  canViewProductCost,
  getStockStatus,
} from '../../utils/product-permissions';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    TableSkeleton,
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  readonly store = inject(ProductStore);
  readonly authStore = inject(AuthStore);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);

  readonly baseUrl = environment.apiUrl.replace('/api', '');

  readonly isSales = computed(() => !canViewProductCost(this.authStore.userRole()));
  readonly canAddProducts = computed(() => canAddProduct(this.authStore.userRole()));
  readonly canEditProducts = computed(() => canEditProduct(this.authStore.userRole()));
  readonly canDeleteProducts = computed(() => canDeleteProduct(this.authStore.userRole()));

  readonly displayedColumns = computed<string[]>(() =>
    this.isSales()
      ? ['no', 'name', 'sku', 'price', 'quantityInStock', 'actions']
      : ['no', 'name', 'sku', 'price', 'cost', 'quantityInStock', 'actions']
  );

  dataSource = new MatTableDataSource<Product>([]);
  pageSizeOptions = [5, 10, 15, 25, 50];

  readonly skeletonColumns: TableSkeletonColumn[] = [
    { width: '6%' },
    { width: '28%', dual: true },
    { width: '14%' },
    { width: '12%' },
    { width: '12%' },
    { width: '16%' },
    { width: '12%' },
  ];

  @ViewChild(MatSort) set sort(sort: MatSort | undefined) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  constructor() {
    effect(() => {
      const products = this.store.entities();
      this.dataSource.data = products || [];
    });
  }

  ngOnInit(): void {
    this.store.loadProducts({ pageIndex: 1, pageSize: 10 });
  }

  onPageChange(event: PageEvent): void {
    this.store.loadProducts({
      pageIndex: event.pageIndex + 1,
      pageSize: event.pageSize,
      search: this.store.search() || undefined,
    });
  }

  applyFilter(event: Event) {
    const search = (event.target as HTMLInputElement).value.trim();
    this.store.loadProducts({ pageIndex: 1, pageSize: this.store.pageSize(), search });
  }

  viewDetails(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  editProduct(product: Product): void {
    if (!this.canEditProducts()) return;
    this.router.navigate(['/products', product.id, 'edit']);
  }

  deleteProduct(product: Product): void {
    if (!this.canDeleteProducts()) return;
    this.confirmDialog.confirmDelete('Product', product.name).subscribe((confirmed) => {
      if (!confirmed) return;
      this.store.deleteProduct(product.id);
    });
  }

  getStockStatus(stock: number): { label: string; class: string } {
    return getStockStatus(stock);
  }
}
