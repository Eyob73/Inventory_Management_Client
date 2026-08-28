import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../models/products.model';
import { ProductService } from '../../../services/product';
import { CategoryService } from '../../../services/category';
import { SupplierService } from '../../../services/supplier';
import { AuthStore } from '../../../store/auth.store';
import { canEditProduct, canViewProductCost } from '../../../utils/product-permissions';
import { ProductDetails } from '../product-details/product-details';

@Component({
  selector: 'app-product-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, ProductDetails],
  templateUrl: './product-details-page.html',
  styleUrl: './product-details-page.scss',
})
export class ProductDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private supplierService = inject(SupplierService);
  private authStore = inject(AuthStore);

  readonly product = signal<Product | null>(null);
  readonly categoryName = signal<string | null>(null);
  readonly supplierName = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly canEdit = computed(() => canEditProduct(this.authStore.userRole()));
  readonly showCost = computed(() => canViewProductCost(this.authStore.userRole()));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No product ID provided.');
      this.isLoading.set(false);
      return;
    }
    this.load(id);
  }

  editProduct(): void {
    const id = this.product()?.id;
    if (!id || !this.canEdit()) return;
    this.router.navigate(['/products', id, 'edit']);
  }

  private load(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      product: this.productService.getById(id),
      categories: this.categoryService.getAll().pipe(catchError(() => of([]))),
      suppliers: this.supplierService.getAll().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ product, categories, suppliers }) => {
        this.product.set(product);
        this.categoryName.set(categories.find((c) => c.id === product.categoryId)?.name ?? null);
        this.supplierName.set(
          product.supplierId
            ? (suppliers.find((s) => s.id === product.supplierId)?.name ?? null)
            : null
        );
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || err?.message || 'Failed to load product details.');
        this.isLoading.set(false);
      },
    });
  }
}
