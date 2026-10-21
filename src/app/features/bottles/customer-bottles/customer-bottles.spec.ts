import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomerBottlesComponent } from './customer-bottles';

describe('CustomerBottlesComponent', () => {
  let component: CustomerBottlesComponent;
  let fixture: ComponentFixture<CustomerBottlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerBottlesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerBottlesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
