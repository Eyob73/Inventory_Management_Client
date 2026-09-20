import { TestBed } from '@angular/core/testing';

import { BottleTransactions } from './bottle-transactions';

describe('BottleTransactions', () => {
  let service: BottleTransactions;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BottleTransactions);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
