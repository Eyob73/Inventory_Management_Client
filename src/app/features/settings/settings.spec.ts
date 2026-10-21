import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SettingsComponent } from './settings';
import { TenantApiService } from '../../services/tenant';
import { provideTransloco } from '@jsverse/transloco';

describe('SettingsComponent - POS Payment Verification', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let tenantApiService: TenantApiService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        provideTransloco({
          config: {
            availableLangs: ['en', 'am', 'om'],
            defaultLang: 'en',
          }
        }),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    tenantApiService = TestBed.inject(TenantApiService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with posPaymentVerificationEnabled as false by default', () => {
    expect(component.posPaymentVerificationEnabled()).toBe(false);
  });

  it('should toggle posPaymentVerificationEnabled to true on toggle change and persist', () => {
    const updateSpy = vi.spyOn(tenantApiService, 'updatePosPaymentVerification').mockReturnValue(
      of({ enabled: true })
    );

    component.onPaymentVerificationToggleChange(true);

    expect(updateSpy).toHaveBeenCalledWith(true);
    expect(component.posPaymentVerificationEnabled()).toBe(true);
    expect(tenantApiService.isPaymentVerificationEnabled()).toBe(true);
    expect(component.isSavingPaymentVerification()).toBe(false);
  });

  it('should toggle posPaymentVerificationEnabled to false on toggle change and persist', () => {
    component.posPaymentVerificationEnabled.set(true);

    const updateSpy = vi.spyOn(tenantApiService, 'updatePosPaymentVerification').mockReturnValue(
      of({ enabled: false })
    );

    component.onPaymentVerificationToggleChange(false);

    expect(updateSpy).toHaveBeenCalledWith(false);
    expect(component.posPaymentVerificationEnabled()).toBe(false);
    expect(tenantApiService.isPaymentVerificationEnabled()).toBe(false);
  });

  it('should restore previous state if updating pos payment verification fails', () => {
    component.posPaymentVerificationEnabled.set(false);

    vi.spyOn(tenantApiService, 'updatePosPaymentVerification').mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    component.onPaymentVerificationToggleChange(true);

    // Should rollback to false
    expect(component.posPaymentVerificationEnabled()).toBe(false);
    expect(component.isSavingPaymentVerification()).toBe(false);
  });

  it('should include posPaymentVerification in sections for admin role', () => {
    const sections = component.sections();
    const verificationSection = sections.find(s => s.id === 'posPaymentVerification');
    expect(verificationSection).toBeDefined();
    expect(verificationSection?.label).toBe('settingsFull.posPaymentVerificationTitle');
  });
});
