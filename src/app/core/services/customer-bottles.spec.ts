import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomerBottlesService } from './customer-bottles';

describe('CustomerBottlesService', () => {
  let service: CustomerBottlesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomerBottlesService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CustomerBottlesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
