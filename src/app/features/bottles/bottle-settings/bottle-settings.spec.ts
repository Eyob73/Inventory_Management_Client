import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BottleSettingsComponent } from './bottle-settings';

describe('BottleSettingsComponent', () => {
  let component: BottleSettingsComponent;
  let fixture: ComponentFixture<BottleSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottleSettingsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(BottleSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
