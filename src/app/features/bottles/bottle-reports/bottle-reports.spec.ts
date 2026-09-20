import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottleReports } from './bottle-reports';

describe('BottleReports', () => {
  let component: BottleReports;
  let fixture: ComponentFixture<BottleReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleReports],
    }).compileComponents();

    fixture = TestBed.createComponent(BottleReports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
