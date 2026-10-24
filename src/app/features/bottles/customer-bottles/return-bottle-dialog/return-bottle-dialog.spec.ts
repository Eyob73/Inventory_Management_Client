import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTransloco } from '@jsverse/transloco';
import { ReturnBottleDialogComponent } from './return-bottle-dialog';

describe('ReturnBottleDialogComponent', () => {
  let component: ReturnBottleDialogComponent;
  let fixture: ComponentFixture<ReturnBottleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReturnBottleDialogComponent],
      providers: [
        provideTransloco({
          config: {
            availableLangs: ['en', 'am', 'om'],
            defaultLang: 'en',
          }
        }),
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReturnBottleDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
