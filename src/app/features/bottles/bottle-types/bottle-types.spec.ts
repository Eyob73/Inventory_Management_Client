import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BottleTypesComponent } from './bottle-types';

describe('BottleTypesComponent', () => {
  let component: BottleTypesComponent;
  let fixture: ComponentFixture<BottleTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleTypesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(BottleTypesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
