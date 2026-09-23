import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslocoDirective,
    RouterModule
  ],
  templateUrl: './forgot-password.html',
  styleUrls: ['../login/login.scss']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private transloco = inject(TranslocoService);

  form: FormGroup;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get emailControl() {
    return this.form.get('email')!;
  }

  emailErrorText(): string {
    if (this.emailControl.hasError('required')) return this.transloco.translate('loginFull.errEmailReq') || 'Email is required';
    if (this.emailControl.hasError('email')) return this.transloco.translate('loginFull.errEmailValid') || 'Enter a valid email';
    return '';
  }

  submit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const email = this.form.value.email;
    
    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.submitting = false;
        this.successMessage = res.message;
        this.form.reset();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'An error occurred. Please try again.';
      }
    });
  }
}
