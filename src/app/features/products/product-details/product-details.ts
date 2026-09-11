import { Component, input, computed, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../models/products.model';
import { getStockStatus } from '../../../utils/product-permissions';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails {
  @ViewChild('fullscreenDialog') dialogRef!: ElementRef<HTMLDialogElement>;

  readonly product = input.required<Product>();
  readonly categoryName = input<string | null>(null);
  readonly supplierName = input<string | null>(null);
  readonly showCost = input(true);

  readonly stockStatus = computed(() => getStockStatus(this.product().quantityInStock ?? 0));
  readonly imageUrl = computed(() => {
    const url = this.product().imageUrl;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return url ? `${baseUrl}${url}` : null;
  });
  readonly minStock = computed(() => this.product().minimumStockLevel ?? null);
  
  readonly isFullscreen = signal<boolean>(false);

  toggleFullscreen() {
    const dialog = this.dialogRef?.nativeElement;
    if (!dialog) return;

    if (this.isFullscreen()) {
      dialog.close();
      this.isFullscreen.set(false);
    } else {
      dialog.showModal();
      this.isFullscreen.set(true);
    }
  }

  closeDialog(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const dialog = this.dialogRef?.nativeElement;
    if (dialog) {
      dialog.close();
    }
    this.isFullscreen.set(false);
  }
}
