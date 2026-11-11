import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { PosComponent } from './pos';
import { TenantApiService } from '../../services/tenant';
import { ProductService } from '../../services/product';
import { CategoryService } from '../../services/category';
import { CustomerService } from '../../services/customer.service';
import { SaleService } from '../../services/sale.service';
import { provideTransloco } from '@jsverse/transloco';

describe('PosComponent - Payment Verification Toggle Integration', () => {
  let component: PosComponent;
  let fixture: ComponentFixture<PosComponent>;
  let tenantApiService: TenantApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        {
          provide: ProductService,
          useValue: {
            getAll: vi.fn().mockReturnValue(of({ items: [], totalCount: 0 }))
          }
        },
        {
          provide: CategoryService,
          useValue: {
            getAll: vi.fn().mockReturnValue(of([]))
          }
        },
        {
          provide: CustomerService,
          useValue: {
            getAll: vi.fn().mockReturnValue(of([]))
          }
        },
        {
          provide: SaleService,
          useValue: {
            createSale: vi.fn().mockReturnValue(of({}))
          }
        },
        provideTransloco({
          config: {
            availableLangs: ['en', 'am', 'om'],
            defaultLang: 'en',
          }
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PosComponent);
    component = fixture.componentInstance;
    tenantApiService = TestBed.inject(TenantApiService);
  });

  it('should initialize with payment verification disabled by default', () => {
    expect(component.isPaymentVerificationEnabled()).toBe(false);
  });

  it('should open payment verification modal when setting is enabled and payment is electronic', () => {
    tenantApiService.isPaymentVerificationEnabled.set(true);
    component.paymentMethod.set('Telebirr');

    // Add a dummy item to cart
    component.cart.set([
      {
        product: { id: 'p1', name: 'Product 1', price: 100, quantityInStock: 10 } as any,
        quantity: 1,
        discountAmount: 0,
        isBottleExchange: false,
        bottleDepositAmount: 0
      }
    ]);

    const openVerificationSpy = vi.spyOn(component as any, 'openPaymentVerificationModal').mockImplementation(() => {});
    const openConfirmSpy = vi.spyOn(component as any, 'openConfirmSaleModal').mockImplementation(() => {});

    component.completeSale();

    expect(openVerificationSpy).toHaveBeenCalled();
    expect(openConfirmSpy).not.toHaveBeenCalled();
  });

  it('should skip payment verification modal and go directly to confirm modal when setting is disabled', () => {
    tenantApiService.isPaymentVerificationEnabled.set(false);
    component.paymentMethod.set('Telebirr');

    // Add a dummy item to cart
    component.cart.set([
      {
        product: { id: 'p1', name: 'Product 1', price: 100, quantityInStock: 10 } as any,
        quantity: 1,
        discountAmount: 0,
        isBottleExchange: false,
        bottleDepositAmount: 0
      }
    ]);

    const openVerificationSpy = vi.spyOn(component as any, 'openPaymentVerificationModal').mockImplementation(() => {});
    const openConfirmSpy = vi.spyOn(component as any, 'openConfirmSaleModal').mockImplementation(() => {});

    component.completeSale();

    expect(openVerificationSpy).not.toHaveBeenCalled();
    expect(openConfirmSpy).toHaveBeenCalled();
  });

  it('should proceed directly to confirm sale modal for cash payment regardless of setting', () => {
    tenantApiService.isPaymentVerificationEnabled.set(true);
    component.paymentMethod.set('Cash');

    component.cart.set([
      {
        product: { id: 'p1', name: 'Product 1', price: 100, quantityInStock: 10 } as any,
        quantity: 1,
        discountAmount: 0,
        isBottleExchange: false,
        bottleDepositAmount: 0
      }
    ]);

    const openVerificationSpy = vi.spyOn(component as any, 'openPaymentVerificationModal').mockImplementation(() => {});
    const openConfirmSpy = vi.spyOn(component as any, 'openConfirmSaleModal').mockImplementation(() => {});

    component.completeSale();

    expect(openVerificationSpy).not.toHaveBeenCalled();
    expect(openConfirmSpy).toHaveBeenCalled();
  });

  it('should reset all cart and customer state when clearCart is called', () => {
    component.cart.set([
      {
        product: { id: 'p1', name: 'Product 1', price: 100, quantityInStock: 10 } as any,
        quantity: 1,
        discountAmount: 0,
        isBottleExchange: false,
        bottleDepositAmount: 0
      }
    ]);
    component.selectedCustomerId.set('cust-1');
    component.manualCustomerName.set('Test Customer');
    component.discountAmount.set(50);
    component.amountReceived.set(100);

    component.clearCart();

    expect(component.cart().length).toBe(0);
    expect(component.selectedCustomerId()).toBeNull();
    expect(component.manualCustomerName()).toBe('');
    expect(component.discountAmount()).toBe(0);
    expect(component.amountReceived()).toBe(0);
  });

  it('should render product cards without mobile tap-highlight and preserve surface background', () => {
    const productService = TestBed.inject(ProductService) as any;
    productService.getAll.mockReturnValue(
      of({
        items: [
          { id: 'p1', name: 'Test Water', price: 25, quantityInStock: 10, isActive: true }
        ],
        totalCount: 1
      })
    );
    vi.spyOn(tenantApiService, 'getPosPaymentVerification').mockReturnValue(of({ enabled: false } as any));

    fixture.detectChanges();

    const card: HTMLElement | null = fixture.nativeElement.querySelector('[data-purpose="product-card"]');
    expect(card).toBeTruthy();

    const cardStyle = getComputedStyle(card!);
    expect(cardStyle.touchAction).toBe('manipulation');
    expect(cardStyle.userSelect).toBe('none');
    expect(cardStyle.background || cardStyle.backgroundColor).toContain('var(--surface)');

    const componentCss = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(componentCss).toMatch(/-webkit-tap-highlight-color:\s*transparent/);

    card!.click();
    expect(component.cart().length).toBe(1);
    fixture.destroy();
  });
});

