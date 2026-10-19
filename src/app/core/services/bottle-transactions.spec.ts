import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BottleTransactionsService } from './bottle-transactions';

describe('BottleTransactionsService', () => {
  let service: BottleTransactionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BottleTransactionsService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BottleTransactionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
