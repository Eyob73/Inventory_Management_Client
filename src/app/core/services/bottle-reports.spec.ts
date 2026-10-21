import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BottleReportsService } from './bottle-reports';

describe('BottleReportsService', () => {
  let service: BottleReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BottleReportsService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BottleReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
