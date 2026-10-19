import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  PosPaymentVerificationDialogComponent,
  PosPaymentVerificationDialogData
} from './pos-payment-verification-dialog';
import { PaymentVerificationService } from '../../../../core/services/payment-verification.service';
import { PaymentDestinationService } from '../../../../core/services/payment-destination.service';
import { PaymentVerificationStore } from '../../../../store/payment-verification.store';
import {
  PaymentDestination,
  VerifyPaymentResponse
} from '../../../../models/payment-verification.model';

describe('PosPaymentVerificationDialogComponent', () => {
  let component: PosPaymentVerificationDialogComponent;
  let fixture: ComponentFixture<PosPaymentVerificationDialogComponent>;

  let dialogRefSpy: any;
  let verificationServiceSpy: any;
  let destinationServiceSpy: any;

  const mockDestinations: PaymentDestination[] = [
    {
      id: 'dest-cbe',
      name: 'Primary CBE Account',
      type: 'BankAccount',
      bankCode: 'cbe',
      bankName: 'Commercial Bank of Ethiopia',
      maskedAccountNumber: '1000****4567',
      isDefault: true,
      isActive: true,
      createdAtUtc: new Date().toISOString()
    },
    {
      id: 'dest-telebirr',
      name: 'Telebirr Merchant',
      type: 'Telebirr',
      bankCode: 'telebirr',
      bankName: 'Telebirr',
      maskedPhoneNumber: '+25191****3344',
      isDefault: false,
      isActive: true,
      createdAtUtc: new Date().toISOString()
    }
  ];

  const mockDialogData: PosPaymentVerificationDialogData = {
    totalAmount: 1250,
    customerName: 'Abebe Bikila',
    paymentMethod: 'Mobile Banking',
    cartPayload: {
      customerId: 'cust-1',
      customerName: 'Abebe Bikila',
      paymentMethod: 'Mobile Banking',
      amountReceived: 1250,
      discountAmount: 0,
      taxAmount: 0,
      items: [
        {
          productId: 'prod-1',
          quantity: 5,
          unitPrice: 250,
          discountAmount: 0
        }
      ]
    },
    saleReference: 'POS-009'
  };

  beforeEach(async () => {
    dialogRefSpy = {
      close: vi.fn()
    };

    verificationServiceSpy = {
      verifyPayment: vi.fn(),
      getSummary: vi.fn().mockReturnValue(of({ totalDestinations: 2, activeDestinations: 2, verifiedTransactions: 5, needsReviewTransactions: 0 })),
      getEligibleSales: vi.fn().mockReturnValue(of([])),
      getVerifications: vi.fn().mockReturnValue(of({ items: [], totalCount: 0, page: 1, pageSize: 10 }))
    };

    destinationServiceSpy = {
      getAll: vi.fn().mockReturnValue(of(mockDestinations)),
      getSupportedBanks: vi.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [PosPaymentVerificationDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: PaymentVerificationService, useValue: verificationServiceSpy },
        { provide: PaymentDestinationService, useValue: destinationServiceSpy },
        PaymentVerificationStore
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PosPaymentVerificationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize dialog with data', () => {
    expect(component).toBeTruthy();
    expect(component.data.totalAmount).toBe(1250);
    expect(component.data.customerName).toBe('Abebe Bikila');
    expect(component.verificationForm).toBeDefined();
  });

  it('should auto-select destination matching the payment method', () => {
    // Mobile Banking matches CBE / BankAccount
    expect(component.verificationForm.get('destinationId')?.value).toBe('dest-cbe');
  });

  it('should verify payment successfully and allow proceeding to confirm sale', () => {
    component.verificationForm.patchValue({
      destinationId: 'dest-cbe',
      submittedReference: 'FT2400987654'
    });

    const mockResponse: VerifyPaymentResponse = {
      verificationId: 'v-123',
      provider: 'CBE',
      bankCode: 'cbe',
      submittedReference: 'FT2400987654',
      verifiedReference: 'FT2400987654',
      expectedAmount: 1250,
      verifiedAmount: 1250,
      currency: 'ETB',
      status: 'Verified',
      statusName: 'Verified',
      destinationMatchStatus: 'Matched',
      destinationMatchStatusName: 'Matched',
      verificationTimestamp: new Date().toISOString(),
      isEligibleForRetry: false,
      needsManualReview: false,
      saleUpdated: false
    };

    verificationServiceSpy.verifyPayment.mockReturnValue(of(mockResponse));

    component.verifyPayment();

    expect(verificationServiceSpy.verifyPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentDestinationId: 'dest-cbe',
        submittedReference: 'FT2400987654',
        cart: mockDialogData.cartPayload
      })
    );

    expect(component.isVerified()).toBe(true);
    expect(component.verificationResult()).toEqual(mockResponse);

    // Click proceed
    component.proceedWithVerifiedPayment();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      action: 'verified',
      verification: mockResponse
    });
  });

  it('should handle skip verification cleanly without calling verification API', () => {
    component.skipVerification();

    expect(verificationServiceSpy.verifyPayment).not.toHaveBeenCalled();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'skipped' });
  });

  it('should handle cancel action without calling verification API', () => {
    component.cancel();

    expect(verificationServiceSpy.verifyPayment).not.toHaveBeenCalled();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'cancel' });
  });

  it('should display error message and keep dialog open when verification fails or is rejected', () => {
    component.verificationForm.patchValue({
      destinationId: 'dest-cbe',
      submittedReference: 'INVALID_REF'
    });

    const rejectedResponse: VerifyPaymentResponse = {
      verificationId: 'v-rejected',
      provider: 'CBE',
      bankCode: 'cbe',
      submittedReference: 'INVALID_REF',
      expectedAmount: 1250,
      currency: 'ETB',
      status: 'Rejected',
      statusName: 'Rejected',
      failureCode: 'PROVIDER_NOT_VERIFIED',
      failureMessage: 'Transaction reference not found by the bank.',
      destinationMatchStatus: 'UnableToConfirm',
      destinationMatchStatusName: 'UnableToConfirm',
      verificationTimestamp: new Date().toISOString(),
      isEligibleForRetry: false,
      needsManualReview: false,
      saleUpdated: false
    };

    verificationServiceSpy.verifyPayment.mockReturnValue(of(rejectedResponse));

    component.verifyPayment();

    expect(component.isVerified()).toBe(false);
    expect(component.verificationResult()).toEqual(rejectedResponse);
    // Dialog should NOT have been closed!
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });
});
