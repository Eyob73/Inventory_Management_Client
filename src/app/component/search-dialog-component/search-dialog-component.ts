// search-dialog/search-dialog.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation-service';

import { MatListModule } from '@angular/material/list';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatListModule],
  templateUrl: './search-dialog-component.html',
  styleUrl: './search-dialog-component.scss',
})
export class SearchDialogComponent {
  private dialogRef = inject(MatDialogRef<SearchDialogComponent>);
  private router = inject(Router);
  private navService = inject(NavigationService);
  private authStore = inject(AuthStore);

  query = '';
  allItems = this.navService.getSearchableItems(this.authStore.userRole());
  filteredItems = [...this.allItems];

  filterItems() {
    const q = this.query.toLowerCase().trim();
    if (!q) {
      this.filteredItems = [...this.allItems];
      return;
    }
    
    this.filteredItems = this.allItems.filter(item => {
      const matchLabel = item.label.toLowerCase().includes(q);
      const matchPath = item.path.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q) ?? false;
      const matchKeywords = item.keywords?.some(k => k.toLowerCase().includes(q)) ?? false;
      
      return matchLabel || matchPath || matchDesc || matchKeywords;
    });
  }

  navigate(path: string) {
    this.router.navigateByUrl(path);
    this.dialogRef.close();
  }

  close() {
    this.dialogRef.close();
  }
}