import { Injectable, OnDestroy } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl implements OnDestroy {
  private subscription: Subscription;

  constructor(private translocoService: TranslocoService) {
    super();

    this.subscription = this.translocoService.langChanges$.subscribe(() => {
      this.updateTranslations();
    });
    
    this.updateTranslations();
  }

  private updateTranslations() {
    this.itemsPerPageLabel = this.translocoService.translate('paginator.itemsPerPage');
    this.nextPageLabel = this.translocoService.translate('paginator.nextPage');
    this.previousPageLabel = this.translocoService.translate('paginator.previousPage');
    this.firstPageLabel = this.translocoService.translate('paginator.firstPage');
    this.lastPageLabel = this.translocoService.translate('paginator.lastPage');
    this.changes.next();
  }

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return this.translocoService.translate('paginator.rangeZero', { length });
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return this.translocoService.translate('paginator.range', { startIndex: startIndex + 1, endIndex, length });
  };

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
