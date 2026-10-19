import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BottleTypesService } from './bottle-types';

describe('BottleTypesService', () => {
  let service: BottleTypesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BottleTypesService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BottleTypesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
