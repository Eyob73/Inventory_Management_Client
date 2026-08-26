import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data,
      width: '440px',
      panelClass: 'custom-confirm-dialog-panel',
      disableClose: true,
    });

    return dialogRef.afterClosed();
  }

  confirmDelete(entityName: string, entityLabel?: string): Observable<boolean> {
    return this.confirm({
      title: `Delete ${entityName}`,
      message: entityLabel
        ? `Are you sure you want to delete "${entityLabel}"? This action cannot be undone.`
        : `Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'delete_forever',
    });
  }

  confirmWarning(title: string, message: string, confirmText = 'Proceed'): Observable<boolean> {
    return this.confirm({
      title,
      message,
      type: 'warning',
      confirmText,
      cancelText: 'Cancel',
      icon: 'warning_amber',
    });
  }
}
