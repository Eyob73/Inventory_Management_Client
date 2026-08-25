import { Component, inject, ViewChild, effect, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { Product } from '../../models/products.model';
import { ProductStore } from '../../store/products.store';
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    TableSkeleton,
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  readonly store = inject(ProductStore);
  readonly authStore = inject(AuthStore);

  /** Whether the current user is a Sales role */
  readonly isSales = computed(() =>
    this.authStore.userRole()?.toLowerCase() === 'sales'
  );

  /** Whether the current user can create/edit products (Admin or Manager) */
  readonly canEditProducts = computed(() => {
    const role = this.authStore.userRole()?.toLowerCase() ?? '';
    return role === 'admin' || role === 'manager';
  });

  /** Column list — hide 'cost' for Sales users */
  readonly displayedColumns = computed<string[]>(() =>
    this.isSales()
      ? ['name', 'sku', 'price', 'quantityInStock']
      : ['name', 'sku', 'price', 'cost', 'quantityInStock']
  );

  dataSource = new MatTableDataSource<Product>([]);
  pageSizeOptions = [5, 10, 15, 25, 50];

  readonly skeletonColumns: TableSkeletonColumn[] = [
    { width: '30%', dual: true },
    { width: '16%' },
    { width: '14%' },
    { width: '14%' },
    { width: '18%' },
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
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getStockStatus(stock: number): { label: string; class: string } {
    if (stock <= 0) return { label: 'Out of stock', class: 'status--out' };
    if (stock <= 15) return { label: 'Low stock', class: 'status--low' };
    return { label: 'In stock', class: 'status--in' };
  }
}

