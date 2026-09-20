import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottleTypes } from './bottle-types';

describe('BottleTypes', () => {
  let component: BottleTypes;
  let fixture: ComponentFixture<BottleTypes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleTypes],
    }).compileComponents();

    fixture = TestBed.createComponent(BottleTypes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
