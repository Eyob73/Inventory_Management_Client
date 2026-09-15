import { Injectable, OnDestroy } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl implements OnDestroy {
  private subscription: Subscription = new Subscription();

  constructor(private translocoService: TranslocoService) {
    super();
    this.setupTranslations();
  }

  private setupTranslations() {
    this.subscription.add(
      this.translocoService.selectTranslate('paginator.itemsPerPage').subscribe(res => {
        this.itemsPerPageLabel = res;
        this.changes.next();
      })
    );
    this.subscription.add(
      this.translocoService.selectTranslate('paginator.nextPage').subscribe(res => {
        this.nextPageLabel = res;
        this.changes.next();
      })
    );
    this.subscription.add(
      this.translocoService.selectTranslate('paginator.previousPage').subscribe(res => {
        this.previousPageLabel = res;
        this.changes.next();
      })
    );
    this.subscription.add(
      this.translocoService.selectTranslate('paginator.firstPage').subscribe(res => {
        this.firstPageLabel = res;
        this.changes.next();
      })
    );
    this.subscription.add(
      this.translocoService.selectTranslate('paginator.lastPage').subscribe(res => {
        this.lastPageLabel = res;
        this.changes.next();
      })
    );
    
    // We also need to trigger an update when the language changes for the range label,
    // because getRangeLabel evaluates the dynamic string synchronously on demand.
    this.subscription.add(
      this.translocoService.langChanges$.subscribe(() => {
        this.changes.next();
      })
    );
  }

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return this.translocoService.translate('paginator.rangeZero', { length });
    }
    
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    
    return this.translocoService.translate('paginator.range', { 
      startIndex: startIndex + 1, 
      endIndex, 
      length 
    });
  };

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
