import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private dialog = inject(MatDialog);
  private transloco = inject(TranslocoService);

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
    const entityKey = 'confirm.entity' + entityName.replace(/\s+/g, '');
    let translatedEntity = entityName;
    try {
      translatedEntity = this.transloco.translate(entityKey);
      if (translatedEntity === entityKey) {
        translatedEntity = entityName; // fallback if key not found
      }
    } catch(e) {}
    
    const lowercaseEntity = translatedEntity.toLowerCase();

    return this.confirm({
      title: this.transloco.translate('confirm.deleteTitle', { entity: translatedEntity }),
      message: entityLabel
        ? this.transloco.translate('confirm.deleteMessageLabel', { entityLabel })
        : this.transloco.translate('confirm.deleteMessage', { entity: lowercaseEntity }),
      type: 'danger',
      confirmText: this.transloco.translate('confirm.delete'),
      cancelText: this.transloco.translate('confirm.cancel'),
      icon: 'delete_forever',
    });
  }

  confirmWarning(title: string, message: string, confirmText = 'Proceed'): Observable<boolean> {
    return this.confirm({
      title,
      message,
      type: 'warning',
      confirmText: confirmText === 'Proceed' ? this.transloco.translate('confirm.proceed') : confirmText,
      cancelText: this.transloco.translate('confirm.cancel'),
      icon: 'warning_amber',
    });
  }
}
