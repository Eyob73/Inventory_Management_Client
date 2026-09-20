import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottleInventory } from './bottle-inventory';

describe('BottleInventory', () => {
  let component: BottleInventory;
  let fixture: ComponentFixture<BottleInventory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleInventory],
    }).compileComponents();

    fixture = TestBed.createComponent(BottleInventory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
