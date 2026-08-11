import { Component, inject, ViewChild, AfterViewInit, effect, afterNextRender, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { Product } from '../../models/products.model';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductService } from '../../services/product';
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';

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
export class Products implements AfterViewInit {
  private api = inject(ProductService);
  private injector = inject(Injector);

  displayedColumns: string[] = ['name', 'sku', 'price', 'cost', 'quantityInStock'];
  dataSource = new MatTableDataSource<Product>([]);
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  readonly skeletonColumns: TableSkeletonColumn[] = [
    { width: '30%', dual: true },
    { width: '16%' },
    { width: '14%' },
    { width: '14%' },
    { width: '18%' },
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  productsResource = rxResource({
    stream: () => this.api.getAll(),
  });

  constructor() {
    effect(() => {
      const res = this.productsResource.value();
      if (res && Array.isArray(res)) {
        this.dataSource.data = res;
      } else {
        this.dataSource.data = [];
      }

      // Re-bind when table mounts after skeleton unmounts
      if (!this.productsResource.isLoading()) {
        afterNextRender(() => this.bindTableControls(), { injector: this.injector });
      }
    });
  }

  ngAfterViewInit() {
    this.bindTableControls();
  }

  private bindTableControls(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getStockStatus(stock: number): { label: string; class: string } {
    if (stock <= 0) return { label: 'Out of stock', class: 'status--out' };
    if (stock <= 15) return { label: 'Low stock', class: 'status--low' };
    return { label: 'In stock', class: 'status--in' };
  }
}
