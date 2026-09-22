import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottleDashboard } from './bottle-dashboard';

describe('BottleDashboard', () => {
  let component: BottleDashboard;
  let fixture: ComponentFixture<BottleDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(BottleDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
