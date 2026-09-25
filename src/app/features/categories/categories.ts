import { TranslocoDirective } from '@jsverse/transloco';
import { Component, OnInit, inject, signal, effect, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Material Modules
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// Components & Services
import { TableSkeleton, TableSkeletonColumn } from '../../ui/table-skeleton/table-skeleton';
import { CategoryStore } from '../../store/category.store';
import { AuthService } from '../../services/auth';
import { Category } from '../../models/category.model';
import { CategoryDialogComponent } from './category-dialog/category-dialog';
import { CategoryDetailsDialogComponent } from './category-details-dialog/category-details-dialog';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { DataViewComponent, DataViewCardField, DataViewAction } from '../../shared/components/data-view/data-view.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    TableSkeleton, 
    TranslocoDirective,
    DataViewComponent
  ],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories implements OnInit {
  readonly store = inject(CategoryStore);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);

  dataSource = new MatTableDataSource<Category>([]);
  pageSizeOptions = [5, 10, 15, 25, 50];

  displayedColumns = [
    'no',
    'name',
    'description',
    'createdAt',
    'status',
    'productCount',
    'actions',
  ];

  cardFields = computed<DataViewCardField[]>(() => [
    { key: 'name', type: 'text' },
    { key: 'description', type: 'text' },
    { key: 'createdAt', label: 'Created', type: 'date' },
    { key: 'status', label: 'Status', type: 'badge', badgeClassFn: (c) => c.isActive !== false ? 'status--active' : 'status--inactive', valueFn: (c) => c.isActive !== false ? 'Active' : 'Inactive' },
    { key: 'productCount', label: 'Products', type: 'badge', badgeClassFn: () => 'products-count-badge', valueFn: (c) => c.productCount || 0 }
  ]);

  cardActions = computed<DataViewAction[]>(() => {
    const actions: DataViewAction[] = [
      { id: 'view', icon: 'visibility', label: 'View Details' }
    ];
    if (this.canEditCategory) {
      actions.push({ id: 'edit', icon: 'edit', label: 'Edit Category' });
    }
    if (this.canDeleteCategory) {
      actions.push({ id: 'delete', icon: 'delete_outline', label: 'Delete Category', color: 'warn' });
    }
    return actions;
  });

  onCardAction(event: { actionId: string, item: any }) {
    if (event.actionId === 'view') this.openDetailsDialog(event.item);
    else if (event.actionId === 'edit') this.openEditDialog(event.item);
    else if (event.actionId === 'delete') this.deleteCategory(event.item);
  }

  readonly skeletonColumns: TableSkeletonColumn[] = [
    { width: '5%' },
    { width: '22%' },
    { width: '30%' },
    { width: '15%' },
    { width: '10%' },
    { width: '8%', align: 'center' },
    { width: '10%', align: 'center' },
  ];

  @ViewChild(MatSort) set sort(sort: MatSort | undefined) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  constructor() {
    effect(() => {
      this.dataSource.data = this.store.paginatedCategories();
    });
  }

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (item: Category, property: string) => {
      switch (property) {
        case 'name': return item.name || '';
        case 'description': return item.description || '';
        case 'createdAt': return item.createdAt ? new Date(item.createdAt).getTime() : 0;
        case 'status': return item.isActive !== false ? 1 : 0;
        case 'productCount': return item.productCount || 0;
        default: return (item as any)[property];
      }
    };
    this.store.loadCategories();
  }

  // Role Checks
  get canAddCategory(): boolean {
    return this.authService.hasRole('Admin');
  }

  get canEditCategory(): boolean {
    return this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
  }

  get canDeleteCategory(): boolean {
    return this.authService.hasRole('Admin');
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.setSearch(value);
  }

  onPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex + 1, event.pageSize);
  }

  openCreateDialog(): void {
    if (!this.canAddCategory) {
      this.snackBar.open('You do not have permission to add categories.', 'Close', { duration: 3000 });
      return;
    }

    const existingNames = this.store.categories().map((c) => c.name);
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '460px',
      data: { existingNames },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.createCategory({
          dto: result,
          onSuccess: () => {
            this.snackBar.open(`Category "${result.name}" created successfully.`, 'Dismiss', { duration: 3500 });
          },
        });
      }
    });
  }

  openEditDialog(category: Category): void {
    if (!this.canEditCategory) {
      this.snackBar.open('You do not have permission to edit categories.', 'Close', { duration: 3000 });
      return;
    }

    const existingNames = this.store.categories().map((c) => c.name);
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '460px',
      data: { category, existingNames },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.updateCategory({
          id: category.id,
          dto: result,
          onSuccess: () => {
            this.snackBar.open(`Category "${result.name}" updated successfully.`, 'Dismiss', { duration: 3500 });
          },
        });
      }
    });
  }

  openDetailsDialog(category: Category): void {
    this.dialog.open(CategoryDetailsDialogComponent, {
      width: '600px',
      data: { categoryId: category.id },
    });
  }

  deleteCategory(category: Category): void {
    if (!this.canDeleteCategory) {
      this.snackBar.open('Only Admins can delete categories.', 'Close', { duration: 3000 });
      return;
    }

    if ((category.productCount || 0) > 0) {
      this.snackBar.open(
        `Cannot delete category "${category.name}" because it has ${category.productCount} active product(s) assigned.`,
        'Close',
        { duration: 4500 }
      );
      return;
    }

    this.confirmDialog.confirmDelete('Category', category.name).subscribe((confirmed) => {
      if (!confirmed) return;

      this.store.deleteCategory({
        id: category.id,
        onSuccess: () => {
          this.snackBar.open(`Category "${category.name}" deleted successfully.`, 'Dismiss', { duration: 3500 });
        },
        onError: (errMsg) => {
          this.snackBar.open(errMsg, 'Close', { duration: 4000 });
        },
      });
    });
  }

  dismissError(): void {
    this.store.clearError();
  }
}

