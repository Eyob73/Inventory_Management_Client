import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../../../services/user.service';

import { ValidatorFn } from '@angular/forms';

function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) return null;
    const password = control.parent.get('password')?.value;
    const confirmPassword = control.value;
    return password === confirmPassword ? null : { mismatch: true };
  };
}

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './add-user.html',
  styleUrl: './add-user.scss',
})
export class AddUserComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  isSaving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  readonly ROLES = ['Admin', 'Manager', 'Sales', 'User'];

  addForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: [''],
    userName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
    confirmPassword: ['', [Validators.required, passwordMatchValidator()]],
    phoneNumber: [''],
    role: ['User', Validators.required],
  });

  ngOnInit() {
    this.addForm.get('password')?.valueChanges.subscribe(() => {
      this.addForm.get('confirmPassword')?.updateValueAndValidity();
    });
  }

  saveUser() {
    if (this.addForm.invalid) return;

    this.isSaving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const val = this.addForm.value;

    this.userService
      .createUser({
        email: val.email!,
        userName: val.userName || undefined,
        password: val.password!,
        firstName: val.firstName || undefined,
        lastName: val.lastName || undefined,
        role: val.role!,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.successMessage.set('User created successfully.');
          setTimeout(() => this.router.navigate(['/users']), 1200);
        },
        error: (err) => {
          this.isSaving.set(false);
          const apiErrors = err?.error?.errors;
          if (Array.isArray(apiErrors) && apiErrors.length > 0) {
            this.error.set(apiErrors.join(' '));
          } else {
            this.error.set(err?.error?.detail || 'Failed to create user.');
          }
        },
      });
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  dismissError() {
    this.error.set(null);
  }
}




