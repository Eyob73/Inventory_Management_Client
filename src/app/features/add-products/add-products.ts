import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";

@Component({
  selector: 'app-add-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-products.html',
  styleUrl: './add-products.scss',
})
export class AddProducts {
  private fb = inject(FormBuilder);
  submitted = signal(false);

  productForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
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

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    console.log(this.productForm.value);
    this.submitted.set(true);
    this.productForm.reset();
  }
}