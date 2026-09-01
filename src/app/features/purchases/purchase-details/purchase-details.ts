import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Purchase } from '../../../models/purchase.model';
import { PurchaseService } from '../../../services/purchase';
import { PurchaseStore } from '../../../store/purchase.store';
import { AuthService } from '../../../services/auth';
import { ConfirmDialogService } from '../../../ui/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-purchase-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './purchase-details.html',
  styleUrl: './purchase-details.scss',
})
export class PurchaseDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private purchaseApi = inject(PurchaseService);
  private purchaseStore = inject(PurchaseStore);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);
  private authService = inject(AuthService);

  purchase = signal<Purchase | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  displayedColumns = ['productName', 'sku', 'quantity', 'unitCost', 'totalCost'];

  get canDelete(): boolean {
    return this.authService.hasRole('Admin');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/purchases']);
      return;
    }
    this.load(id);
  }

  back(): void {
    this.router.navigate(['/purchases']);
  }

  edit(): void {
    const purchase = this.purchase();
    if (!purchase || purchase.status !== 'Draft') return;
    this.router.navigate(['/purchases', purchase.id, 'edit']);
  }

  complete(): void {
    const purchase = this.purchase();
    if (!purchase) return;
    this.confirmDialog
      .confirmWarning(
        'Complete purchase',
        `Receive stock for "${purchase.purchaseNumber}"? Quantities will be added to inventory.`,
        'Complete'
      )
      .subscribe((ok) => {
        if (!ok) return;
        this.purchaseApi.complete(purchase.id).subscribe({
          next: (updated) => {
            this.purchase.set(updated);
            this.purchaseStore.loadPurchases();
            this.snackBar.open('Purchase completed and stock received.', 'Close', { duration: 3000 });
          },
          error: (err) => this.snackBar.open(this.errMsg(err, 'Failed to complete purchase'), 'Close', { duration: 5000 }),
        });
      });
  }

  cancelPurchase(): void {
    const purchase = this.purchase();
    if (!purchase) return;
    const message =
      purchase.status === 'Completed'
        ? `Cancel "${purchase.purchaseNumber}"? Received stock will be reversed.`
        : `Cancel draft "${purchase.purchaseNumber}"?`;
    this.confirmDialog.confirmWarning('Cancel purchase', message, 'Cancel purchase').subscribe((ok) => {
      if (!ok) return;
      this.purchaseApi.cancel(purchase.id).subscribe({
        next: () => {
          this.purchaseStore.loadPurchases();
          this.snackBar.open('Purchase cancelled.', 'Close', { duration: 3000 });
          this.load(purchase.id);
        },
        error: (err) => this.snackBar.open(this.errMsg(err, 'Failed to cancel purchase'), 'Close', { duration: 5000 }),
      });
    });
  }

  deleteDraft(): void {
    const purchase = this.purchase();
    if (!purchase || !this.canDelete) return;
    this.confirmDialog.confirmDelete('Purchase', purchase.purchaseNumber).subscribe((ok) => {
      if (!ok) return;
      this.purchaseApi.delete(purchase.id).subscribe({
        next: () => {
          this.purchaseStore.loadPurchases();
          this.snackBar.open('Draft deleted.', 'Close', { duration: 3000 });
          this.router.navigate(['/purchases']);
        },
        error: (err) => this.snackBar.open(this.errMsg(err, 'Failed to delete purchase'), 'Close', { duration: 5000 }),
      });
    });
  }

  statusClass(status: string): string {
    if (status === 'Completed') return 'status--active';
    if (status === 'Cancelled') return 'status--inactive';
    return 'status--draft';
  }

  private load(id: string): void {
    this.isLoading.set(true);
    this.purchaseApi.getById(id).subscribe({
      next: (data) => {
        this.purchase.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(this.errMsg(err, 'Failed to load purchase'));
        this.isLoading.set(false);
      },
    });
  }

  private errMsg(err: any, fallback: string): string {
    return typeof err?.error === 'string' ? err.error : err?.error?.detail || err?.message || fallback;
  }
}
