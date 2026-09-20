import { TranslocoDirective } from '@jsverse/transloco';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BottleInventoryService } from '../../../core/services/bottle-inventory';
import { forkJoin, map, switchMap, of } from 'rxjs';
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
    MatSnackBarModule, TranslocoDirective],
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
  private bottleInventoryApi = inject(BottleInventoryService);
  private authService = inject(AuthService);

  purchase = signal<Purchase | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
    displayedColumns = ['productName', 'sku', 'quantity', 'unitCost', 'totalCost'];

  bottleImpacts = computed(() => {
    const p = this.purchase();
    if (!p || !p.items) return [];
    
    const requiredBottles = new Map<string, { name: string, quantity: number }>();
    const returnableItems = p.items.filter(i => (i as any).isReturnable && (i as any).bottleTypeId);
    
    for (const item of returnableItems) {
      const typeId = (item as any).bottleTypeId;
      const typeName = (item as any).bottleTypeName || 'Unknown Bottle';
      const existing = requiredBottles.get(typeId) || { name: typeName, quantity: 0 };
      existing.quantity += item.quantity;
      requiredBottles.set(typeId, existing);
    }
    
    return Array.from(requiredBottles.values());
  });

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

    const returnableItems = purchase.items.filter(i => (i as any).isReturnable && (i as any).bottleTypeId);

    if (returnableItems.length === 0) {
      this.promptComplete(purchase, `Receive stock for "${purchase.purchaseNumber}"? Quantities will be added to inventory.`);
      return;
    }

    // Group required bottles by bottle type
    const requiredBottles = new Map<string, { name: string, quantity: number }>();
    for (const item of returnableItems) {
      const typeId = (item as any).bottleTypeId;
      const typeName = (item as any).bottleTypeName || 'Unknown Bottle';
      const existing = requiredBottles.get(typeId) || { name: typeName, quantity: 0 };
      existing.quantity += item.quantity;
      requiredBottles.set(typeId, existing);
    }

    this.bottleInventoryApi.getInventory().subscribe({
      next: (inventoryList) => {
        let isShortage = false;
        let errorMessage = 'Not Enough Empty Bottles\n\n';
        let impactMessage = `Purchase Summary\n\nBottle Impact\n────────────────────────────\n`;

        for (const [typeId, required] of requiredBottles.entries()) {
          const inv = inventoryList.find(i => i.bottleTypeId === typeId);
          const available = inv ? inv.emptyBottles : 0;

          if (available < required.quantity) {
            isShortage = true;
            errorMessage += `Bottle Type: ${required.name}\nRequired: ${required.quantity}\nAvailable empty bottles: ${available}\nShortage: ${required.quantity - available}\n\n`;
          } else {
            impactMessage += `Bottle Type: ${required.name}\nEmpty bottles used: ${required.quantity}\nFull bottles added: ${required.quantity}\n\nCurrent empty bottles: ${available}\nAfter purchase: ${available - required.quantity}\n\n`;
          }
        }

        if (isShortage) {
          errorMessage += `The purchase cannot be completed until the bottle stock issue is resolved.`;
          this.confirmDialog.confirmWarning('Insufficient Empty Bottles', errorMessage, 'OK').subscribe();
        } else {
          impactMessage = impactMessage.trim();
          this.promptComplete(purchase, impactMessage);
        }
      },
      error: (err) => this.snackBar.open(this.errMsg(err, 'Failed to verify bottle inventory'), 'Close', { duration: 5000 })
    });
  }

  private promptComplete(purchase: Purchase, message: string): void {
    this.confirmDialog
      .confirmWarning(
        'Complete Purchase',
        message,
        'Confirm Purchase')
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




