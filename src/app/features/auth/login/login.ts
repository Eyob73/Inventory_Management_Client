import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** One reference city per rough UTC band, shown on the meridian rail. */
interface MeridianCity {
  city: string;
  utcOffset: number; // hours from UTC
}

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
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  form: FormGroup;
  hidePassword = true;
  submitting = false;
  authError = '';

  now = new Date();
  private clockHandle?: ReturnType<typeof setInterval>;

  readonly cities: MeridianCity[] = [
    { city: 'New York', utcOffset: -4 },
    { city: 'London', utcOffset: 1 },
    { city: 'Zurich', utcOffset: 2 },
    { city: 'Singapore', utcOffset: 8 },
    { city: 'Tokyo', utcOffset: 9 },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [true],
    });
  }

  ngOnInit(): void {
    this.clockHandle = setInterval(() => (this.now = new Date()), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockHandle) clearInterval(this.clockHandle);
  }

  /** Formats the current time for a given UTC offset as HH:MM. */
  timeAt(offset: number): string {
    const utcMs = this.now.getTime() + this.now.getTimezoneOffset() * 60000;
    const local = new Date(utcMs + offset * 3600000);
    const hh = local.getHours().toString().padStart(2, '0');
    const mm = local.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  get emailControl() {
    return this.form.get('email')!;
  }

  get passwordControl() {
    return this.form.get('password')!;
  }

  emailErrorText(): string {
    if (this.emailControl.hasError('required')) return 'Enter your work email';
    if (this.emailControl.hasError('email')) return "That email doesn't look right";
    return '';
  }

  passwordErrorText(): string {
    if (this.passwordControl.hasError('required')) return 'Enter your password';
    if (this.passwordControl.hasError('minlength')) return 'Password must be at least 8 characters';
    return '';
  }

  submit(): void {
    this.authError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    // Replace with a real auth call, e.g. this.auth.login(...)
    setTimeout(() => {
      this.submitting = false;
      const { email, password } = this.form.value;
      if (password.length < 8) {
        this.authError = 'We could not sign you in with those details.';
        return;
      }
      console.log('Signed in', email);
    }, 1100);
  }
}