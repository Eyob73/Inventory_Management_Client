import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BottleReportsComponent } from './bottle-reports';

describe('BottleReportsComponent', () => {
  let component: BottleReportsComponent;
  let fixture: ComponentFixture<BottleReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleReportsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(BottleReportsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
