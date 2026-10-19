import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BottleTransactionsComponent } from './bottle-transactions';

describe('BottleTransactionsComponent', () => {
  let component: BottleTransactionsComponent;
  let fixture: ComponentFixture<BottleTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleTransactionsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(BottleTransactionsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
