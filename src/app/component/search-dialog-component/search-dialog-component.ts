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

  query = '';
  filteredItems = this.navService.getNavGroups().flatMap(g => g.items);

  filterItems() {
    const q = this.query.toLowerCase().trim();
    this.filteredItems = this.navService.getNavGroups()
      .flatMap(g => g.items)
      .filter(item => item.label.toLowerCase().includes(q) || item.path.includes(q));
  }

  navigate(path: string) {
    this.router.navigateByUrl(path);
    this.dialogRef.close();
  }

  close() {
    this.dialogRef.close();
  }
}