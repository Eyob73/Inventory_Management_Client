import { Component, inject, signal, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { ProductsCard } from '../../ui/products-card/products-card';
import { Product } from '../../models/products.model';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    ProductsCard,
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements AfterViewInit {
  private api = inject(ProductService);

  displayedColumns: string[] = ['name', 'sku', 'price', 'cost', 'quantityInStock', 'actions'];
  dataSource = new MatTableDataSource<Product>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  productsResource = rxResource({
    stream: () => this.api.getAll(),
  });

  selectedProduct = signal<Product | null>(null);

  constructor() {
    effect(() => {
      const res = this.productsResource.value();
      if (res && Array.isArray(res)) {
        this.dataSource.data = res;
      } else {
        this.dataSource.data = [];
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  selectProduct(product: Product) {
    this.selectedProduct.set(product);
  }

  closeDetail() {
    this.selectedProduct.set(null);
  }

  getStockStatus(stock: number): { label: string; class: string } {
    if (stock <= 0) return { label: 'Out of stock', class: 'status--out' };
    if (stock <= 15) return { label: 'Low stock', class: 'status--low' };
    return { label: 'In stock', class: 'status--in' };
  }
}
