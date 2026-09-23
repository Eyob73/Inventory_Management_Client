import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../../services/auth';

export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.html',
  styleUrls: ['../login/login.scss']
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private transloco = inject(TranslocoService);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  submitting = false;
  successMessage = '';
  errorMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;

  token = '';
  email = '';

  constructor() {
    this.form = this.fb.group({
      password: ['', [
        Validators.required, 
        Validators.minLength(12),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.email = params['email'];
      
      if (!this.token || !this.email) {
        this.errorMessage = this.transloco.translate('resetPassword.invalidLink') || 'This password reset link is invalid or has expired.';
      }
    });
  }

  get passwordControl() { return this.form.get('password')!; }
  get confirmPasswordControl() { return this.form.get('confirmPassword')!; }

  passwordErrorText(): string {
    if (this.passwordControl.hasError('required')) return this.transloco.translate('loginFull.errPassReq') || 'Password is required';
    if (this.passwordControl.hasError('minlength')) return 'Password must be at least 12 characters';
    if (this.passwordControl.hasError('pattern')) return 'Password must contain uppercase, lowercase, number, and special character';
    return '';
  }

  confirmPasswordErrorText(): string {
    if (this.confirmPasswordControl.hasError('required')) return 'Please confirm your password';
    if (this.form.hasError('passwordMismatch')) return 'Passwords do not match';
    return '';
  }

  submit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.token || !this.email) {
      this.errorMessage = 'This password reset link is invalid or has expired.';
      return;
    }

    this.submitting = true;
    
    const payload = {
      token: this.token,
      email: this.email,
      newPassword: this.form.value.password
    };
    
    this.authService.resetPassword(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        this.successMessage = res.message;
        this.form.reset();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'This password reset link is invalid or has expired.';
      }
    });
  }
}
