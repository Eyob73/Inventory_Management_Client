import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerBottles } from './customer-bottles';

describe('CustomerBottles', () => {
  let component: CustomerBottles;
  let fixture: ComponentFixture<CustomerBottles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerBottles],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerBottles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
