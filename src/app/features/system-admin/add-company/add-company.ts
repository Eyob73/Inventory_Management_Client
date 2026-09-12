import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SystemService } from '../../../services/system';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-company',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-company.html',
  styleUrl: './add-company.scss',
})
export class AddCompanyComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private systemService = inject(SystemService);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    email: [''],
    phone: [''],
    address: [''],
    description: [''],
    adminFirstName: ['', Validators.required],
    adminLastName: ['', Validators.required],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  loading = false;
  error: string | null = null;

  passwordMatchValidator(g: any) {
    return g.get('adminPassword').value === g.get('confirmPassword').value
      ? null : { mismatch: true };
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = null;
    this.systemService.createTenant(this.form.value).subscribe({
      next: (res) => {
        this.loading = false;
        this.snackBar.open('Company created successfully.', 'Close', { duration: 3000 });
        this.router.navigate(['/system-admin/companies']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail || err?.error?.errors?.join(', ') || 'Failed to create company';
        this.snackBar.open(this.error || 'Failed', 'Close', { duration: 5000 });
      }
    });
  }

  cancel() {
    this.router.navigate(['/system-admin/companies']);
  }
}
