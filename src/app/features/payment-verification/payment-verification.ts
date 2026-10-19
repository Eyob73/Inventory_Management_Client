import { Component, OnInit, inject, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';

import { PaymentVerificationStore } from '../../store/payment-verification.store';
import { AuthService } from '../../services/auth';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { TableSkeleton } from '../../ui/table-skeleton/table-skeleton';

import {
  PaymentDestination,
  PaymentVerificationItem,
  EligibleSale,
  VerifyPaymentRequest,
  VerifyPaymentResponse
} from '../../models/payment-verification.model';

import { PaymentDestinationDialogComponent } from './components/payment-destination-dialog/payment-destination-dialog';
import { VerificationResultDialogComponent } from './components/verification-result-dialog/verification-result-dialog';
import { ManualReviewDialogComponent } from './components/manual-review-dialog/manual-review-dialog';
import { VerificationDetailsDialogComponent } from './components/verification-details-dialog/verification-details-dialog';

@Component({
  selector: 'app-payment-verification',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatMenuModule,
    TableSkeleton
  ],
  templateUrl: './payment-verification.html',
  styleUrl: './payment-verification.scss'
})
export class PaymentVerificationComponent implements OnInit {
  readonly store = inject(PaymentVerificationStore);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);

  // Store signals exposed for template binding
  readonly selectedTabIndex = this.store.selectedTabIndex;
  readonly summary = this.store.summary;
  readonly destinations = this.store.destinations;
  readonly isLoadingDestinations = this.store.isLoadingDestinations;
  readonly supportedBanks = this.store.supportedBanks;
  readonly eligibleSales = this.store.eligibleSales;
  readonly isLoadingSales = this.store.isLoadingSales;
  readonly selectedSale = this.store.selectedSale;
  readonly isVerifying = this.store.isVerifying;
  readonly verificationResult = this.store.verificationResult;
  readonly verifyErrorMessage = this.store.verifyErrorMessage;
  readonly verifications = this.store.verifications;
  readonly totalHistoryCount = this.store.totalHistoryCount;
  readonly isLoadingHistory = this.store.isLoadingHistory;
  readonly searchTerm = this.store.searchTerm;
  readonly selectedProvider = this.store.selectedProvider;
  readonly selectedStatus = this.store.selectedStatus;
  readonly startDate = this.store.startDate;
  readonly endDate = this.store.endDate;
  readonly pageIndex = this.store.pageIndex;
  readonly pageSize = this.store.pageSize;

  // Verification Form
  verifyForm!: FormGroup;
  historyDataSource = new MatTableDataSource<PaymentVerificationItem>([]);

  displayedColumns: string[] = [
    'submittedReference',
    'saleNumber',
    'customerName',
    'provider',
    'paymentDestinationName',
    'expectedAmount',
    'verifiedAmount',
    'status',
    'destinationMatchStatus',
    'createdAtUtc',
    'actions'
  ];

  @ViewChild(MatSort) set sort(sort: MatSort | undefined) {
    if (sort) {
      this.historyDataSource.sort = sort;
    }
  }

  get isManagerOrAdmin(): boolean {
    return this.authService.hasRole('Admin') || this.authService.hasRole('Manager');
  }

  constructor() {
    effect(() => {
      this.historyDataSource.data = this.store.verifications();
    });

    // Auto-select default destination in verification form when loaded
    effect(() => {
      const defaultDest = this.store.defaultDestination();
      if (defaultDest && this.verifyForm && !this.verifyForm.get('paymentDestinationId')?.value) {
        this.verifyForm.get('paymentDestinationId')?.setValue(defaultDest.id);
      }
    });
  }

  ngOnInit(): void {
    this.initVerifyForm();
    this.loadAllData();
  }

  private initVerifyForm(): void {
    this.verifyForm = this.fb.group({
      saleId: ['', [Validators.required]],
      paymentDestinationId: ['', [Validators.required]],
      bankCode: [''],
      submittedReference: ['', [Validators.required, Validators.minLength(4)]],
      payerPhone: [''],
      qrData: ['']
    });

    // When sale selection changes
    this.verifyForm.get('saleId')?.valueChanges.subscribe((saleId: string) => {
      const found = this.store.eligibleSales().find((s) => s.id === saleId) || null;
      this.store.setSelectedSale(found);
    });

    // When destination selection changes, auto-fill bankCode if applicable
    this.verifyForm.get('paymentDestinationId')?.valueChanges.subscribe((destId: string) => {
      const dest = this.store.destinations().find((d) => d.id === destId);
      if (dest?.bankCode) {
        this.verifyForm.get('bankCode')?.setValue(dest.bankCode);
      }
    });
  }

  loadAllData(): void {
    this.store.loadAllData();
  }

  loadSummary(): void {
    this.store.loadSummary();
  }

  loadDestinations(): void {
    this.store.loadDestinations();
  }

  loadSupportedBanks(): void {
    this.store.loadSupportedBanks();
  }

  loadEligibleSales(search?: string): void {
    this.store.loadEligibleSales(search);
  }

  loadHistory(): void {
    this.store.loadHistory();
  }

  // ── Verification Actions ──────────────────────────────────────────

  onVerifySubmit(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    const formVal = this.verifyForm.value;
    const request: VerifyPaymentRequest = {
      saleId: formVal.saleId,
      paymentDestinationId: formVal.paymentDestinationId,
      submittedReference: formVal.submittedReference.trim(),
      bankCode: formVal.bankCode || undefined,
      payerPhone: formVal.payerPhone ? formVal.payerPhone.trim() : undefined,
      qrData: formVal.qrData ? formVal.qrData.trim() : undefined
    };

    this.store.verifyPayment({
      request,
      onSuccess: (res) => {
        this.openResultDialog(res);
        if (res.status === 'Verified') {
          this.snackBar.open(`Payment verified for Sale #${res.saleNumber}!`, 'Close', {
            duration: 4000,
            panelClass: 'snack-success'
          });
          this.verifyForm.get('submittedReference')?.reset();
          this.verifyForm.get('payerPhone')?.reset();
        } else {
          this.snackBar.open(`Verification completed with status: ${res.status}`, 'Close', {
            duration: 5000
          });
        }
      },
      onError: (msg) => {
        this.snackBar.open(msg, 'Close', { duration: 5000, panelClass: 'snack-error' });
      }
    });
  }

  openResultDialog(result: VerifyPaymentResponse): void {
    const dialogRef = this.dialog.open(VerificationResultDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'payment-verification-dialog-panel',
      autoFocus: false,
      data: { result }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.reviewCompleted) {
        this.store.loadAllData();
      }
    });
  }

  // ── Payment Destination Actions ───────────────────────────────────

  openAddDestinationDialog(): void {
    const dialogRef = this.dialog.open(PaymentDestinationDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'payment-verification-dialog-panel',
      autoFocus: false,
      data: {}
    });

    dialogRef.afterClosed().subscribe((created) => {
      if (created) {
        this.snackBar.open(`Destination "${created.name}" created successfully.`, 'Close', { duration: 3000 });
        this.store.loadDestinations();
        this.store.loadSummary();
      }
    });
  }

  openEditDestinationDialog(dest: PaymentDestination): void {
    const dialogRef = this.dialog.open(PaymentDestinationDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'payment-verification-dialog-panel',
      autoFocus: false,
      data: { destination: dest }
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.snackBar.open(`Destination "${updated.name}" updated successfully.`, 'Close', { duration: 3000 });
        this.store.loadDestinations();
        this.store.loadSummary();
      }
    });
  }

  onSetDefaultDestination(dest: PaymentDestination): void {
    this.store.setDefaultDestination({
      id: dest.id,
      onSuccess: () => {
        this.snackBar.open(`"${dest.name}" set as default payment destination.`, 'Close', { duration: 3000 });
      },
      onError: (msg) => {
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  onToggleDestinationStatus(dest: PaymentDestination, event: any): void {
    const newStatus = event.checked;
    this.store.toggleDestinationStatus({
      id: dest.id,
      isActive: newStatus,
      onSuccess: () => {
        this.snackBar.open(`Destination "${dest.name}" is now ${newStatus ? 'active' : 'inactive'}.`, 'Close', { duration: 2500 });
      },
      onError: (msg) => {
        event.source.checked = !newStatus;
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  onDeleteDestination(dest: PaymentDestination): void {
    this.confirmDialog.confirmDelete('Payment Destination', dest.name).subscribe((confirmed) => {
      if (confirmed) {
        this.store.deleteDestination({
          id: dest.id,
          onSuccess: () => {
            this.snackBar.open(`Destination "${dest.name}" deleted.`, 'Close', { duration: 3000 });
          },
          onError: (msg) => {
            this.snackBar.open(msg, 'Close', { duration: 4000 });
          }
        });
      }
    });
  }

  // ── Tab & Filter Actions ──────────────────────────────────────────

  onTabChange(index: number): void {
    this.store.setTabIndex(index);
  }

  onSearchChange(text: string): void {
    this.store.setSearchTerm(text);
    this.store.loadHistory();
  }

  onProviderChange(provider: string): void {
    this.store.setSelectedProvider(provider);
    this.store.loadHistory();
  }

  onStatusChange(status: string): void {
    this.store.setSelectedStatus(status);
    this.store.loadHistory();
  }

  onFilterChange(): void {
    this.store.loadHistory();
  }

  resetFilters(): void {
    this.store.resetFilters();
    this.store.loadHistory();
  }

  onPageChange(event: PageEvent): void {
    this.store.setPagination(event.pageIndex + 1, event.pageSize);
    this.store.loadHistory();
  }

  viewVerificationDetails(item: PaymentVerificationItem): void {
    const dialogRef = this.dialog.open(VerificationDetailsDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'payment-verification-dialog-panel',
      autoFocus: false,
      data: { verification: item }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.reviewCompleted) {
        this.store.loadAllData();
      }
    });
  }

  onRetryVerification(item: PaymentVerificationItem): void {
    this.store.retryVerification({
      id: item.id,
      onSuccess: (res) => {
        this.openResultDialog(res);
      },
      onError: (msg) => {
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  openManualReviewFor(item: PaymentVerificationItem): void {
    const dialogRef = this.dialog.open(ManualReviewDialogComponent, {
      width: '540px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'payment-verification-dialog-panel',
      autoFocus: false,
      data: { verification: item }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.snackBar.open('Manual review submitted.', 'Close', { duration: 3000 });
        this.store.loadAllData();
      }
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    this.snackBar.open('Reference copied to clipboard', '', { duration: 1500 });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Verified': return 'chip-verified';
      case 'AmountMismatch':
      case 'DestinationMismatch':
      case 'UnableToConfirmDestination':
      case 'NeedsManualReview':
        return 'chip-warning';
      case 'Rejected':
      case 'Failed':
        return 'chip-danger';
      default:
        return 'chip-pending';
    }
  }

  getMatchClass(matchStatus: string): string {
    switch (matchStatus) {
      case 'Matched': return 'match-matched';
      case 'Mismatched': return 'match-mismatched';
      case 'UnableToConfirm': return 'match-unabletoconfirm';
      default: return 'match-notapplicable';
    }
  }

  getOutcomeStatusClass(res: VerifyPaymentResponse | null): string {
    if (!res) return '';
    const st = String(res.statusName || res.status || '').toLowerCase();
    return `outcome-${st}`;
  }
}
