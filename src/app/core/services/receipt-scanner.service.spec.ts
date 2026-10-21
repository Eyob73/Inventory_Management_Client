import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReceiptScannerService, MAX_RECEIPT_FILE_SIZE } from './receipt-scanner.service';

describe('ReceiptScannerService', () => {
  let service: ReceiptScannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReceiptScannerService]
    });
    service = TestBed.inject(ReceiptScannerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateReceiptImage', () => {
    it('should accept valid JPEG, PNG, and WebP files under 5MB', () => {
      const jpegFile = new File(['mock content'], 'receipt.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['mock content'], 'receipt.png', { type: 'image/png' });
      const webpFile = new File(['mock content'], 'receipt.webp', { type: 'image/webp' });

      expect(service.validateReceiptImage(jpegFile).valid).toBe(true);
      expect(service.validateReceiptImage(pngFile).valid).toBe(true);
      expect(service.validateReceiptImage(webpFile).valid).toBe(true);
    });

    it('should reject non-image or unsupported formats', () => {
      const pdfFile = new File(['mock content'], 'receipt.pdf', { type: 'application/pdf' });
      const res = service.validateReceiptImage(pdfFile);

      expect(res.valid).toBe(false);
      expect(res.error).toContain('Unsupported file format');
    });

    it('should reject files exceeding 5MB', () => {
      // Create a mock large file
      const largeFile = new File(['a'], 'huge.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: MAX_RECEIPT_FILE_SIZE + 1024 });

      const res = service.validateReceiptImage(largeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('too large');
    });
  });

  describe('parseQrData', () => {
    it('should parse an official CBE receipt URL with query params', () => {
      const cbeUrl = 'https://apps.cbe.com.et:4130/receipt?ref=FT2409876543&amount=1250.50&date=2026-10-20&payer=Abebe';
      const result = service.parseQrData(cbeUrl);

      expect(result.provider).toBe('cbe');
      expect(result.providerName).toContain('Commercial Bank of Ethiopia');
      expect(result.transactionReference).toBe('FT2409876543');
      expect(result.amount).toBe(1250.5);
      expect(result.currency).toBe('ETB');
      expect(result.transactionDate).toBe('2026-10-20');
      expect(result.payerName).toBe('Abebe');
      expect(result.isPaymentRequestOnly).toBeFalsy();
    });

    it('should parse an official Telebirr receipt URL', () => {
      const telebirrUrl = 'https://transactioninfo.ethiotelecom.et/receipt?id=CL0987654321&amount=500&payerPhone=0911223344';
      const result = service.parseQrData(telebirrUrl);

      expect(result.provider).toBe('telebirr');
      expect(result.providerName).toBe('Telebirr');
      expect(result.transactionReference).toBe('CL0987654321');
      expect(result.amount).toBe(500);
      expect(result.payerPhone).toBe('0911223344');
    });

    it('should detect merchant payment requests and warn that it is not a completed receipt', () => {
      const upiRequest = 'upi://pay?pa=merchant@cbe&pn=Store&am=1000';
      const result = service.parseQrData(upiRequest);

      expect(result.isPaymentRequestOnly).toBe(true);
      expect(result.parseWarnings?.length).toBeGreaterThan(0);
      expect(result.parseWarnings?.[0]).toContain('merchant payment request');
    });

    it('should warn when URL is from an unrecognized domain', () => {
      const untrustedUrl = 'https://untrusted-domain.com/receipt?ref=FT2400112233';
      const result = service.parseQrData(untrustedUrl);

      expect(result.transactionReference).toBe('FT2400112233');
      expect(result.parseWarnings?.some(w => w.includes('not a recognized Ethiopian banking domain'))).toBe(true);
    });

    it('should parse JSON formatted receipt payload', () => {
      const jsonPayload = JSON.stringify({
        bank: 'cbe',
        ref: 'FT2400123456',
        amount: 850,
        currency: 'ETB',
        phone: '0911223344',
        account: '1000123456789'
      });

      const result = service.parseQrData(jsonPayload);

      expect(result.provider).toBe('cbe');
      expect(result.transactionReference).toBe('FT2400123456');
      expect(result.amount).toBe(850);
      expect(result.currency).toBe('ETB');
      expect(result.payerPhone).toBe('0911223344');
      // Account must be masked
      expect(result.payerAccountMasked).toBe('1****6789');
    });

    it('should parse Key-Value line formatted receipt string', () => {
      const kvText = `
        Provider: Telebirr
        Reference: CL9988776655
        Amount: 420.00 ETB
        Date: 2026-10-20
      `;

      const result = service.parseQrData(kvText);

      expect(result.provider).toBe('telebirr');
      expect(result.transactionReference).toBe('CL9988776655');
      expect(result.amount).toBe(420);
      expect(result.currency).toBe('ETB');
    });

    it('should identify plain CBE reference code', () => {
      const raw = 'FT2409876543';
      const result = service.parseQrData(raw);

      expect(result.transactionReference).toBe('FT2409876543');
      expect(result.provider).toBe('cbe');
    });

    it('should handle empty or whitespace string cleanly', () => {
      const result = service.parseQrData('   ');
      expect(result.parseErrors?.length).toBeGreaterThan(0);
      expect(result.transactionReference).toBeUndefined();
    });
  });
});
