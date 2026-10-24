import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { CustomerBottlesComponent } from './customer-bottles';

describe('CustomerBottlesComponent', () => {
  let component: CustomerBottlesComponent;
  let fixture: ComponentFixture<CustomerBottlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerBottlesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({
          config: {
            availableLangs: ['en', 'am', 'om'],
            defaultLang: 'en',
          }
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerBottlesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
