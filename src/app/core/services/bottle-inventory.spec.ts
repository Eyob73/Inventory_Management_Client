import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BottleInventoryService } from './bottle-inventory';

describe('BottleInventoryService', () => {
  let service: BottleInventoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BottleInventoryService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BottleInventoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
