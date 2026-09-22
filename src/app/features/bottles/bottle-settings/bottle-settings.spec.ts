import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottleSettings } from './bottle-settings';

describe('BottleSettings', () => {
  let component: BottleSettings;
  let fixture: ComponentFixture<BottleSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(BottleSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
