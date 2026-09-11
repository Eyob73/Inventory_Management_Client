import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

// Services & Models
import { ProductService } from '../../services/product';
import { CategoryService, Category } from '../../services/category';
import { CustomerService, Customer } from '../../services/customer.service';
import { SaleService } from '../../services/sale.service';
import { Product } from '../../models/products.model';
import { CreateSaleRequest, Sale } from '../../models/sale.model';
import { SaleDetailsDialogComponent } from '../../component/sale-details-dialog/sale-details-dialog';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { CustomerDialogComponent } from '../customers/customer-dialog/customer-dialog';
import { environment } from '../../../environments/environment.development';

export interface CartItem {
  product: Product;
  quantity: number;
  discountAmount: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './pos.html',
  styleUrl: './pos.scss'
})
export class PosComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private customerService = inject(CustomerService);
  private saleService = inject(SaleService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private confirmDialog = inject(ConfirmDialogService);

  readonly baseUrl = environment.apiUrl.replace('/api', '');

  // State Signals
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  customers = signal<Customer[]>([]);
  cart = signal<CartItem[]>([]);

  searchTerm = signal<string>('');
  selectedCategoryId = signal<string>('ALL');

  // Pagination Signals
  currentPage = signal<number>(0);
  pageSize = signal<number>(15);
  totalCount = signal<number>(0);

  selectedCustomerId = signal<string | null>(null);
  manualCustomerName = signal<string>('');

  paymentMethod = signal<string>('Cash');
  amountReceived = signal<number>(0);
  discountAmount = signal<number>(0);
  taxRatePercent = signal<number>(0);
  saleNotes = signal<string>('');
  showNotes = signal<boolean>(false);

  isLoadingProducts = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Live terminal clock — a small, honest nod to real point-of-sale hardware
  currentTime = signal<Date>(new Date());
  private clockHandle = setInterval(() => this.currentTime.set(new Date()), 1000);

  // Computed Properties
  readonly filteredProducts = computed(() => this.products());

  readonly paginatedProducts = computed(() => this.products());

  readonly totalPages = computed(() =>
    Math.ceil(this.totalCount() / this.pageSize()) || 1
  );

  readonly cartItemCount = computed(() =>
    this.cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  // Lets the product grid show "already in cart" quantity badges
  readonly cartQuantities = computed(() => {
    const map = new Map<string, number>();
    for (const item of this.cart()) {
      map.set(item.product.id, item.quantity);
    }
    return map;
  });

  readonly cartSubtotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  readonly itemDiscountsTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.discountAmount, 0)
  );

  readonly totalDiscount = computed(() =>
    this.itemDiscountsTotal() + Math.max(0, this.discountAmount())
  );

  readonly taxableAmount = computed(() =>
    Math.max(0, this.cartSubtotal() - this.totalDiscount())
  );

  readonly calculatedTax = computed(() => {
    const rate = Math.max(0, this.taxRatePercent()) / 100;
    return this.taxableAmount() * rate;
  });

  readonly grandTotal = computed(() =>
    Math.max(0, this.cartSubtotal() - this.totalDiscount() + this.calculatedTax())
  );

  readonly changeAmount = computed(() => {
    if (this.paymentMethod() !== 'Cash') return 0;
    return Math.max(0, this.amountReceived() - this.grandTotal());
  });

  readonly selectedCustomer = computed(() =>
    this.customers().find((c) => c.id === this.selectedCustomerId()) ?? null
  );

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    clearInterval(this.clockHandle);
  }

  loadProducts(): void {
    this.isLoadingProducts.set(true);
    const pageIndex = this.currentPage() + 1;
    const size = this.pageSize();
    const search = this.searchTerm().trim() || undefined;
    const catId = this.selectedCategoryId() === 'ALL' ? undefined : this.selectedCategoryId();

    this.productService.getAll(pageIndex, size, search, catId).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.products.set(res);
          this.totalCount.set(res.length);
        } else {
          this.products.set(res.items || []);
          this.totalCount.set(res.totalCount || 0);
        }
        this.isLoadingProducts.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load products.', 'Close', { duration: 3000 });
        this.isLoadingProducts.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(0);
    this.loadProducts();
  }

  onCategorySelect(catId: string): void {
    this.selectedCategoryId.set(catId);
    this.currentPage.set(0);
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => this.categories.set(res || []),
      error: () => console.error('Failed to load categories')
    });
  }

  loadCustomers(): void {
    this.customerService.getAll().subscribe({
      next: (res) => this.customers.set(res || []),
      error: () => console.error('Failed to load customers')
    });
  }

  // Deterministic accent color per category, so the same category always
  // reads the same hue across sessions without needing a color field in the model.
  categoryColor(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 46%, 45%)`;
  }

  addToCart(product: Product): void {
    if (product.quantityInStock <= 0) {
      this.snackBar.open(`"${product.name}" is out of stock!`, 'Close', { duration: 2500 });
      return;
    }

    const currentCart = this.cart();
    const existingIndex = currentCart.findIndex((i) => i.product.id === product.id);

    if (existingIndex > -1) {
      const item = currentCart[existingIndex];
      if (item.quantity + 1 > product.quantityInStock) {
        this.snackBar.open(
          `Cannot add more. Available stock for "${product.name}" is ${product.quantityInStock}.`,
          'Close',
          { duration: 2500 }
        );
        return;
      }
      const updatedCart = [...currentCart];
      updatedCart[existingIndex] = { ...item, quantity: item.quantity + 1 };
      this.cart.set(updatedCart);
    } else {
      this.cart.set([...currentCart, { product, quantity: 1, discountAmount: 0 }]);
    }
  }

  updateQuantity(index: number, newQty: number): void {
    const currentCart = [...this.cart()];
    if (index < 0 || index >= currentCart.length) return;

    const item = currentCart[index];
    if (newQty <= 0) {
      this.removeItem(index);
      return;
    }

    if (newQty > item.product.quantityInStock) {
      this.snackBar.open(
        `Quantity cannot exceed available stock (${item.product.quantityInStock}).`,
        'Close',
        { duration: 2500 }
      );
      return;
    }

    currentCart[index] = { ...item, quantity: newQty };
    this.cart.set(currentCart);
  }

  removeItem(index: number): void {
    const currentCart = [...this.cart()];
    currentCart.splice(index, 1);
    this.cart.set(currentCart);
  }

  clearCart(): void {
    this.cart.set([]);
    this.discountAmount.set(0);
    this.amountReceived.set(0);
    this.manualCustomerName.set('');
    this.selectedCustomerId.set(null);
    this.saleNotes.set('');
    this.showNotes.set(false);
  }

  clearCustomer(): void {
    this.selectedCustomerId.set(null);
    this.manualCustomerName.set('');
  }

  openAddCustomerDialog(): void {
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '500px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && typeof result === 'object' && result.id) {
        this.loadCustomers();
        this.selectedCustomerId.set(result.id);
        this.snackBar.open(`Customer "${result.name}" added and selected.`, 'Close', { duration: 3000 });
      } else if (result) {
        this.loadCustomers();
      }
    });
  }

  setPaymentMethod(method: string): void {
    this.paymentMethod.set(method);
    // Always sync amount received to grand total for non-manual payment modes
    this.amountReceived.set(parseFloat(this.grandTotal().toFixed(2)));
  }

  completeSale(): void {
    if (this.cart().length === 0) {
      this.snackBar.open('Cannot complete sale with an empty shopping cart.', 'Close', { duration: 3000 });
      return;
    }

    let customerName = this.manualCustomerName().trim();
    if (this.selectedCustomerId()) {
      const found = this.customers().find((c) => c.id === this.selectedCustomerId());
      if (found) customerName = found.name;
    }

    const grandTotalVal = parseFloat(this.grandTotal().toFixed(2));

    const payload: CreateSaleRequest = {
      customerId: this.selectedCustomerId() || undefined,
      customerName: customerName || undefined,
      paymentMethod: this.paymentMethod(),
      amountReceived: grandTotalVal,
      discountAmount: this.discountAmount(),
      taxAmount: parseFloat(this.calculatedTax().toFixed(2)),
      notes: this.saleNotes().trim() || undefined,
      items: this.cart().map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        discountAmount: item.discountAmount
      }))
    };

    const totalFormatted = `${this.grandTotal().toFixed(2)} ETB`;
    const itemCount = this.cartItemCount();
    const itemText = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
    const customerInfo = customerName ? ` for ${customerName}` : '';

    this.confirmDialog.confirm({
      title: 'Confirm Sale',
      message: `Are you sure you want to submit this sale of ${itemText}${customerInfo} for a total of ${totalFormatted} using ${this.paymentMethod()}?`,
      type: 'info',
      confirmText: 'Submit Sale',
      cancelText: 'Cancel',
      icon: 'point_of_sale'
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.isSubmitting.set(true);

      this.saleService.createSale(payload).subscribe({
        next: (completedSale: Sale) => {
          this.isSubmitting.set(false);
          this.snackBar.open(`Sale #${completedSale.saleNumber} completed successfully!`, 'Success', {
            duration: 3500,
            panelClass: ['snackbar-success']
          });

          // Open Receipt Modal
          this.dialog.open(SaleDetailsDialogComponent, {
            data: { sale: completedSale },
            width: '680px',
            panelClass: 'pos-receipt-modal'
          });

          // Reset cart & refresh product inventory stock levels
          this.clearCart();
          this.loadProducts();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err?.error?.detail || err?.message || 'Failed to complete sale transaction.';
          this.snackBar.open(msg, 'Close', { duration: 4500 });
        }
      });
    });
  }
}