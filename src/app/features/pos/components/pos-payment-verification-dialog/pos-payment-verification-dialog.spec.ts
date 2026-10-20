import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { provideTransloco } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import {
  PosPaymentVerificationDialogComponent,
  PosPaymentVerificationDialogData
} from './pos-payment-verification-dialog';
import { PaymentVerificationService } from '../../../../core/services/payment-verification.service';
import { PaymentDestinationService } from '../../../../core/services/payment-destination.service';
import { ReceiptScannerService } from '../../../../core/services/receipt-scanner.service';
import { PaymentVerificationStore } from '../../../../store/payment-verification.store';
import {
  PaymentDestination,
  VerifyPaymentResponse,
  ExtractedReceiptDetails
} from '../../../../models/payment-verification.model';

describe('PosPaymentVerificationDialogComponent', () => {
  let component: PosPaymentVerificationDialogComponent;
  let fixture: ComponentFixture<PosPaymentVerificationDialogComponent>;

  let dialogRefSpy: any;
  let dialogSpy: any;
  let verificationServiceSpy: any;
  let destinationServiceSpy: any;
  let scannerServiceSpy: any;

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

    dialogSpy = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(undefined)
      })
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

    scannerServiceSpy = {
      validateReceiptImage: vi.fn().mockReturnValue({ valid: true }),
      decodeReceiptImage: vi.fn().mockResolvedValue('FT2409876543'),
      parseQrData: vi.fn().mockImplementation((raw: string) => {
        return {
          rawContent: raw,
          provider: 'cbe',
          providerName: 'Commercial Bank of Ethiopia',
          transactionReference: raw.includes('FT') ? raw : 'FT2409876543',
          amount: 1250,
          currency: 'ETB',
          transactionDate: '2026-10-20'
        } as ExtractedReceiptDetails;
      }),
      startCamera: vi.fn().mockResolvedValue({ isScanning: true, stop: vi.fn(), clear: vi.fn() }),
      stopCamera: vi.fn().mockResolvedValue(undefined)
    };

    await TestBed.configureTestingModule({
      imports: [PosPaymentVerificationDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        provideTransloco({ config: { availableLangs: ['en'], defaultLang: 'en' } }),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: PaymentVerificationService, useValue: verificationServiceSpy },
        { provide: PaymentDestinationService, useValue: destinationServiceSpy },
        { provide: ReceiptScannerService, useValue: scannerServiceSpy },
        PaymentVerificationStore
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PosPaymentVerificationDialogComponent);
    component = fixture.componentInstance;
    // Ensure the dialog spy is used when openResultDialog is triggered
    (component as any).dialog = dialogSpy;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create and initialize dialog with data', () => {
    expect(component).toBeTruthy();
    expect(component.data.totalAmount).toBe(1250);
    expect(component.data.customerName).toBe('Abebe Bikila');
    expect(component.verificationForm).toBeDefined();
    expect(component.scanMode()).toBe('manual');
  });

  it('should auto-select destination matching the payment method', () => {
    // Mobile Banking matches CBE / BankAccount
    expect(component.verificationForm.get('destinationId')?.value).toBe('dest-cbe');
  });

  describe('Scan Mode Navigation', () => {
    it('should switch between manual, camera, and upload modes', async () => {
      expect(component.scanMode()).toBe('manual');

      await component.setScanMode('upload');
      expect(component.scanMode()).toBe('upload');
      expect(component.uploadError()).toBeNull();

      await component.setScanMode('manual');
      expect(component.scanMode()).toBe('manual');
    });

    it('should stop active camera when switching to another mode', async () => {
      // Start camera
      await component.startCameraScan();
      expect(component.isCameraScanning()).toBe(true);

      // Switch to upload
      await component.setScanMode('upload');
      expect(scannerServiceSpy.stopCamera).toHaveBeenCalled();
      expect(component.isCameraScanning()).toBe(false);
    });

    it('should handle camera access failure gracefully', async () => {
      scannerServiceSpy.startCamera.mockRejectedValueOnce(new Error('Camera permission denied by user'));

      await component.startCameraScan();

      expect(component.isCameraScanning()).toBe(false);
      expect(component.cameraError()).toContain('Camera permission denied');
    });
  });

  describe('Receipt Upload Handling', () => {
    it('should reject invalid file format', () => {
      const invalidFile = new File(['text'], 'receipt.txt', { type: 'text/plain' });
      scannerServiceSpy.validateReceiptImage.mockReturnValueOnce({
        valid: false,
        error: 'Unsupported file format (text/plain).'
      });

      const event = {
        target: { files: [invalidFile], value: '' }
      } as any;

      component.onFileSelected(event);

      expect(component.selectedFile()).toBeNull();
      expect(component.uploadError()).toContain('Unsupported file format');
    });

    it('should process and decode valid uploaded image', async () => {
      const validFile = new File(['image data'], 'receipt.jpg', { type: 'image/jpeg' });
      scannerServiceSpy.validateReceiptImage.mockReturnValueOnce({ valid: true });
      scannerServiceSpy.decodeReceiptImage.mockResolvedValueOnce('https://apps.cbe.com.et:4130/receipt?ref=FT2409876543&amount=1250');
      scannerServiceSpy.parseQrData.mockReturnValueOnce({
        rawContent: 'https://apps.cbe.com.et:4130/receipt?ref=FT2409876543&amount=1250',
        provider: 'cbe',
        providerName: 'Commercial Bank of Ethiopia',
        transactionReference: 'FT2409876543',
        amount: 1250,
        currency: 'ETB'
      });

      // Stub URL.createObjectURL and revokeObjectURL
      const origCreate = URL.createObjectURL;
      const origRevoke = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-preview');
      URL.revokeObjectURL = vi.fn();

      await component.decodeUploadedImage(validFile);

      expect(scannerServiceSpy.decodeReceiptImage).toHaveBeenCalledWith(validFile);
      expect(component.scannedDetails()?.transactionReference).toBe('FT2409876543');
      expect(component.verificationForm.get('submittedReference')?.value).toBe('FT2409876543');

      // Cleanup
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    });

    it('should display clear feedback and allow manual entry when image has no QR code', async () => {
      const noQrFile = new File(['image data'], 'printed_receipt.jpg', { type: 'image/jpeg' });
      scannerServiceSpy.decodeReceiptImage.mockRejectedValueOnce(
        new Error('No readable QR code found in this receipt image. Standard QR decoding cannot read printed or handwritten text without OCR.')
      );

      await component.decodeUploadedImage(noQrFile);

      expect(component.uploadError()).toContain('No readable QR code found');
      // Should not break form
      expect(component.verificationForm.valid).toBe(false);
    });

    it('should allow removing selected file preview', () => {
      component.selectedFile.set(new File(['data'], 'receipt.png', { type: 'image/png' }));
      component.imagePreviewUrl.set('blob:test');

      component.removeSelectedFile();

      expect(component.selectedFile()).toBeNull();
      expect(component.imagePreviewUrl()).toBeNull();
    });
  });

  describe('Extracted Details Review & Submission', () => {
    it('should populate form and display extracted review details on successful scan', () => {
      const extracted: ExtractedReceiptDetails = {
        rawContent: 'https://apps.cbe.com.et:4130/receipt?ref=FT2409876543&amount=1250',
        provider: 'cbe',
        providerName: 'Commercial Bank of Ethiopia',
        transactionReference: 'FT2409876543',
        amount: 1250,
        currency: 'ETB',
        transactionDate: '2026-10-20',
        payerPhone: '0911223344'
      };

      scannerServiceSpy.parseQrData.mockReturnValueOnce(extracted);

      component.onQrScanned('https://apps.cbe.com.et:4130/receipt?ref=FT2409876543&amount=1250');

      expect(component.scannedDetails()).toEqual(extracted);
      expect(component.verificationForm.get('submittedReference')?.value).toBe('FT2409876543');
      expect(component.verificationForm.get('payerPhone')?.value).toBe('0911223344');
      expect(component.verificationForm.get('qrData')?.value).toBe(extracted.rawContent);
      expect(component.isScannedAmountMatch()).toBe(true);
      expect(component.scanMode()).toBe('manual');
    });

    it('should detect and alert when scanned QR is a payment request rather than a receipt', () => {
      const merchantQr: ExtractedReceiptDetails = {
        rawContent: 'upi://pay?pa=merchant@cbe',
        isPaymentRequestOnly: true,
        parseWarnings: ['Merchant payment instruction detected.']
      };

      scannerServiceSpy.parseQrData.mockReturnValueOnce(merchantQr);

      component.onQrScanned('upi://pay?pa=merchant@cbe');

      expect(component.scannedDetails()?.isPaymentRequestOnly).toBe(true);
    });

    it('should indicate amount mismatch when scanned receipt amount differs from sale total', () => {
      component.scannedDetails.set({
        rawContent: 'test',
        amount: 500, // Expected is 1250
        transactionReference: 'FT2400998877'
      });

      expect(component.isScannedAmountMatch()).toBe(false);
    });

    it('should allow clearing scanned details', () => {
      component.scannedDetails.set({
        rawContent: 'test',
        transactionReference: 'FT123'
      });

      component.clearScannedDetails();
      expect(component.scannedDetails()).toBeNull();
    });
  });

  describe('Payment Verification API & Actions', () => {
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
      expect(dialogSpy.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({ result: mockResponse })
        })
      );

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
      expect(dialogSpy.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({ result: rejectedResponse })
        })
      );
      // Dialog should NOT have been closed!
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });
});
