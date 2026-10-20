import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideTransloco } from '@jsverse/transloco';

import { PaymentVerificationComponent } from './payment-verification';
import { PaymentDestinationService } from '../../core/services/payment-destination.service';
import { PaymentVerificationService } from '../../core/services/payment-verification.service';
import { ReceiptScannerService } from '../../core/services/receipt-scanner.service';
import { AuthService } from '../../services/auth';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import {
  PaymentDestination,
  PaymentVerificationSummary,
  EligibleSale,
  ExtractedReceiptDetails
} from '../../models/payment-verification.model';

describe('PaymentVerificationComponent', () => {
  let component: PaymentVerificationComponent;
  let fixture: ComponentFixture<PaymentVerificationComponent>;

  let destinationServiceSpy: any;
  let verificationServiceSpy: any;
  let authServiceSpy: any;
  let confirmDialogSpy: any;
  let scannerServiceSpy: any;

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
    },
    {
      id: 'dest-telebirr',
      name: 'Telebirr Merchant',
      type: 'Telebirr',
      bankCode: 'telebirr',
      bankName: 'Telebirr',
      maskedPhoneNumber: '+25191****1234',
      isDefault: false,
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

    scannerServiceSpy = {
      validateReceiptImage: vi.fn().mockReturnValue({ valid: true }),
      decodeReceiptImage: vi.fn().mockResolvedValue('FT2401234567'),
      parseQrData: vi.fn().mockImplementation((raw: string) => {
        return {
          rawContent: raw,
          provider: 'cbe',
          providerName: 'Commercial Bank of Ethiopia',
          transactionReference: raw.includes('FT') ? raw : 'FT2401234567',
          amount: 1500,
          currency: 'ETB',
          payerName: 'Abebe Kebede',
          payerPhone: '0911223344',
          receiverAccountMasked: '1000****6789'
        } as ExtractedReceiptDetails;
      }),
      startCamera: vi.fn().mockResolvedValue({ isScanning: true }),
      stopCamera: vi.fn().mockResolvedValue(undefined)
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
        { provide: ConfirmDialogService, useValue: confirmDialogSpy },
        { provide: ReceiptScannerService, useValue: scannerServiceSpy }
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
    // Reference is empty
    expect(component.verifyForm.get('submittedReference')?.valid).toBe(false);
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

  // ── Scanner & Receipt Tests ──────────────────────────────────────────

  it('should initialize with manual scan mode', () => {
    expect(component.scanMode()).toBe('manual');
    expect(component.isCameraScanning()).toBe(false);
    expect(component.scannedDetails()).toBeNull();
  });

  it('should switch between scan modes', async () => {
    await component.setScanMode('upload');
    expect(component.scanMode()).toBe('upload');

    await component.setScanMode('manual');
    expect(component.scanMode()).toBe('manual');
  });

  it('should start and stop camera scan properly', async () => {
    await component.startCameraScan();
    expect(component.scanMode()).toBe('camera');
    expect(scannerServiceSpy.startCamera).toHaveBeenCalledWith(
      'page-qr-reader',
      expect.any(Function),
      expect.any(Function)
    );
    expect(component.isCameraScanning()).toBe(true);

    await component.stopCameraScan();
    expect(scannerServiceSpy.stopCamera).toHaveBeenCalled();
    expect(component.isCameraScanning()).toBe(false);
  });

  it('should handle camera access error gracefully', async () => {
    scannerServiceSpy.startCamera.mockRejectedValueOnce(new Error('Permission denied'));

    await component.startCameraScan();
    expect(component.isCameraScanning()).toBe(false);
    expect(component.cameraError()).toContain('Permission denied');
  });

  it('should stop camera scan when switching tabs', async () => {
    await component.startCameraScan();
    expect(component.isCameraScanning()).toBe(true);

    // Switch to tab index 1 (Payment Destinations)
    component.onTabChange(1);
    expect(scannerServiceSpy.stopCamera).toHaveBeenCalled();
    expect(component.isCameraScanning()).toBe(false);
  });

  it('should clean up camera scanner on ngOnDestroy', async () => {
    await component.startCameraScan();
    component.ngOnDestroy();
    expect(scannerServiceSpy.stopCamera).toHaveBeenCalled();
  });

  it('should parse scanned QR code and auto-populate form fields', () => {
    component.onQrScanned('FT2401234567');

    const details = component.scannedDetails();
    expect(details).toBeTruthy();
    expect(details?.transactionReference).toBe('FT2401234567');
    expect(details?.payerPhone).toBe('0911223344');

    expect(component.verifyForm.get('submittedReference')?.value).toBe('FT2401234567');
    expect(component.verifyForm.get('payerPhone')?.value).toBe('0911223344');
    expect(component.verifyForm.get('qrData')?.value).toBe('FT2401234567');
    expect(component.scanMode()).toBe('manual');
  });

  it('should auto-match destination based on detected provider when none selected', () => {
    component.verifyForm.patchValue({ paymentDestinationId: '' });

    component.onQrScanned('FT2401234567');
    // cbe provider should match dest-1
    expect(component.verifyForm.get('paymentDestinationId')?.value).toBe('dest-1');
  });

  it('should display warning for merchant payment request only QR codes', () => {
    scannerServiceSpy.parseQrData.mockReturnValueOnce({
      rawContent: 'https://example.com/pay',
      isPaymentRequestOnly: true,
      provider: 'Telebirr',
      parseWarnings: ['Scanned code is a payment request.']
    });

    component.onQrScanned('https://example.com/pay');
    expect(component.scannedDetails()?.isPaymentRequestOnly).toBe(true);
  });

  it('should validate amount match against selected sale balance', () => {
    component.verifyForm.get('saleId')?.setValue('sale-1');
    expect(component.selectedSale()?.outstandingBalance).toBe(1500);

    // Matching amount
    scannerServiceSpy.parseQrData.mockReturnValueOnce({
      transactionReference: 'FT111',
      amount: 1500
    });
    component.onQrScanned('FT111');
    expect(component.isScannedAmountMatch()).toBe(true);

    // Mismatched amount
    scannerServiceSpy.parseQrData.mockReturnValueOnce({
      transactionReference: 'FT222',
      amount: 800
    });
    component.onQrScanned('FT222');
    expect(component.isScannedAmountMatch()).toBe(false);
  });

  it('should validate and process uploaded receipt image', async () => {
    const file = new File(['mock content'], 'receipt.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as any;

    component.onFileSelected(event);
    expect(scannerServiceSpy.validateReceiptImage).toHaveBeenCalledWith(file);
    expect(component.selectedFile()).toBe(file);
  });

  it('should display error if uploaded image is rejected by validator', () => {
    scannerServiceSpy.validateReceiptImage.mockReturnValueOnce({
      valid: false,
      error: 'File size exceeds 5MB limit.'
    });

    const file = new File(['content'], 'huge.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as any;

    component.onFileSelected(event);
    expect(component.uploadError()).toBe('File size exceeds 5MB limit.');
    expect(component.selectedFile()).toBeNull();
  });

  it('should handle decode image error gracefully', async () => {
    scannerServiceSpy.decodeReceiptImage.mockRejectedValueOnce(new Error('No QR code found'));
    const file = new File(['content'], 'blurry.png', { type: 'image/png' });

    await component.decodeUploadedImage(file);
    expect(component.uploadError()).toContain('No QR code found');
  });

  it('should remove selected file and clear preview', () => {
    const file = new File(['content'], 'receipt.png', { type: 'image/png' });
    component.selectedFile.set(file);
    component.imagePreviewUrl.set('blob:http://localhost/test');

    component.removeSelectedFile();
    expect(component.selectedFile()).toBeNull();
    expect(component.imagePreviewUrl()).toBeNull();
  });

  it('should clear scanned details when clearScannedDetails is invoked', () => {
    component.scannedDetails.set({ transactionReference: 'FT123' } as any);
    component.clearScannedDetails();
    expect(component.scannedDetails()).toBeNull();
  });
});
