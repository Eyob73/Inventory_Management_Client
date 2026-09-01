import { Component, inject, signal, effect, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { rxResource } from "@angular/core/rxjs-interop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { Product } from "../../models/products.model";
import { ProductStore } from "../../store/products.store";
import { ProductService } from "../../services/product";
import { CategoryService } from "../../services/category";
import { SupplierService } from "../../services/supplier";

@Component({
  selector: 'app-add-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './add-products.html',
  styleUrl: './add-products.scss',
})
export class AddProducts implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  readonly productStore = inject(ProductStore);
  private categoryService = inject(CategoryService);
  private supplierService = inject(SupplierService);

  isError = signal(false);
  submissionStatus = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly productId = signal<string | null>(null);
  private wasSubmitting = false;

  readonly categoriesResource = rxResource({
    stream: () => this.categoryService.getAll(),
  });

  readonly suppliersResource = rxResource({
    stream: () => this.supplierService.getAll(),
  });

  productForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    cost: [null as number | null, [Validators.min(0)]],
    stock: [{ value: 0, disabled: true }],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
    category: [''],
    supplierId: [''],
    sku: [''],
    variants: this.fb.array([
      this.fb.group({
        name: [''],
        value: [''],
        stock: [null as number | null],
      }),
    ]),
  });

  constructor() {
    effect(() => {
      const isLoading = this.productStore.isLoading();
      const error = this.productStore.error();

      if (error && this.wasSubmitting) {
        this.wasSubmitting = false;
        this.isError.set(true);
        this.submissionStatus.set(`Submission failed: ${error}`);
      } else if (!isLoading && this.wasSubmitting && !error) {
        this.wasSubmitting = false;
        this.isError.set(false);
        this.submissionStatus.set(
          this.isEditMode() ? 'Product updated successfully!' : 'Product saved successfully!'
        );
        setTimeout(() => this.router.navigate(['/products']), 1000);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isEditMode.set(true);
    this.productId.set(id);
    this.productService.getById(id).subscribe({
      next: (product) => this.patchForm(product),
      error: (err) => {
        this.isError.set(true);
        this.submissionStatus.set(err?.error?.detail || 'Failed to load product for editing.');
      },
    });
  }

  get variants() {
    return this.productForm.controls.variants;
  }

  addVariant() {
    this.variants.push(
      this.fb.group({
        name: [''],
        value: [''],
        stock: [null as number | null],
      })
    );
  }

  removeVariant(index: number) {
    this.variants.removeAt(index);
  }

  isInvalid(controlName: string): boolean {
    const control = this.productForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  isVariantInvalid(index: number, controlName: string): boolean {
    const control = this.variants.at(index).get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  cancel() {
    this.router.navigate(['/products']);
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.wasSubmitting = true;
    this.isError.set(false);
    this.submissionStatus.set(this.isEditMode() ? 'Updating product…' : 'Submitting product to store...');

    if (this.isEditMode() && this.productId()) {
      this.productStore.updateProduct({ id: this.productId()!, payload });
    } else {
      this.productStore.createProduct(payload);
    }
  }

  private patchForm(product: Product): void {
    this.productForm.patchValue({
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? null,
      cost: product.cost ?? null,
      stock: product.quantityInStock ?? 0,
      minimumStock: product.minimumStock ?? product.minimumStockLevel ?? 0,
      isActive: product.isActive ?? true,
      category: product.categoryId || '',
      supplierId: product.supplierId || '',
      sku: product.sku || '',
    });
  }

  private buildPayload(): Partial<Product> {
    const rawValue = this.productForm.getRawValue();
    const payload: Partial<Product> = {
      name: rawValue.name || '',
      description: rawValue.description || '',
      price: rawValue.price ?? 0,
      cost: rawValue.cost ?? 0,
      quantityInStock: 0,
      minimumStock: rawValue.minimumStock ?? 0,
      isActive: rawValue.isActive ?? true,
      sku: rawValue.sku || '',
      categoryId: rawValue.category || '',
      supplierId: rawValue.supplierId || null,
    };
    if (this.productId()) {
      payload.id = this.productId()!;
    }
    return payload;
  }
}
