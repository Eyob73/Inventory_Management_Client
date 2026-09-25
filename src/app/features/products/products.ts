import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category';
import { FormsModule } from '@angular/forms';
import { signal, Component, inject, ViewChild, effect, OnInit, computed } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BarcodeScannerDialog } from '../../shared/components/barcode-scanner-dialog/barcode-scanner-dialog';
import { ProductService } from '../../services/product';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Product } from '../../models/products.model';
import { ProductStore } from '../../store/products.store';
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';
import { CardSkeleton } from '../../ui/card-skeleton/card-skeleton';
import { AuthStore } from '../../store/auth.store';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { DataViewComponent, DataViewCardField, DataViewAction } from '../../shared/components/data-view/data-view.component';
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
    FormsModule,
    CommonModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TableSkeleton,
    CardSkeleton,
    TranslocoDirective,
    DataViewComponent
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  readonly store = inject(ProductStore);
  categoryService = inject(CategoryService);
  categories = signal<Category[]>([]);
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

  cardFields = computed<DataViewCardField[]>(() => {
    const fields: DataViewCardField[] = [
      { key: 'imageUrl', type: 'image', imageFallbackIcon: 'inventory_2', valueFn: (p) => p.imageUrl ? this.baseUrl + p.imageUrl : null },
      { key: 'name', type: 'text' },
      { key: 'sku', label: 'SKU', type: 'code' },
      { key: 'price', label: 'Price', type: 'currency' }
    ];
    if (!this.isSales()) {
      fields.push({ key: 'cost', label: 'Cost', type: 'currency' });
    }
    fields.push({
      key: 'quantityInStock',
      label: 'Stock',
      type: 'badge',
      badgeClassFn: (p) => getStockStatus(p.quantityInStock).class,
      valueFn: (p) => `${getStockStatus(p.quantityInStock).label} (${p.quantityInStock})`
    });
    return fields;
  });

  cardActions = computed<DataViewAction[]>(() => {
    const actions: DataViewAction[] = [
      { id: 'view', icon: 'visibility', label: 'View Details' }
    ];
    if (this.canEditProducts()) {
      actions.push({ id: 'edit', icon: 'edit', label: 'Edit Product' });
    }
    if (this.canDeleteProducts()) {
      actions.push({ id: 'delete', icon: 'delete_outline', label: 'Delete Product', color: 'warn' });
    }
    return actions;
  });

  onCardAction(event: { actionId: string, item: any }) {
    if (event.actionId === 'view') this.viewDetails(event.item);
    else if (event.actionId === 'edit') this.editProduct(event.item);
    else if (event.actionId === 'delete') this.deleteProduct(event.item);
  }

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
    this.categoryService.getAll().subscribe(cats => this.categories.set(cats));
    this.store.loadProducts({ pageIndex: 1, pageSize: 10 });
  }

  onPageChange(event: PageEvent): void {
    this.store.loadProducts({
      pageIndex: event.pageIndex + 1,
      pageSize: event.pageSize,
      search: this.store.search() || undefined,
    });
  }

  onCategoryChange(categoryId: string): void {
    this.store.loadProducts({ pageIndex: 1, pageSize: this.store.pageSize(), search: this.store.search(), categoryId, status: this.store.status() });
  }

  onStatusChange(status: number | null): void {
    this.store.loadProducts({ pageIndex: 1, pageSize: this.store.pageSize(), search: this.store.search(), categoryId: this.store.categoryId(), status });
  }

  applyFilter(event: Event): void {
    const search = (event.target as HTMLInputElement).value.trim();
    this.store.loadProducts({ pageIndex: 1, pageSize: this.store.pageSize(), search });
  }

  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private productService = inject(ProductService);
  private translocoService = inject(TranslocoService);

  clearSearch(input: HTMLInputElement): void {
    input.value = '';
    this.store.loadProducts({ pageIndex: 1, pageSize: this.store.pageSize(), search: '' });
  }

  openScanner(): void {
    const dialogRef = this.dialog.open(BarcodeScannerDialog, {
      width: '90vw',
      maxWidth: '600px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((barcode: string | undefined) => {
      if (barcode && barcode.trim()) {
        const normalizedBarcode = barcode.trim();
        this.productService.getAll(1, 1, normalizedBarcode).subscribe((res) => {
          const count = Array.isArray(res) ? res.length : (res.totalCount || 0);
          if (count > 0) {
            this.store.loadProducts({ pageIndex: 1, pageSize: this.store.pageSize(), search: normalizedBarcode });
            const msg = this.translocoService.translate('scanner.productFound', { barcode: normalizedBarcode }) || `Product found with barcode: ${normalizedBarcode}`;
            const close = this.translocoService.translate('scanner.cancel') || 'Close';
            this.snackBar.open(msg, close, { duration: 3000 });
          } else {
            const msg = this.translocoService.translate('scanner.productNotFound', { barcode: normalizedBarcode }) || `No product was found with barcode: ${normalizedBarcode}`;
            const close = this.translocoService.translate('scanner.cancel') || 'Close';
            this.snackBar.open(msg, close, { duration: 5000 });
          }
        });
      }
    });
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


