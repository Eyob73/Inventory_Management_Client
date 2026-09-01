import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../../models/category.model';

export interface CategoryDialogData {
  category?: Category;
  existingNames?: string[];
}

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './category-dialog.html',
  styleUrl: './category-dialog.scss',
})
export class CategoryDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  public data = inject<CategoryDialogData>(MAT_DIALOG_DATA, { optional: true });

  form!: FormGroup;
  isEdit = false;
  duplicateError = false;

  ngOnInit(): void {
    const cat = this.data?.category;
    this.isEdit = !!cat;

    this.form = this.fb.group({
      name: [cat?.name || '', [Validators.required, Validators.maxLength(100)]],
      description: [cat?.description || '', [Validators.maxLength(500)]],
      isActive: [cat?.isActive !== undefined ? cat.isActive : true, [Validators.required]],
    });
  }

  get isNameInvalid(): boolean {
    const control = this.form.get('name');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSave(): void {
    this.duplicateError = false;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const trimmedName = val.name.trim();

    // Validate duplicate name
    const existing = this.data?.existingNames || [];
    const currentName = this.data?.category?.name?.toLowerCase().trim();
    if (
      existing.some(
        (n) => n.toLowerCase().trim() === trimmedName.toLowerCase() && n.toLowerCase().trim() !== currentName
      )
    ) {
      this.duplicateError = true;
      return;
    }

    if (this.isEdit && this.data?.category) {
      const dto: UpdateCategoryDto = {
        id: this.data.category.id,
        name: trimmedName,
        description: val.description?.trim() || '',
        isActive: val.isActive,
      };
      this.dialogRef.close(dto);
    } else {
      const dto: CreateCategoryDto = {
        name: trimmedName,
        description: val.description?.trim() || '',
        isActive: val.isActive,
      };
      this.dialogRef.close(dto);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
