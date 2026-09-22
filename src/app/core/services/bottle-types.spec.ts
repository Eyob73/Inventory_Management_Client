import { TestBed } from '@angular/core/testing';

import { BottleTypes } from './bottle-types';

describe('BottleTypes', () => {
  let service: BottleTypes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BottleTypes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
