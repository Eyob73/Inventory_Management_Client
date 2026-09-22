import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottleTransactions } from './bottle-transactions';

describe('BottleTransactions', () => {
  let component: BottleTransactions;
  let fixture: ComponentFixture<BottleTransactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleTransactions],
    }).compileComponents();

    fixture = TestBed.createComponent(BottleTransactions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
