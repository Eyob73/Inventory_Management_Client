import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserService, SystemUser } from '../../../services/user.service';

@Component({
  selector: 'app-edit-user',
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
    MatSlideToggleModule,
  ],
  templateUrl: './edit-user.html',
  styleUrl: './edit-user.scss',
})
export class EditUserComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  userId = signal<string | null>(null);
  user = signal<SystemUser | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  readonly ROLES = ['Admin', 'Manager', 'Sales', 'User'];

  editForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    role: ['User', Validators.required],
    isActive: [true],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No user ID provided.');
      this.isLoading.set(false);
      return;
    }
    this.userId.set(id);
    this.loadUser(id);
  }

  loadUser(id: string) {
    this.isLoading.set(true);
    this.error.set(null);
    this.userService.getUserById(id).subscribe({
      next: (userData) => {
        this.user.set(userData);
        this.editForm.patchValue({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email,
          phoneNumber: userData.phoneNumber || '',
          role: userData.roles?.[0] || 'User',
          isActive: userData.isActive ?? true,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to load user details.');
        this.isLoading.set(false);
      },
    });
  }

  saveUser() {
    if (this.editForm.invalid || !this.userId()) return;

    this.isSaving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const val = this.editForm.value;
    const currentIsActive = this.user()?.isActive;
    const newIsActive = val.isActive ?? true;

    this.userService
      .updateUser(this.userId()!, {
        email: val.email!,
        firstName: val.firstName || '',
        lastName: val.lastName || '',
        phoneNumber: val.phoneNumber || undefined,
        role: val.role!,
      })
      .subscribe({
        next: () => {
          if (currentIsActive !== newIsActive) {
            this.userService.toggleActive(this.userId()!).subscribe({
              next: () => {
                this.isSaving.set(false);
                this.successMessage.set('User updated successfully.');
                setTimeout(() => this.router.navigate(['/users']), 1200);
              },
              error: (err) => {
                this.isSaving.set(false);
                this.error.set(err?.error?.detail || 'User info saved, but status update failed.');
              },
            });
          } else {
            this.isSaving.set(false);
            this.successMessage.set('User updated successfully.');
            setTimeout(() => this.router.navigate(['/users']), 1200);
          }
        },
        error: (err) => {
          this.isSaving.set(false);
          const apiErrors = err?.error?.errors;
          if (Array.isArray(apiErrors) && apiErrors.length > 0) {
            this.error.set(apiErrors.join(' '));
          } else {
            this.error.set(err?.error?.detail || 'Failed to update user.');
          }
        },
      });
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  getUserInitials(): string {
    const u = this.user();
    if (!u) return 'US';
    if (u.firstName) {
      const f = u.firstName.charAt(0);
      const l = u.lastName ? u.lastName.charAt(0) : '';
      return (f + l).toUpperCase();
    }
    return u.email.slice(0, 2).toUpperCase();
  }

  dismissError() {
    this.error.set(null);
  }
}
