import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BottleInventoryComponent } from './bottle-inventory';

describe('BottleInventoryComponent', () => {
  let component: BottleInventoryComponent;
  let fixture: ComponentFixture<BottleInventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleInventoryComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(BottleInventoryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
