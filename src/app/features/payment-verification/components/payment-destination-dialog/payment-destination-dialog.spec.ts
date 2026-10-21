import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { PaymentDestinationDialogComponent } from './payment-destination-dialog';
import { PaymentDestinationService } from '../../../../core/services/payment-destination.service';

describe('PaymentDestinationDialogComponent', () => {
  let component: PaymentDestinationDialogComponent;
  let fixture: ComponentFixture<PaymentDestinationDialogComponent>;
  let destinationServiceSpy: any;
  let dialogRefSpy: any;

  beforeEach(async () => {
    destinationServiceSpy = {
      getSupportedBanks: vi.fn().mockReturnValue(of([
        { id: 'cbe', name: 'Commercial Bank of Ethiopia', type: 'commercial', status: 'active', requiresAccount: true, requiresPhone: false }
      ])),
      create: vi.fn(),
      update: vi.fn()
    };
    dialogRefSpy = {
      close: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PaymentDestinationDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        { provide: PaymentDestinationService, useValue: destinationServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentDestinationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create dialog and initialize form for Bank Account by default', () => {
    expect(component).toBeTruthy();
    expect(component.destinationForm.get('type')?.value).toBe('BankAccount');
    expect(component.destinationForm.get('bankCode')?.validator).toBeTruthy();
    expect(component.destinationForm.get('accountNumber')?.validator).toBeTruthy();
  });

  it('should switch validators when type changes to Telebirr', () => {
    component.destinationForm.get('type')?.setValue('Telebirr');

    expect(component.destinationForm.get('phoneNumber')?.validator).toBeTruthy();
    expect(component.destinationForm.get('bankCode')?.value).toBe('telebirr');
  });

  it('should validate Ethiopian phone number pattern', () => {
    component.destinationForm.get('type')?.setValue('Telebirr');
    const phoneCtrl = component.destinationForm.get('phoneNumber');

    phoneCtrl?.setValue('12345');
    expect(phoneCtrl?.valid).toBe(false);

    phoneCtrl?.setValue('0911223344');
    expect(phoneCtrl?.valid).toBe(true);

    phoneCtrl?.setValue('+251911223344');
    expect(phoneCtrl?.valid).toBe(true);
  });

  it('should submit valid bank account destination', () => {
    destinationServiceSpy.create.mockReturnValue(of({
      id: 'dest-new',
      name: 'Test Bank',
      type: 'BankAccount',
      bankCode: 'cbe',
      isDefault: false,
      isActive: true,
      createdAtUtc: new Date().toISOString()
    }));

    component.destinationForm.patchValue({
      name: 'Main Business Account',
      type: 'BankAccount',
      bankCode: 'cbe',
      accountNumber: '1000123456789'
    });

    component.onSubmit();

    expect(destinationServiceSpy.create).toHaveBeenCalled();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});
