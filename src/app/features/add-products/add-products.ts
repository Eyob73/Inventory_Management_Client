import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { ProductPayload, ProductService } from "../../services/product";
import { Subject, exhaustMap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-add-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-products.html',
  styleUrl: './add-products.scss',
})
export class AddProducts {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);

  api = inject(ProductService);
  isSubmitting = signal(false);
  isError = signal(false);
  submissionStatus = signal<string | null>(null);
  private submitClick$ = new Subject<ProductPayload>();

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

  constructor() {
    this.submitClick$
      .pipe(
        exhaustMap((payload) => {
          this.isSubmitting.set(true);
          this.isError.set(false);
          this.submissionStatus.set('Submitting product to server...');
          return this.api.create(payload);
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (result) => {
          this.isSubmitting.set(false);
          this.isError.set(false);
          this.submissionStatus.set(`Product saved successfully! ID: ${result?.id || ''}`);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.isError.set(true);
          this.submissionStatus.set(`Submission failed: ${err.message || 'Server error'}`);
        },
      });
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const rawValue = this.productForm.getRawValue();
    this.submitClick$.next({
      name: rawValue.name || '',
      description: rawValue.description || '',
      price: rawValue.price ?? 0,
      cost: rawValue.cost ?? 0,
      quantityInStock: rawValue.stock ?? 0,
      sku: rawValue.sku || '',
      categoryId: rawValue.category || '',
      supplierId: null,
      stock: rawValue.stock ?? 0
    });
  }
}