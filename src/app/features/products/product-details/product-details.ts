import { Component, input, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../models/products.model';
import { getStockStatus } from '../../../utils/product-permissions';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails {
  readonly product = input.required<Product>();
  readonly categoryName = input<string | null>(null);
  readonly supplierName = input<string | null>(null);
  readonly showCost = input(true);

  readonly stockStatus = computed(() => getStockStatus(this.product().quantityInStock ?? 0));
  readonly imageUrl = computed(() => this.product().imageUrl || null);
  readonly minStock = computed(() => this.product().minimumStockLevel ?? null);
}
