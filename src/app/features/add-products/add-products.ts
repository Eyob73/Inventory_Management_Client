import { Component, inject, signal, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
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
import { CategoryService } from "../../services/category";

@Component({
  selector: 'app-add-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './add-products.html',
  styleUrl: './add-products.scss',
})
export class AddProducts {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  readonly productStore = inject(ProductStore);
  private categoryService = inject(CategoryService);

  isError = signal(false);
  submissionStatus = signal<string | null>(null);
  private wasSubmitting = false;

  readonly categoriesResource = rxResource({
    stream: () => this.categoryService.getAll(),
  });

  productForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    cost: [null as number | null, [Validators.min(0)]],
    stock: [null as number | null, [Validators.required, Validators.min(0)]],
    category: [''],
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
        this.submissionStatus.set('Product saved successfully!');
        setTimeout(() => this.router.navigate(['/products']), 1000);
      }
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

    const rawValue = this.productForm.getRawValue();
    const payload: Partial<Product> = {
      name: rawValue.name || '',
      description: rawValue.description || '',
      price: rawValue.price ?? 0,
      cost: rawValue.cost ?? 0,
      quantityInStock: rawValue.stock ?? 0,
      sku: rawValue.sku || '',
      categoryId: rawValue.category || '',
      supplierId: null,
    };

    this.wasSubmitting = true;
    this.isError.set(false);
    this.submissionStatus.set('Submitting product to store...');
    this.productStore.createProduct(payload);
  }
}