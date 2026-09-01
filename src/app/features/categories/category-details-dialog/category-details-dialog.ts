import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoryService, CategoryDetail } from '../../../services/category';
import { Product } from '../../../models/products.model';

export interface CategoryDetailsDialogData {
  categoryId: string;
}

@Component({
  selector: 'app-category-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './category-details-dialog.html',
  styleUrl: './category-details-dialog.scss',
})
export class CategoryDetailsDialogComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private dialogRef = inject(MatDialogRef<CategoryDetailsDialogComponent>);
  public data = inject<CategoryDetailsDialogData>(MAT_DIALOG_DATA);

  categoryDetail = signal<CategoryDetail | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  displayedColumns = ['no', 'name', 'sku', 'price', 'stock'];

  ngOnInit(): void {
    if (!this.data?.categoryId) {
      this.error.set('Invalid Category ID.');
      this.isLoading.set(false);
      return;
    }

    this.categoryService.getById(this.data.categoryId).subscribe({
      next: (detail) => {
        this.categoryDetail.set(detail);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to load category details.');
        this.isLoading.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
