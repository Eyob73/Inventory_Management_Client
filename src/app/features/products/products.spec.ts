import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideTransloco } from '@jsverse/transloco';
import { of, Subject } from 'rxjs';

import { Products } from './products';
import { ProductService } from '../../services/product';
import { CategoryService } from '../../services/category';
import { AuthStore } from '../../store/auth.store';
import { ProductStore } from '../../store/products.store';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { PagedProductResponse, Product } from '../../models/products.model';

describe('Products Component & Inventory Value', () => {
  let fixture: ComponentFixture<Products>;
  let component: Products;
  let userRoleSignal: ReturnType<typeof signal<string>>;
  let mockProductService: {
    getAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const sampleProducts: Product[] = [
    {
      id: 'p1',
      name: 'Juice',
      sku: 'J-01',
      description: 'Fresh juice',
      price: 50,
      cost: 30,
      quantityInStock: 5,
      minimumStock: 10,
      isActive: true,
      categoryId: 'c1',
      supplierId: null,
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: null,
    },
    {
      id: 'p2',
      name: 'Water',
      sku: 'W-01',
      description: 'Mineral water',
      price: 20,
      cost: 12.55,
      quantityInStock: 3,
      minimumStock: 2,
      isActive: true,
      categoryId: 'c1',
      supplierId: null,
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: null,
    },
  ];

  const pagedResponse: PagedProductResponse = {
    items: sampleProducts,
    totalCount: 2,
    pageIndex: 1,
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    lowStockCount: 1,
    outOfStockCount: 0,
    totalInventoryValue: 187.65,
  };

  beforeEach(async () => {
    userRoleSignal = signal('Admin');

    mockProductService = {
      getAll: vi.fn().mockReturnValue(of(pagedResponse)),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const mockAuthStore = {
      userRole: userRoleSignal.asReadonly(),
      currentUser: signal(null).asReadonly(),
      isLoggedIn: signal(true).asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
        { provide: ProductService, useValue: mockProductService },
        { provide: CategoryService, useValue: { getAll: vi.fn().mockReturnValue(of([])) } },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: ConfirmDialogService, useValue: { confirmDelete: vi.fn().mockReturnValue(of(false)) } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Products);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display inventory value with 2 decimal places for Admin', () => {
    expect(component).toBeTruthy();
    expect(component.isSales()).toBe(false);
    expect(component.displayedColumns()).toContain('cost');

    const card = fixture.nativeElement.querySelector('.stat-card.blue');
    expect(card.textContent).toContain('187.65 ETB');
    expect(card.querySelector('.stat-sub')?.textContent).toContain('products.stats.totalStockValue');
  });

  it('should hide cost column and switch subtitle to estRetail for Sales role', () => {
    userRoleSignal.set('Sales');
    fixture.detectChanges();

    expect(component.isSales()).toBe(true);
    expect(component.displayedColumns()).not.toContain('cost');

    const card = fixture.nativeElement.querySelector('.stat-card.blue');
    expect(card.querySelector('.stat-sub')?.textContent).toContain('products.stats.estRetail');
  });

  it('should use cost * stock for Admin and price * stock for Sales on array-response fallback', () => {
    const store = TestBed.inject(ProductStore);
    mockProductService.getAll.mockReturnValueOnce(of(sampleProducts));

    userRoleSignal.set('Admin');
    store.loadProducts({ pageIndex: 1, pageSize: 10 });
    // 30*5 + 12.55*3 = 150 + 37.65 = 187.65
    expect(store.totalInventoryValue()).toBe(187.65);

    mockProductService.getAll.mockReturnValueOnce(of(sampleProducts));
    userRoleSignal.set('Sales');
    store.loadProducts({ pageIndex: 1, pageSize: 10 });
    // 50*5 + 20*3 = 250 + 60 = 310
    expect(store.totalInventoryValue()).toBe(310);
  });

  it('should render stats-row stat cards in two columns', () => {
    const statsRow: HTMLElement | null = fixture.nativeElement.querySelector('.stats-row');
    expect(statsRow).toBeTruthy();

    const cards = statsRow!.querySelectorAll('.stat-card');
    expect(cards.length).toBe(4);

    const statsRowStyle = getComputedStyle(statsRow!);
    expect(statsRowStyle.display).toBe('grid');
    expect(statsRowStyle.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
  });

  it('should render kpi skeletons in stats-row matching stat-card padding and without oversized min-height', () => {
    const store = TestBed.inject(ProductStore);
    const pending$ = new Subject<PagedProductResponse>();
    mockProductService.getAll.mockReturnValueOnce(pending$.asObservable());

    store.loadProducts({ pageIndex: 1, pageSize: 10 });
    fixture.detectChanges();

    const statsRow: HTMLElement | null = fixture.nativeElement.querySelector('.stats-row');
    expect(statsRow).toBeTruthy();

    const skeletons = statsRow!.querySelectorAll('app-card-skeleton');
    expect(skeletons.length).toBe(4);

    const skeletonCard: HTMLElement | null = skeletons[0].querySelector('.stat-card-skeleton');
    expect(skeletonCard).toBeTruthy();

    const skeletonCardStyle = getComputedStyle(skeletonCard!);
    expect(skeletonCardStyle.paddingTop).toBe('12px');
    expect(skeletonCardStyle.paddingBottom).toBe('12px');
    expect(skeletonCardStyle.paddingLeft).toBe('16px');
    expect(skeletonCardStyle.paddingRight).toBe('16px');
    expect(skeletonCardStyle.minHeight).not.toBe('150px');
    expect(skeletonCardStyle.borderRadius).toBe('16px');

    pending$.complete();
  });
});
