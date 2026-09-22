import { Component, input, computed, signal, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Product } from '../../../models/products.model';
import { getStockStatus } from '../../../utils/product-permissions';
import { environment } from '../../../../environments/environment.development';
import { ImagePreviewDialogComponent } from '../../../ui/image-preview-dialog/image-preview-dialog.component';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule, MatDialogModule,
    TranslocoDirective],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails {
  private dialog = inject(MatDialog);

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
  
  toggleFullscreen() {
    if (!this.imageUrl()) return;
    this.dialog.open(ImagePreviewDialogComponent, {
      data: { imageUrl: this.imageUrl(), altText: this.product().name },
      panelClass: 'fullscreen-image-dialog',
      backdropClass: 'fullscreen-image-backdrop',
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
    });
  }
}
