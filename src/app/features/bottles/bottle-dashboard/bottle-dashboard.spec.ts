import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BottleDashboardComponent } from './bottle-dashboard';

describe('BottleDashboardComponent', () => {
  let component: BottleDashboardComponent;
  let fixture: ComponentFixture<BottleDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleDashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BottleDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
