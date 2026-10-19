import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideTransloco } from '@jsverse/transloco';

import { PaymentVerificationComponent } from './payment-verification';
import { PaymentDestinationService } from '../../core/services/payment-destination.service';
import { PaymentVerificationService } from '../../core/services/payment-verification.service';
import { AuthService } from '../../services/auth';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import {
  PaymentDestination,
  PaymentVerificationSummary,
  EligibleSale
} from '../../models/payment-verification.model';

describe('PaymentVerificationComponent', () => {
  let component: PaymentVerificationComponent;
  let fixture: ComponentFixture<PaymentVerificationComponent>;

  let destinationServiceSpy: any;
  let verificationServiceSpy: any;
  let authServiceSpy: any;
  let confirmDialogSpy: any;

  const mockSummary: PaymentVerificationSummary = {
    totalDestinations: 2,
    activeDestinations: 2,
    verifiedTransactions: 10,
    needsReviewTransactions: 1
  };

  const mockDestinations: PaymentDestination[] = [
    {
      id: 'dest-1',
      name: 'Main CBE Account',
      type: 'BankAccount',
      bankCode: 'cbe',
      bankName: 'Commercial Bank of Ethiopia',
      maskedAccountNumber: '1000****6789',
      isDefault: true,
      isActive: true,
      createdAtUtc: new Date().toISOString()
    }
  ];

  const mockEligibleSales: EligibleSale[] = [
    {
      id: 'sale-1',
      saleNumber: 'SAL-001',
      totalAmount: 1500,
      amountAlreadyPaid: 0,
      outstandingBalance: 1500,
      saleStatus: 'Pending',
      saleDate: new Date().toISOString(),
      paymentMethod: 'BankTransfer'
    }
  ];

  beforeEach(async () => {
    destinationServiceSpy = {
      getAll: vi.fn().mockReturnValue(of(mockDestinations)),
      getSupportedBanks: vi.fn().mockReturnValue(of([
        { id: 'cbe', name: 'Commercial Bank of Ethiopia', type: 'commercial', status: 'active', requiresAccount: true, requiresPhone: false }
      ])),
      create: vi.fn(),
      update: vi.fn(),
      setDefault: vi.fn(),
      setStatus: vi.fn(),
      delete: vi.fn()
    };

    verificationServiceSpy = {
      getSummary: vi.fn().mockReturnValue(of(mockSummary)),
      getEligibleSales: vi.fn().mockReturnValue(of(mockEligibleSales)),
      getVerifications: vi.fn().mockReturnValue(of({
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false
      })),
      verifyPayment: vi.fn(),
      retryVerification: vi.fn(),
      processManualReview: vi.fn()
    };

    authServiceSpy = {
      hasRole: vi.fn().mockReturnValue(true)
    };

    confirmDialogSpy = {
      confirm: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [PaymentVerificationComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
            fallbackLang: 'en',
            prodMode: false
          }
        }),
        { provide: PaymentDestinationService, useValue: destinationServiceSpy },
        { provide: PaymentVerificationService, useValue: verificationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ConfirmDialogService, useValue: confirmDialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component and load initial data', () => {
    expect(component).toBeTruthy();
    expect(verificationServiceSpy.getSummary).toHaveBeenCalled();
    expect(destinationServiceSpy.getAll).toHaveBeenCalled();
    expect(verificationServiceSpy.getEligibleSales).toHaveBeenCalled();
  });

  it('should display summary card values', () => {
    expect(component.summary().totalDestinations).toBe(2);
    expect(component.summary().verifiedTransactions).toBe(10);
    expect(component.summary().needsReviewTransactions).toBe(1);
  });

  it('should have invalid verification form initially', () => {
    expect(component.verifyForm.valid).toBe(false);
  });

  it('should validate form when sale and reference are selected', () => {
    component.verifyForm.patchValue({
      saleId: 'sale-1',
      paymentDestinationId: 'dest-1',
      submittedReference: 'FT2412345678'
    });

    expect(component.verifyForm.valid).toBe(true);
  });

  it('should auto-populate selected sale card when saleId is picked', () => {
    component.verifyForm.get('saleId')?.setValue('sale-1');
    expect(component.selectedSale()?.saleNumber).toBe('SAL-001');
    expect(component.selectedSale()?.outstandingBalance).toBe(1500);
  });
});
