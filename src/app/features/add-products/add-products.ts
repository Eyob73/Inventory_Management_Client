import { TranslocoDirective } from '@jsverse/transloco';
import { Component, inject, signal, effect, OnInit, PLATFORM_ID } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
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
import { SupplierService } from '../../services/supplier';
import { BottleTypesService } from '../../core/services/bottle-types';
import { environment } from "../../../environments/environment.development";
import { TenantApiService } from '../../services/tenant';

import { MatIconModule } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BarcodeScannerDialog } from '../../shared/components/barcode-scanner-dialog/barcode-scanner-dialog';
let dbPromise: Promise<IDBDatabase> | null = null;
function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('InventoryDraftsDB', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('drafts');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function setDraft(key: string, value: any) {
  try {
    const db = await getDB();
    const tx = db.transaction('drafts', 'readwrite');
    tx.objectStore('drafts').put(value, key);
  } catch (e) {
    console.error('IndexedDB save failed', e);
  }
}

async function getDraft(key: string): Promise<any> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readonly');
      const req = tx.objectStore('drafts').get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('IndexedDB read failed', e);
    return null;
  }
}

async function removeDraft(key: string) {
  try {
    const db = await getDB();
    const tx = db.transaction('drafts', 'readwrite');
    tx.objectStore('drafts').delete(key);
  } catch (e) {}
}

@Component({
  selector: 'app-add-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatDialogModule, TranslocoDirective],
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
  private bottleTypesService = inject(BottleTypesService);
  private tenantService = inject(TenantApiService);

  isError = signal(false);
  submissionStatus = signal<string | null>(null);
  isBottleManagementEnabled = this.tenantService.isBottleManagementEnabled;
  readonly isEditMode = signal(false);
  readonly productId = signal<string | null>(null);
  private wasSubmitting = false;

  readonly categoriesResource = rxResource({
    stream: () => this.categoryService.getAll(),
  });

  readonly suppliersResource = rxResource({
    stream: () => this.supplierService.getAll(),
  });

  readonly bottleTypesResource = rxResource({
    stream: () => this.bottleTypesService.getBottleTypes(),
  });

  productForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    cost: [null as number | null, [Validators.min(0)]],
    stock: [{ value: 0, disabled: true }],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
    category: ['', Validators.required],
    supplierId: [''],
    sku: [''],
    barcode: [''],
    isReturnable: [false],
    bottleTypeId: [null as string | null],
    variants: this.fb.array([
      this.fb.group({
        name: [''],
        value: [''],
        stock: [null as number | null],
      }),
    ]),
  });

  private platformId = inject(PLATFORM_ID);

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
        if (isPlatformBrowser(this.platformId)) {
          removeDraft('addProductDraft');
          removeDraft('addProductDraftImage');
        }
        this.submissionStatus.set(
          this.isEditMode() ? 'Product updated successfully!' : 'Product saved successfully!'
        );
        setTimeout(() => this.router.navigate(['/products']), 1000);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.isEditMode.set(true);
      this.productId.set(id);
      this.productService.getById(id).subscribe({
        next: (product) => this.patchForm(product),
        error: (err) => {
          this.isError.set(true);
          this.submissionStatus.set(err?.error?.detail || 'Failed to load product for editing.');
        },
      });
    } else {
      // Auto-restore draft for Add Mode
      if (isPlatformBrowser(this.platformId)) {
        getDraft('addProductDraft').then(parsed => {
          if (parsed) {
            try {
              // ensure variants array has enough controls before patching
              if (parsed.variants && parsed.variants.length > 1) {
                for (let i = 1; i < parsed.variants.length; i++) {
                  this.addVariant();
                }
              }
              this.productForm.patchValue(parsed);
            } catch (e) {
              console.error('Failed to restore draft', e);
            }
          }
        });

        getDraft('addProductDraftImage').then((file: File | null) => {
          if (file) {
            this.selectedFile.set(file);
            this.removeImageFlag.set(false);
            const objectUrl = URL.createObjectURL(file);
            this.imagePreview.set(objectUrl);
          }
        });
      }
    }

    // Auto-save form changes
    this.productForm.valueChanges.subscribe(val => {
      if (!this.isEditMode() && isPlatformBrowser(this.platformId)) {
        setDraft('addProductDraft', val);
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
    if (isPlatformBrowser(this.platformId)) {
      removeDraft('addProductDraft');
      removeDraft('addProductDraftImage');
    }
    this.router.navigate(['/products']);
  }

  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  removeImageFlag = signal<boolean>(false);

  removeImage(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.selectedFile.set(null);
    if (isPlatformBrowser(this.platformId)) {
      removeDraft('addProductDraftImage');
    }
    const currentPreview = this.imagePreview();
    if (currentPreview && currentPreview.startsWith('blob:')) {
      URL.revokeObjectURL(currentPreview);
    }
    this.imagePreview.set(null);
    this.removeImageFlag.set(true);
    
    // Reset the file inputs
    const fileInput = document.getElementById('productImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    const fileInputCamera = document.getElementById('productImageCamera') as HTMLInputElement;
    if (fileInputCamera) fileInputCamera.value = '';
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile.set(file);
      this.removeImageFlag.set(false);
      
      // Save image to IndexedDB so it survives a reload
      if (isPlatformBrowser(this.platformId)) {
        setDraft('addProductDraftImage', file);
      }
      
      // Clear any previous object URL to free memory
      const currentPreview = this.imagePreview();
      if (currentPreview && currentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreview);
      }
      
      // Use createObjectURL instead of FileReader to prevent mobile browser memory crashes
      const objectUrl = URL.createObjectURL(file);
      this.imagePreview.set(objectUrl);
    }
  }

  private dialog = inject(MatDialog);

  openCameraScanner(): void {
    const dialogRef = this.dialog.open(BarcodeScannerDialog, {
      width: '100%',
      maxWidth: '500px'
    });

    dialogRef.afterClosed().subscribe((barcode: string | undefined) => {
      if (barcode) {
        this.productForm.patchValue({ barcode });
        this.productForm.get('barcode')?.markAsDirty();
      }
    });
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

    const image = this.selectedFile() ?? undefined;

    if (this.isEditMode() && this.productId()) {
      this.productStore.updateProduct({ 
        id: this.productId()!, 
        payload, 
        image, 
        removeImage: this.removeImageFlag() 
      });
    } else {
      this.productStore.createProduct({ payload, image });
    }
  }

  private patchForm(product: Product): void {
    if (product.imageUrl) {
      const baseUrl = environment.apiUrl.replace('/api', '');
      this.imagePreview.set(`${baseUrl}${product.imageUrl}`);
    }
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
      barcode: product.barcode || '',
      isReturnable: product.isReturnable ?? false,
      bottleTypeId: product.bottleTypeId || null,
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
      barcode: rawValue.barcode || '',
      isReturnable: rawValue.isReturnable ?? false,
      bottleTypeId: rawValue.isReturnable ? (rawValue.bottleTypeId || null) : null,
      categoryId: rawValue.category || '',
      supplierId: rawValue.supplierId || null,
    };
    if (this.productId()) {
      payload.id = this.productId()!;
    }
    return payload;
  }
}


