import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AuthStore } from '../../../store/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslocoDirective,
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  protected authStore = inject(AuthStore);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  form: FormGroup;
  hidePassword = true;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [true],
    });
  }

  get submitting(): boolean {
    return this.authStore.isLoading();
  }

  get authError(): string {
    return this.authStore.error() || '';
  }

  ngOnInit(): void {
    this.authStore.clearError();
  }

  ngOnDestroy(): void {
  }

  get emailControl() {
    return this.form.get('email')!;
  }

  get passwordControl() {
    return this.form.get('password')!;
  }

  emailErrorText(): string {
    if (this.emailControl.hasError('required')) return this.transloco.translate('loginFull.errEmailReq');
    if (this.emailControl.hasError('email')) return this.transloco.translate('loginFull.errEmailValid');
    return '';
  }

  passwordErrorText(): string {
    if (this.passwordControl.hasError('required')) return this.transloco.translate('loginFull.errPassReq');
    if (this.passwordControl.hasError('minlength')) return this.transloco.translate('loginFull.errPassMin');
    return '';
  }

  submit(): void {
    this.authStore.clearError();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const credentials = this.form.value;
    this.authStore.login(credentials);
  }
}