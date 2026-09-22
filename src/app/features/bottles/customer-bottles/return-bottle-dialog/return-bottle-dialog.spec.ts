import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnBottleDialog } from './return-bottle-dialog';

describe('ReturnBottleDialog', () => {
  let component: ReturnBottleDialog;
  let fixture: ComponentFixture<ReturnBottleDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReturnBottleDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ReturnBottleDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
