import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomerBottleDetailsDialogComponent } from './customer-bottle-details-dialog';

describe('CustomerBottleDetailsDialogComponent', () => {
  let component: CustomerBottleDetailsDialogComponent;
  let fixture: ComponentFixture<CustomerBottleDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerBottleDetailsDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: () => {} } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            balance: {
              id: 'cb-1',
              customerId: 'c-1',
              customerName: 'Abebe Kebede',
              bottleTypeId: 'bt-1',
              bottleTypeName: 'Beer Bottle 330ml',
              balance: 10,
              totalDeposit: 300,
              lastUpdatedAt: new Date()
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerBottleDetailsDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate avgDepositPerBottle correctly', () => {
    expect(component.avgDepositPerBottle()).toBe(30);
  });
});
