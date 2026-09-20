import { TestBed } from '@angular/core/testing';

import { CustomerBottles } from './customer-bottles';

describe('CustomerBottles', () => {
  let service: CustomerBottles;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerBottles);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
