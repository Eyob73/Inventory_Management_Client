import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PaymentVerificationService } from './payment-verification.service';
import { environment } from '../../../environments/environment';
import {
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  PaymentVerificationSummary,
  EligibleSale
} from '../../models/payment-verification.model';

describe('PaymentVerificationService', () => {
  let service: PaymentVerificationService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/payments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentVerificationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PaymentVerificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should verify customer payment', () => {
    const request: VerifyPaymentRequest = {
      saleId: 'sale-1',
      paymentDestinationId: 'dest-1',
      submittedReference: 'FT2412345678'
    };

    const mockResponse: VerifyPaymentResponse = {
      verificationId: 'v-1',
      saleId: 'sale-1',
      saleNumber: 'SAL-001',
      provider: 'Commercial Bank of Ethiopia',
      bankCode: 'cbe',
      submittedReference: 'FT2412345678',
      expectedAmount: 1200,
      verifiedAmount: 1200,
      currency: 'ETB',
      status: 'Verified',
      statusName: 'Verified',
      destinationMatchStatus: 'Matched',
      destinationMatchStatusName: 'Matched',
      verificationTimestamp: new Date().toISOString(),
      isEligibleForRetry: false,
      needsManualReview: false,
      saleUpdated: true
    };

    service.verifyPayment(request).subscribe((res) => {
      expect(res.status).toBe('Verified');
      expect(res.saleUpdated).toBe(true);
      expect(res.verifiedAmount).toBe(1200);
    });

    const req = httpMock.expectOne(`${baseUrl}/verify`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should fetch verification summary metrics', () => {
    const mockSummary: PaymentVerificationSummary = {
      totalDestinations: 4,
      activeDestinations: 3,
      verifiedTransactions: 15,
      needsReviewTransactions: 2
    };

    service.getSummary().subscribe((summary) => {
      expect(summary.totalDestinations).toBe(4);
      expect(summary.verifiedTransactions).toBe(15);
      expect(summary.needsReviewTransactions).toBe(2);
    });

    const req = httpMock.expectOne(`${baseUrl}/verifications/summary`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('should fetch eligible unpaid sales', () => {
    const mockSales: EligibleSale[] = [
      {
        id: 'sale-1',
        saleNumber: 'SAL-100',
        totalAmount: 2000,
        amountAlreadyPaid: 500,
        outstandingBalance: 1500,
        saleStatus: 'Partial',
        saleDate: new Date().toISOString(),
        paymentMethod: 'BankTransfer'
      }
    ];

    service.getEligibleSales('SAL-100').subscribe((sales) => {
      expect(sales.length).toBe(1);
      expect(sales[0].outstandingBalance).toBe(1500);
    });

    const req = httpMock.expectOne(`${baseUrl}/eligible-sales?search=SAL-100`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSales);
  });

  it('should process manual review', () => {
    service.processManualReview('v-1', { approved: true, notes: 'Verified via CBE app' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/verifications/v-1/manual-review`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.approved).toBe(true);
    req.flush({});
  });
});
