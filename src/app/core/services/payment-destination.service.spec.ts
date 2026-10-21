import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PaymentDestinationService } from './payment-destination.service';
import { environment } from '../../../environments/environment';
import { CreatePaymentDestinationRequest, PaymentDestination } from '../../models/payment-verification.model';

describe('PaymentDestinationService', () => {
  let service: PaymentDestinationService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/payment-destinations`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentDestinationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PaymentDestinationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all payment destinations', () => {
    const mockDestinations: PaymentDestination[] = [
      {
        id: 'dest-1',
        name: 'Main CBE',
        type: 'BankAccount',
        bankCode: 'cbe',
        bankName: 'Commercial Bank of Ethiopia',
        maskedAccountNumber: '1000****6789',
        isDefault: true,
        isActive: true,
        createdAtUtc: new Date().toISOString()
      }
    ];

    service.getAll().subscribe((destinations) => {
      expect(destinations.length).toBe(1);
      expect(destinations[0].name).toBe('Main CBE');
      expect(destinations[0].isDefault).toBe(true);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockDestinations);
  });

  it('should create a payment destination', () => {
    const newDest: CreatePaymentDestinationRequest = {
      name: 'Cashier Telebirr',
      type: 'Telebirr',
      phoneNumber: '0911223344',
      isDefault: false
    };

    const mockResponse: PaymentDestination = {
      id: 'dest-2',
      name: newDest.name,
      type: 'Telebirr',
      maskedPhoneNumber: '+2519****3344',
      isDefault: false,
      isActive: true,
      createdAtUtc: new Date().toISOString()
    };

    service.create(newDest).subscribe((res) => {
      expect(res.id).toBe('dest-2');
      expect(res.name).toBe('Cashier Telebirr');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newDest);
    req.flush(mockResponse);
  });

  it('should set destination as default', () => {
    service.setDefault('dest-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/dest-1/default`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('should toggle destination status', () => {
    service.setStatus('dest-1', false).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/dest-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ isActive: false });
    req.flush({});
  });

  it('should delete a destination', () => {
    service.delete('dest-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/dest-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should fetch supported banks', () => {
    const mockBanks = [
      { id: 'cbe', name: 'Commercial Bank of Ethiopia', type: 'commercial', status: 'active', requiresAccount: true, requiresPhone: false }
    ];

    service.getSupportedBanks().subscribe((banks) => {
      expect(banks.length).toBe(1);
      expect(banks[0].id).toBe('cbe');
    });

    const req = httpMock.expectOne(`${baseUrl}/supported-banks`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBanks);
  });
});
