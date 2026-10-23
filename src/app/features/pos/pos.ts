import { Component, OnInit, OnDestroy, signal, computed, inject, effect } from '@angular/core';
import { TenantApiService } from '../../services/tenant';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
import { BarcodeScannerDialog } from '../../shared/components/barcode-scanner-dialog/barcode-scanner-dialog';
import { SaleDetailsDialogComponent } from '../../component/sale-details-dialog/sale-details-dialog';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { CustomerDialogComponent } from '../customers/customer-dialog/customer-dialog';
import { environment } from '../../../environments/environment';
import {
  PosPaymentVerificationDialogComponent,
  PosPaymentVerificationDialogResult
} from './components/pos-payment-verification-dialog/pos-payment-verification-dialog';
import { setDraft, getDraft, removeDraft } from '../../utils/draft-storage';

export type PosCheckoutState =
  | 'idle'
  | 'verifyingPayment'
  | 'paymentVerified'
  | 'verificationFailed'
  | 'verificationSkipped'
  | 'confirmingSale'
  | 'saleCompleted';

export interface CartItem {
  product: Product;
  quantity: number;
  discountAmount: number;
  isBottleExchange: boolean;
  bottleDepositAmount: number;
}

export interface PosDraft {
  cart: CartItem[];
  selectedCustomerId: string | null;
  manualCustomerName: string;
  paymentMethod: string;
  amountReceived: number;
  discountAmount: number;
  taxRatePercent: number;
  additionalBottleDeposit: number;
  saleNotes: string;
  showNotes: boolean;
  savedAt?: number;
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
      MatCheckboxModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule
  , TranslocoDirective],
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
  private translocoService = inject(TranslocoService);
  private tenantService = inject(TenantApiService);

  readonly baseUrl = environment.apiUrl.replace('/api', '');

  // State Signals
  products = signal<Product[]>([]);
  isBottleManagementEnabled = this.tenantService.isBottleManagementEnabled;
  isPaymentVerificationEnabled = this.tenantService.isPaymentVerificationEnabled;
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
  availableBanks = [
    { code: 'CBE', name: 'CBE' },
    { code: 'Awash Bank', name: 'Awash' },
    { code: 'Bank of Abyssinia', name: 'Abyssinia' },
    { code: 'Dashen Bank', name: 'Dashen' },
    { code: 'Cooperative Bank of Oromia', name: 'Coop' },
    { code: 'Hibret Bank', name: 'Hibret' },
    { code: 'Other Bank', name: 'Other' }
  ];
  selectedBank = signal<string>('CBE');
  amountReceived = signal<number>(0);
  discountAmount = signal<number>(0);
  taxRatePercent = signal<number>(0);
  additionalBottleDeposit = signal<number>(0);
  saleNotes = signal<string>('');
  showNotes = signal<boolean>(false);

  isLoadingProducts = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  checkoutState = signal<PosCheckoutState>('idle');
  activeVerificationId = signal<string | null>(null);
  
  // Mobile UI toggle state
  isMobileCheckoutView = signal<boolean>(false);

  // Live terminal clock — a small, honest nod to real point-of-sale hardware
  currentTime = signal<Date>(new Date());
  private clockHandle = setInterval(() => this.currentTime.set(new Date()), 1000);

  readonly isDraftLoaded = signal<boolean>(false);
  private saveDraftTimeout: any = null;

  constructor() {
    effect(() => {
      // Guard: establish reactive signal dependency so effect re-evaluates when draft is restored
      if (!this.isDraftLoaded()) return;

      const cart = this.cart();
      const customerId = this.selectedCustomerId();
      const manualName = this.manualCustomerName();
      const paymentMethod = this.paymentMethod();
      const amountReceived = this.amountReceived();
      const discount = this.discountAmount();
      const taxRate = this.taxRatePercent();
      const addDeposit = this.additionalBottleDeposit();
      const notes = this.saleNotes();
      const showNotes = this.showNotes();

      if (this.saveDraftTimeout) {
        clearTimeout(this.saveDraftTimeout);
      }

      if (cart.length > 0 || customerId || manualName || notes) {
        this.saveDraftTimeout = setTimeout(() => {
          setDraft('posDraft', {
            cart,
            selectedCustomerId: customerId,
            manualCustomerName: manualName,
            paymentMethod,
            amountReceived,
            discountAmount: discount,
            taxRatePercent: taxRate,
            additionalBottleDeposit: addDeposit,
            saleNotes: notes,
            showNotes,
            savedAt: Date.now()
          });
        }, 150);
      } else {
        removeDraft('posDraft');
      }
    });
  }

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

  readonly totalBottleDeposit = computed(() =>
    this.cart().reduce((sum, item) => sum + (item.isBottleExchange ? 0 : (item.quantity * item.bottleDepositAmount)), 0)
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
    Math.max(0, this.cartSubtotal() - this.totalDiscount() + this.calculatedTax()) + this.totalBottleDeposit() + Math.max(0, this.additionalBottleDeposit())
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
    this.loadPaymentVerificationSetting();
    this.restoreDraft();
  }

  private async restoreDraft(): Promise<void> {
    try {
      const draft = await getDraft<PosDraft>('posDraft');
      if (draft) {
        if (Array.isArray(draft.cart) && draft.cart.length > 0) {
          this.cart.set(draft.cart);
        }
        if (draft.selectedCustomerId !== undefined) this.selectedCustomerId.set(draft.selectedCustomerId);
        if (draft.manualCustomerName !== undefined) this.manualCustomerName.set(draft.manualCustomerName);
        if (draft.paymentMethod !== undefined) this.paymentMethod.set(draft.paymentMethod);
        if (draft.amountReceived !== undefined) this.amountReceived.set(draft.amountReceived);
        if (draft.discountAmount !== undefined) this.discountAmount.set(draft.discountAmount);
        if (draft.taxRatePercent !== undefined) this.taxRatePercent.set(draft.taxRatePercent);
        if (draft.additionalBottleDeposit !== undefined) this.additionalBottleDeposit.set(draft.additionalBottleDeposit);
        if (draft.saleNotes !== undefined) this.saleNotes.set(draft.saleNotes);
        if (draft.showNotes !== undefined) this.showNotes.set(draft.showNotes);
      }
    } catch (e) {
      console.error('Failed to restore POS draft from IndexedDB', e);
    } finally {
      this.isDraftLoaded.set(true);
    }
  }

  loadPaymentVerificationSetting(): void {
    this.tenantService.getPosPaymentVerification().subscribe({
      next: (setting) => {
        if (setting && typeof setting.enabled === 'boolean') {
          this.tenantService.isPaymentVerificationEnabled.set(setting.enabled);
        }
      },
      error: (err) => {
        console.warn('Could not fetch POS payment verification setting, using cached state', err);
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.clockHandle);
    if (this.saveDraftTimeout) {
      clearTimeout(this.saveDraftTimeout);
      this.saveDraftTimeout = null;
    }
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

  onBarcodeScanned(barcode: string): void {
    const trimmed = barcode?.trim();
    if (!trimmed) return;

    this.productService.getByBarcode(trimmed).subscribe({
      next: (product: Product) => {
        if (!product.isActive) {
          this.snackBar.open(
            this.translocoService.translate('pos.productInactive'),
            this.translocoService.translate('pos.close'),
            { duration: 3000 }
          );
          return;
        }
        this.addToCart(product);
      },
      error: (err) => {
        if (err.status === 404) {
          this.snackBar.open(
            this.translocoService.translate('pos.barcodeNotFound', { barcode: trimmed }),
            this.translocoService.translate('pos.close'),
            { duration: 3000 }
          );
        } else {
          this.snackBar.open(
            this.translocoService.translate('pos.barcodeError'),
            this.translocoService.translate('pos.close'),
            { duration: 3000 }
          );
        }
      }
    });
  }

  openCameraScanner(): void {
    const dialogRef = this.dialog.open(BarcodeScannerDialog, {
      width: '100%',
      maxWidth: '500px'
    });

    dialogRef.afterClosed().subscribe((barcode: string | undefined) => {
      if (barcode) {
        this.snackBar.open(
          this.translocoService.translate('pos.barcodeDetected'),
          this.translocoService.translate('pos.close'),
          { duration: 1500 }
        );
        this.onBarcodeScanned(barcode);
      }
    });
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

  isElectronicPayment(method: string): boolean {
    if (!method) return false;
    const m = method.trim().toLowerCase();
    return m === 'mobile banking' || m === 'telebirr' || m === 'card' || m.includes('bank') || m.includes('transfer');
  }

  private resetVerificationState(): void {
    this.activeVerificationId.set(null);
    if (this.checkoutState() !== 'idle' && this.checkoutState() !== 'verifyingPayment') {
      this.checkoutState.set('idle');
    }
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
      this.cart.set([...currentCart, { product, quantity: 1, discountAmount: 0 , isBottleExchange: true, bottleDepositAmount: product.isReturnable ? (product.bottleDepositAmount || 0) : 0 }]);
    }
    this.resetVerificationState();
  }

  toggleBottleExchange(index: number): void {
    if (!this.isBottleManagementEnabled()) return;
    const currentCart = [...this.cart()];
    if (index < 0 || index >= currentCart.length) return;
    currentCart[index].isBottleExchange = !currentCart[index].isBottleExchange;
    this.cart.set(currentCart);
    this.resetVerificationState();
  }

  setBottleExchange(index: number, value: boolean): void {
    if (!this.isBottleManagementEnabled()) return;
    const currentCart = [...this.cart()];
    if (index < 0 || index >= currentCart.length) return;
    currentCart[index].isBottleExchange = value;
    this.cart.set(currentCart);
    this.resetVerificationState();
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
    this.resetVerificationState();
  }

  removeItem(index: number): void {
    const currentCart = [...this.cart()];
    currentCart.splice(index, 1);
    this.cart.set(currentCart);
    if (this.cart().length === 0) {
      this.isMobileCheckoutView.set(false);
    }
    this.resetVerificationState();
  }

  clearCart(): void {
    if (this.saveDraftTimeout) {
      clearTimeout(this.saveDraftTimeout);
      this.saveDraftTimeout = null;
    }
    this.cart.set([]);
    this.discountAmount.set(0);
    this.additionalBottleDeposit.set(0);
    this.amountReceived.set(0);
    this.manualCustomerName.set('');
    this.selectedCustomerId.set(null);
    this.saleNotes.set('');
    this.showNotes.set(false);
    this.isMobileCheckoutView.set(false);
    this.resetVerificationState();
    removeDraft('posDraft');
  }

  clearCustomer(): void {
    this.selectedCustomerId.set(null);
    this.manualCustomerName.set('');
    this.resetVerificationState();
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
        this.resetVerificationState();
      } else if (result) {
        this.loadCustomers();
      }
    });
  }

  setPaymentMethod(method: string): void {
    this.paymentMethod.set(method);
    // Always sync amount received to grand total for non-manual payment modes
    this.amountReceived.set(parseFloat(this.grandTotal().toFixed(2)));
    this.resetVerificationState();
  }

  completeSale(): void {
    // Prevent duplicate checkout actions
    if (this.isSubmitting() || this.checkoutState() === 'verifyingPayment' || this.checkoutState() === 'confirmingSale') {
      return;
    }

    if (this.cart().length === 0) {
      this.snackBar.open('Cannot complete sale with an empty shopping cart.', 'Close', { duration: 3000 });
      return;
    }

    const hasPendingDeposits = this.isBottleManagementEnabled() && this.cart().some(item => item.product.isReturnable && !item.isBottleExchange);
    if (hasPendingDeposits && !this.selectedCustomerId()) {
      this.snackBar.open('A registered customer must be selected to track bottle deposits.', 'Close', { duration: 4500 });
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
      bankName: this.paymentMethod() === 'Mobile Banking' ? this.selectedBank() : (this.paymentMethod() === 'Telebirr' ? 'Telebirr' : undefined),
      amountReceived: grandTotalVal,
      discountAmount: this.discountAmount(),
      taxAmount: parseFloat(this.calculatedTax().toFixed(2)),
      additionalBottleDeposit: this.additionalBottleDeposit(),
      notes: this.saleNotes().trim() || undefined,
      items: this.cart().map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        discountAmount: item.discountAmount,
        isBottleExchange: item.isBottleExchange,
        bottleDepositAmount: item.bottleDepositAmount
      }))
    };

    // If electronic payment method AND POS payment verification is enabled, open verification modal before confirmation modal
    if (this.isPaymentVerificationEnabled() && this.isElectronicPayment(this.paymentMethod())) {
      this.openPaymentVerificationModal(payload, customerName);
    } else {
      this.openConfirmSaleModal(payload, customerName);
    }
  }

  private openPaymentVerificationModal(payload: CreateSaleRequest, customerName: string): void {
    this.checkoutState.set('verifyingPayment');

    const dialogRef = this.dialog.open(PosPaymentVerificationDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'payment-verification-dialog-panel',
      disableClose: true,
      autoFocus: false,
      data: {
        totalAmount: parseFloat(this.grandTotal().toFixed(2)),
        customerName: customerName || undefined,
        paymentMethod: this.paymentMethod(),
        cartPayload: payload,
        saleReference: 'POS Checkout'
      }
    });

    dialogRef.afterClosed().subscribe((result?: PosPaymentVerificationDialogResult) => {
      if (result?.action === 'verified') {
        this.checkoutState.set('paymentVerified');
        this.activeVerificationId.set(result.verification.verificationId);
        // Seamlessly open confirm sale modal after successful verification
        this.openConfirmSaleModal(payload, customerName);
      } else if (result?.action === 'skipped') {
        this.checkoutState.set('verificationSkipped');
        this.activeVerificationId.set(null);
        this.snackBar.open(
          'Payment verification skipped. Continue to confirm this sale?',
          'OK',
          { duration: 3500 }
        );
        // Seamlessly open confirm sale modal after skip
        this.openConfirmSaleModal(payload, customerName);
      } else {
        // Cancelled: preserve cart and customer, reset to idle
        this.checkoutState.set('idle');
      }
    });
  }

  private openConfirmSaleModal(payload: CreateSaleRequest, customerName: string): void {
    this.checkoutState.set('confirmingSale');

    const totalFormatted = `${this.grandTotal().toFixed(2)} ETB`;
    const itemCount = this.cartItemCount();
    const itemText = this.translocoService.translate(itemCount === 1 ? 'posDialog.item' : 'posDialog.items', { count: itemCount });
    const customerInfo = customerName ? this.translocoService.translate('posDialog.forCustomer', { name: customerName }) : '';

    let paymentMethodKey = 'pos.cash';
    if (this.paymentMethod() === 'Card') paymentMethodKey = 'pos.card';
    else if (this.paymentMethod() === 'Mobile Banking') paymentMethodKey = 'pos.mobileBanking';
    else if (this.paymentMethod() === 'Telebirr') paymentMethodKey = 'pos.telebirr';
    let translatedPaymentMethod = this.translocoService.translate(paymentMethodKey);
    if (this.paymentMethod() === 'Mobile Banking' && this.selectedBank()) {
      translatedPaymentMethod += ` (${this.selectedBank()})`;
    }

    this.confirmDialog.confirm({
      title: this.translocoService.translate('posDialog.title'),
      message: this.translocoService.translate('posDialog.message', { itemText, customerInfo, totalFormatted, paymentMethod: translatedPaymentMethod }),
      type: 'info',
      confirmText: this.translocoService.translate('posDialog.submit'),
      cancelText: this.translocoService.translate('posDialog.cancel'),
      icon: 'point_of_sale'
    }).subscribe((confirmed) => {
      if (!confirmed) {
        if (this.checkoutState() === 'confirmingSale') {
          this.checkoutState.set('idle');
        }
        return;
      }

      this.isSubmitting.set(true);

      // Attach verification result or skipped indicator to payload
      if (this.activeVerificationId()) {
        payload.paymentVerificationId = this.activeVerificationId();
        payload.verificationSkipped = false;
      } else if (this.checkoutState() === 'verificationSkipped') {
        payload.paymentVerificationId = undefined;
        payload.verificationSkipped = true;
      } else {
        payload.paymentVerificationId = undefined;
        payload.verificationSkipped = false;
      }

      this.saleService.createSale(payload).subscribe({
        next: (completedSale: Sale) => {
          this.isSubmitting.set(false);
          this.checkoutState.set('saleCompleted');

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
          this.isMobileCheckoutView.set(false);
          this.checkoutState.set('idle');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.checkoutState.set('idle');
          const msg = err?.error?.detail || err?.message || 'Failed to complete sale transaction.';
          this.snackBar.open(msg, 'Close', { duration: 4500 });
        }
      });
    });
  }
}


