import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/products.model';

@Component({
  selector: 'app-products-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './products-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './products-card.scss',
})
export class ProductsCard {
  product = input.required<Product>();
}
