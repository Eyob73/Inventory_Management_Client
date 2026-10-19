import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PaymentVerificationStore } from '../../../../store/payment-verification.store';
import {
  PaymentDestination,
  PaymentDestinationType,
  CreatePaymentDestinationRequest,
  UpdatePaymentDestinationRequest
} from '../../../../models/payment-verification.model';

export interface PaymentDestinationDialogData {
  destination?: PaymentDestination;
}

@Component({
  selector: 'app-payment-destination-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './payment-destination-dialog.html',
  styleUrl: './payment-destination-dialog.scss'
})
export class PaymentDestinationDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PaymentDestinationDialogComponent>);
  private store = inject(PaymentVerificationStore);

  destinationForm!: FormGroup;
  isEditMode = false;
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Store signals
  readonly supportedBanks = this.store.supportedBanks;
  readonly isLoadingBanks = this.store.isLoadingBanks;

  readonly destinationTypes: { label: string; value: PaymentDestinationType; icon: string }[] = [
    { label: 'Bank Account', value: 'BankAccount', icon: 'account_balance' },
    { label: 'Telebirr Phone', value: 'Telebirr', icon: 'phone_android' }
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data: PaymentDestinationDialogData) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.destination;
    const dest = this.data?.destination;

    const initialType: PaymentDestinationType =
      dest?.type === 2 || dest?.type === 'Telebirr' ? 'Telebirr' : 'BankAccount';

    this.destinationForm = this.fb.group({
      name: [dest?.name || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      type: [initialType, [Validators.required]],
      bankCode: [dest?.bankCode || ''],
      bankName: [dest?.bankName || ''],
      accountNumber: ['', []],
      phoneNumber: [dest?.maskedPhoneNumber ? '' : ''],
      accountHolderName: [dest?.accountHolderName || '', [Validators.maxLength(100)]],
      isDefault: [dest?.isDefault ?? false],
      isActive: [dest?.isActive ?? true]
    });

    this.updateConditionalValidators(initialType);

    this.destinationForm.get('type')?.valueChanges.subscribe((type: PaymentDestinationType) => {
      this.updateConditionalValidators(type);
    });

    this.destinationForm.get('bankCode')?.valueChanges.subscribe((bankCode: string) => {
      const selected = this.supportedBanks().find(b => b.id.toLowerCase() === (bankCode || '').toLowerCase());
      if (selected) {
        this.destinationForm.get('bankName')?.setValue(selected.name, { emitEvent: false });
      }
    });

    if (this.supportedBanks().length === 0) {
      this.store.loadSupportedBanks();
    }
  }

  private updateConditionalValidators(type: PaymentDestinationType): void {
    const bankCodeCtrl = this.destinationForm.get('bankCode');
    const accountCtrl = this.destinationForm.get('accountNumber');
    const phoneCtrl = this.destinationForm.get('phoneNumber');

    if (type === 'BankAccount') {
      bankCodeCtrl?.setValidators([Validators.required]);
      if (!this.isEditMode) {
        accountCtrl?.setValidators([Validators.required, Validators.minLength(5), Validators.maxLength(30)]);
      } else {
        accountCtrl?.setValidators([Validators.maxLength(30)]);
      }
      phoneCtrl?.clearValidators();
      phoneCtrl?.setValue('');
    } else {
      bankCodeCtrl?.clearValidators();
      bankCodeCtrl?.setValue('telebirr');
      this.destinationForm.get('bankName')?.setValue('Telebirr');
      accountCtrl?.clearValidators();
      accountCtrl?.setValue('');

      const phoneValidators = [
        Validators.pattern(/^(?:\+251|0)?[79]\d{8}$/)
      ];
      if (!this.isEditMode) {
        phoneValidators.unshift(Validators.required);
      }
      phoneCtrl?.setValidators(phoneValidators);
    }

    bankCodeCtrl?.updateValueAndValidity();
    accountCtrl?.updateValueAndValidity();
    phoneCtrl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.destinationForm.invalid) {
      this.destinationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.destinationForm.value;

    if (this.isEditMode && this.data?.destination) {
      const updateReq: UpdatePaymentDestinationRequest = {
        name: val.name.trim(),
        bankCode: val.type === 'BankAccount' ? val.bankCode : 'telebirr',
        bankName: val.type === 'BankAccount' ? val.bankName : 'Telebirr',
        accountNumber: val.accountNumber ? val.accountNumber.trim() : undefined,
        phoneNumber: val.phoneNumber ? val.phoneNumber.trim() : undefined,
        accountHolderName: val.accountHolderName ? val.accountHolderName.trim() : undefined,
        isDefault: !!val.isDefault,
        isActive: !!val.isActive
      };

      this.store.updateDestination({
        id: this.data.destination.id,
        dto: updateReq,
        onSuccess: (res) => {
          this.isSubmitting.set(false);
          this.dialogRef.close(res);
        },
        onError: (msg) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(msg);
        }
      });
    } else {
      const createReq: CreatePaymentDestinationRequest = {
        name: val.name.trim(),
        type: val.type,
        bankCode: val.type === 'BankAccount' ? val.bankCode : 'telebirr',
        bankName: val.type === 'BankAccount' ? val.bankName : 'Telebirr',
        accountNumber: val.accountNumber ? val.accountNumber.trim() : undefined,
        phoneNumber: val.phoneNumber ? val.phoneNumber.trim() : undefined,
        accountHolderName: val.accountHolderName ? val.accountHolderName.trim() : undefined,
        isDefault: !!val.isDefault
      };

      this.store.createDestination({
        dto: createReq,
        onSuccess: (res) => {
          this.isSubmitting.set(false);
          this.dialogRef.close(res);
        },
        onError: (msg) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(msg);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
