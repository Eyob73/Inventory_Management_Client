import { Component, Input, Output, EventEmitter, inject, signal, effect, ContentChild, TemplateRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

export interface DataViewCardField {
  key: string;
  label?: string;
  type?: 'text' | 'image' | 'badge' | 'currency' | 'date' | 'code' | 'custom';
  valueFn?: (item: any) => any;
  badgeClassFn?: (item: any) => string;
  imageFallbackIcon?: string;
}

export interface DataViewAction {
  id: string;
  icon: string;
  label: string;
  color?: string; // primary, warn, accent
  visibleFn?: (item: any) => boolean;
}

@Component({
  selector: 'app-data-view',
  standalone: true,
  imports: [CommonModule, MatButtonToggleModule, MatIconModule, MatTooltipModule, MatButtonModule],
  template: `
    <div class="data-view-toolbar">
      <div class="data-view-toolbar-content">
        <ng-content select="[toolbar-start]"></ng-content>
      </div>
      <div class="data-view-toggle">
        <mat-button-toggle-group [value]="viewMode()" (change)="onViewChange($event.value)" aria-label="View Mode">
          <mat-button-toggle value="table" matTooltip="Table View">
            <mat-icon>table_rows</mat-icon> <span class="toggle-text">Table</span>
          </mat-button-toggle>
          <mat-button-toggle value="card" matTooltip="Card View">
            <mat-icon>grid_view</mat-icon> <span class="toggle-text">Cards</span>
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>
    </div>

    @if (viewMode() === 'table') {
      <div class="data-view-table-container">
        <ng-content select="[table-view]"></ng-content>
      </div>
    } @else {
      <div class="data-view-cards-container">
        <div class="cards-grid">
          @for (item of data; track item.id || $index) {
            <div class="data-card">
              <div class="data-card-content">
                @for (field of cardFields; track field.key) {
                  @if (field.type === 'image') {
                    <div class="card-image-wrapper">
                      @if (getFieldValue(item, field)) {
                        <img [src]="getFieldValue(item, field)" [alt]="field.label" class="card-image"/>
                      } @else {
                        <div class="card-image-placeholder">
                          <mat-icon>{{ field.imageFallbackIcon || 'image' }}</mat-icon>
                        </div>
                      }
                    </div>
                  } @else if (field.type === 'badge') {
                    <div class="card-field field-badge">
                      <span class="field-label" *ngIf="field.label">{{ field.label }}</span>
                      <span class="status-badge" [ngClass]="field.badgeClassFn ? field.badgeClassFn(item) : ''">
                        {{ getFieldValue(item, field) }}
                      </span>
                    </div>
                  } @else if (field.type === 'code') {
                    <div class="card-field field-code">
                      <span class="field-label" *ngIf="field.label">{{ field.label }}</span>
                      <code class="code-tag">{{ getFieldValue(item, field) }}</code>
                    </div>
                  } @else if (field.type === 'currency') {
                    <div class="card-field field-currency">
                      <span class="field-label" *ngIf="field.label">{{ field.label }}</span>
                      <span class="field-value">{{ getFieldValue(item, field) | currency:'':'':'1.2-2' }} ETB</span>
                    </div>
                  } @else if (field.type === 'date') {
                    <div class="card-field field-date">
                      <span class="field-label" *ngIf="field.label">{{ field.label }}</span>
                      <span class="field-value">{{ getFieldValue(item, field) | date:'mediumDate' }}</span>
                    </div>
                  } @else if (field.type === 'custom') {
                     <ng-container *ngTemplateOutlet="customCardField; context: { $implicit: item, field: field }"></ng-container>
                  } @else {
                    <div class="card-field field-text" [ngClass]="{'card-title': field.key === 'name' || field.key === 'title'}">
                      <span class="field-label" *ngIf="field.label && field.key !== 'name' && field.key !== 'title'">{{ field.label }}</span>
                      <span class="field-value">{{ getFieldValue(item, field) || '—' }}</span>
                    </div>
                  }
                }
              </div>
              @if (actions && actions.length > 0) {
                <div class="data-card-actions">
                  @for (action of actions; track action.id) {
                    @if (!action.visibleFn || action.visibleFn(item)) {
                      <button mat-icon-button [color]="action.color" [matTooltip]="action.label" [attr.aria-label]="action.label" (click)="onAction(action.id, item)">
                        <mat-icon>{{ action.icon }}</mat-icon>
                      </button>
                    }
                  }
                </div>
              }
            </div>
          }
        </div>
        
        @if (data && data.length === 0) {
          <div class="data-view-empty">
            <ng-content select="[empty-state]"></ng-content>
          </div>
        }
        
        <ng-content select="[paginator]"></ng-content>
      </div>
    }
  `,
  styles: [`
    .data-view-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .data-view-toolbar-content {
      flex: 1;
    }
    .data-view-toggle {
      display: flex;
      align-items: center;
    }
    .data-view-toggle mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
    }
    .toggle-text {
      margin-left: 4px;
      font-size: 13px;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .data-card {
      background: var(--surface, var(--mat-sys-surface, #ffffff));
      border: 1px solid var(--border, var(--mat-sys-outline-variant, #e0e0e0));
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sm, 0 2px 4px rgba(0,0,0,0.05));
      transition: box-shadow 0.2s var(--ease, ease), border-color 0.2s var(--ease, ease), transform 0.2s var(--ease, ease);
    }
    .data-card:hover {
      box-shadow: var(--shadow-md, 0 4px 8px rgba(0,0,0,0.1));
    }
    :host-context(.dark-theme) .data-card {
      background: var(--surface, var(--mat-sys-surface-container));
      border-color: var(--border, var(--mat-sys-outline-variant));
    }
    .data-card-content {
      padding: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .card-image-wrapper {
      width: 100%;
      height: 160px;
      background: var(--mat-sys-surface-variant, #f5f5f5);
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .card-image-placeholder mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-on-surface-variant, #9e9e9e);
    }
    .card-field {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 14px;
    }
    .card-field.field-text.card-title {
      font-size: 16px;
      font-weight: 600;
      justify-content: flex-start;
      margin-bottom: 4px;
      color: var(--mat-sys-on-surface);
    }
    .field-label {
      color: var(--mat-sys-on-surface-variant, #666);
      font-size: 12px;
      margin-right: 8px;
    }
    .field-value {
      font-weight: 500;
      color: var(--mat-sys-on-surface);
      word-break: break-word;
    }
    .code-tag {
      background: var(--mat-sys-surface-variant, #f0f0f0);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    .data-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px;
      border-top: 1px solid var(--border, var(--mat-sys-outline-variant, #e0e0e0));
      background: var(--paper, var(--mat-sys-surface-container, #fafafa));
      gap: 4px;
    }
    .data-card-actions mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
    }
    :host-context(.dark-theme) .data-card-actions {
      border-color: var(--border, var(--mat-sys-outline-variant));
      background: var(--paper, var(--mat-sys-surface-container-high));
    }
    .status-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
    }
    .status-badge.status--active {
      background: rgba(46, 125, 50, 0.1);
      color: #2e7d32;
    }
    .status-badge.status--inactive {
      background: rgba(198, 40, 40, 0.1);
      color: #c62828;
    }
    .status-badge.status--low-stock {
      background: rgba(239, 108, 0, 0.1);
      color: #ef6c00;
    }
    .status-badge.status--out-of-stock {
      background: rgba(198, 40, 40, 0.1);
      color: #c62828;
    }
    .status-badge.status--in-stock {
      background: rgba(46, 125, 50, 0.1);
      color: #2e7d32;
    }
    :host-context(.dark-theme) .status-badge.status--active, :host-context(.dark-theme) .status-badge.status--in-stock {
      background: rgba(129, 199, 132, 0.2);
      color: #81c784;
    }
    :host-context(.dark-theme) .status-badge.status--inactive, :host-context(.dark-theme) .status-badge.status--out-of-stock {
      background: rgba(229, 115, 115, 0.2);
      color: #e57373;
    }
    :host-context(.dark-theme) .status-badge.status--low-stock {
      background: rgba(255, 183, 77, 0.2);
      color: #ffb74d;
    }
    @media (max-width: 600px) {
      .toggle-text {
        display: none;
      }
      .data-view-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .data-view-toggle {
        justify-content: flex-end;
      }
    }
  `]
})
export class DataViewComponent implements OnInit {
  @Input({ required: true }) pageName!: string;
  @Input() data: any[] = [];
  @Input() cardFields: DataViewCardField[] = [];
  @Input() actions: DataViewAction[] = [];
  
  @Output() actionClicked = new EventEmitter<{ actionId: string, item: any }>();
  @ContentChild('customCardField') customCardField!: TemplateRef<any>;

  viewMode = signal<'table' | 'card'>('table');

  ngOnInit() {
    this.loadPreference();
  }

  getFieldValue(item: any, field: DataViewCardField): any {
    if (field.valueFn) {
      return field.valueFn(item);
    }
    return item[field.key];
  }

  onAction(actionId: string, item: any) {
    this.actionClicked.emit({ actionId, item });
  }

  onViewChange(mode: 'table' | 'card') {
    this.viewMode.set(mode);
    this.savePreference(mode);
  }

  private loadPreference() {
    try {
      const stored = localStorage.getItem(`inv-view-pref-${this.pageName}`);
      if (stored === 'table' || stored === 'card') {
        this.viewMode.set(stored);
      }
    } catch {
      // ignore
    }
  }

  private savePreference(mode: 'table' | 'card') {
    try {
      localStorage.setItem(`inv-view-pref-${this.pageName}`, mode);
    } catch {
      // ignore
    }
  }
}
