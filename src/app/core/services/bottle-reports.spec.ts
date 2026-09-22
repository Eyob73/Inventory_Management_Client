import { TestBed } from '@angular/core/testing';

import { BottleReports } from './bottle-reports';

describe('BottleReports', () => {
  let service: BottleReports;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BottleReports);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
