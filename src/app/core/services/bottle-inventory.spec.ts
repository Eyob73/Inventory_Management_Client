import { TestBed } from '@angular/core/testing';

import { BottleInventory } from './bottle-inventory';

describe('BottleInventory', () => {
  let service: BottleInventory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BottleInventory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
