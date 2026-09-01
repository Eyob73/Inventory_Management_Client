import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupplierService } from '../../../services/supplier';
import { ProductService } from '../../../services/product';
import { PurchaseService } from '../../../services/purchase';
import { Supplier } from '../../../models/supplier.model';
import { Product } from '../../../models/products.model';
import { CreatePurchaseDto, Purchase } from '../../../models/purchase.model';
import { PurchaseStore } from '../../../store/purchase.store';

@Component({
  selector: 'app-purchase-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './purchase-form.html',
  styleUrl: './purchase-form.scss',
})
export class PurchaseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierApi = inject(SupplierService);
  private productApi = inject(ProductService);
  private purchaseApi = inject(PurchaseService);
  private snackBar = inject(MatSnackBar);
  private purchaseStore = inject(PurchaseStore);

  suppliers = signal<Supplier[]>([]);
  products = signal<Product[]>([]);
  isSubmitting = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  purchaseId = signal<string | null>(null);
  purchaseNumber = signal<string | null>(null);

  isEditMode = computed(() => !!this.purchaseId());

  form: FormGroup = this.fb.group({
    supplierId: [''],
    purchaseDate: [this.toDateInput(new Date()), Validators.required],
    notes: [''],
    items: this.fb.array([this.createLine()]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.supplierApi.getAll().subscribe({
      next: (list) => this.suppliers.set(list.filter((s) => s.isActive !== false)),
      error: (err) => this.errorMessage.set(this.errMsg(err, 'Failed to load suppliers')),
    });
    this.productApi.getCatalog().subscribe({
      next: (list) => this.products.set(list.filter((p) => p.isActive !== false)),
      error: (err) => this.errorMessage.set(this.errMsg(err, 'Failed to load products')),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.purchaseId.set(id);
    this.isLoading.set(true);
    this.purchaseApi.getById(id).subscribe({
      next: (purchase) => this.patchPurchase(purchase),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.errMsg(err, 'Failed to load purchase'));
      },
    });
  }

  addLine(): void {
    this.items.push(this.createLine());
  }

  removeLine(index: number): void {
    if (this.items.length === 1) return;
    this.items.removeAt(index);
  }

  findProduct(productId: string | null | undefined): Product | undefined {
    if (!productId) return undefined;
    return this.products().find((p) => p.id === productId);
  }

  lineCost(index: number): number {
    const productId = this.items.at(index).get('productId')?.value;
    return Number(this.findProduct(productId)?.cost) || 0;
  }

  lineQuantity(index: number): number {
    return Number(this.items.at(index).get('quantity')?.value) || 0;
  }

  lineTotal(index: number): number {
    return this.lineQuantity(index) * this.lineCost(index);
  }

  grandTotal(): number {
    return this.items.controls.reduce((sum, _, i) => sum + this.lineTotal(i), 0);
  }

  isLineInvalid(index: number, controlName: string): boolean {
    const control = this.items.at(index).get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  selectedProductIds(exceptIndex: number): Set<string> {
    return new Set(
      this.items.controls
        .map((c, i) => (i === exceptIndex ? '' : (c.get('productId')?.value as string)))
        .filter(Boolean),
    );
  }

  availableProducts(index: number): Product[] {
    const taken = this.selectedProductIds(index);
    const currentId = this.items.at(index).get('productId')?.value;
    return this.products().filter((p) => p.id === currentId || !taken.has(p.id));
  }

  cancel(): void {
    this.router.navigate(['/purchases']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const dto: CreatePurchaseDto = {
      supplierId: value.supplierId || null,
      purchaseDate: new Date(value.purchaseDate).toISOString(),
      notes: value.notes?.trim() || undefined,
      items: value.items.map((line: { productId: string; quantity: number }) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
      })),
    };

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const request = this.isEditMode()
      ? this.purchaseApi.update(this.purchaseId()!, { id: this.purchaseId()!, ...dto })
      : this.purchaseApi.create(dto);

    request.subscribe({
      next: (saved) => {
        this.isSubmitting.set(false);
        this.purchaseStore.loadPurchases();
        this.snackBar.open(
          this.isEditMode() ? 'Draft purchase updated.' : 'Draft purchase created.',
          'Close',
          { duration: 3000 },
        );
        this.router.navigate(['/purchases', saved.id]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.errMsg(err, 'Failed to save purchase'));
      },
    });
  }

  private createLine(productId = '', quantity: number | null = 1): FormGroup {
    return this.fb.group({
      productId: [productId, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(1)]],
    });
  }

  private patchPurchase(purchase: Purchase): void {
    if (purchase.status !== 'Draft') {
      this.router.navigate(['/purchases', purchase.id]);
      return;
    }

    this.purchaseNumber.set(purchase.purchaseNumber);
    this.items.clear();
    (purchase.items || []).forEach((item) => {
      this.items.push(this.createLine(item.productId, item.quantity));
    });
    if (this.items.length === 0) this.items.push(this.createLine());

    this.form.patchValue({
      supplierId: purchase.supplierId || '',
      purchaseDate: this.toDateInput(new Date(purchase.purchaseDate)),
      notes: purchase.notes || '',
    });
    this.isLoading.set(false);
  }

  private toDateInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private errMsg(err: any, fallback: string): string {
    return typeof err?.error === 'string'
      ? err.error
      : err?.error?.detail || err?.message || fallback;
  }
}
