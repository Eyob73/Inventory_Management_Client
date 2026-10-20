import { Component, OnInit, inject, ViewChild, effect, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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
import { DataViewComponent, DataViewCardField, DataViewAction } from '../../shared/components/data-view/data-view.component';

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
    MatAutocompleteModule,
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
    TableSkeleton,
    DataViewComponent
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

  // Search/Filter for optional Sale ID autocomplete
  readonly saleSearch = signal<string>('');
  readonly filteredSales = computed(() => {
    const all = this.eligibleSales();
    const query = this.saleSearch().toLowerCase().trim();
    if (!query) {
      return all;
    }
    return all.filter(
      (s) =>
        s.saleNumber.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        (s.customerName && s.customerName.toLowerCase().includes(query))
    );
  });

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

  cardFields = computed<DataViewCardField[]>(() => [
    { key: 'submittedReference', label: 'Reference', type: 'code' },
    {
      key: 'saleNumber',
      label: 'Sale #',
      type: 'text',
      valueFn: (item: PaymentVerificationItem) => (item.saleNumber ? `#${item.saleNumber}` : '—')
    },
    {
      key: 'customerName',
      label: 'Customer',
      type: 'text',
      valueFn: (item: PaymentVerificationItem) => item.customerName || 'Walk-in Customer'
    },
    {
      key: 'payer',
      label: 'Payer',
      type: 'text',
      valueFn: (item: PaymentVerificationItem) => {
        if (item.payerName && item.payerAccount) {
          return `${item.payerName} (${item.payerAccount})`;
        }
        return item.payerName || item.payerAccount || '—';
      }
    },
    {
      key: 'provider',
      label: 'Provider',
      type: 'text',
      valueFn: (item: PaymentVerificationItem) => item.provider || '—'
    },
    {
      key: 'paymentDestinationName',
      label: 'Destination',
      type: 'text',
      valueFn: (item: PaymentVerificationItem) => item.paymentDestinationName || 'None'
    },
    {
      key: 'expectedAmount',
      label: 'Expected',
      type: 'currency',
      valueFn: (item: PaymentVerificationItem) => item.expectedAmount
    },
    {
      key: 'verifiedAmount',
      label: 'Verified',
      type: 'currency',
      valueFn: (item: PaymentVerificationItem) => item.verifiedAmount ?? 0
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeClassFn: (item: PaymentVerificationItem) => {
        const s = String(item.status);
        if (s === 'Verified') return 'status--active';
        if (s === 'Failed' || s === 'Rejected') return 'status--danger';
        if (
          s === 'NeedsManualReview' ||
          s === 'AmountMismatch' ||
          s === 'DestinationMismatch' ||
          s === 'UnableToConfirmDestination'
        ) {
          return 'status--low status--low-stock';
        }
        return 'status--inactive';
      },
      valueFn: (item: PaymentVerificationItem) => item.status
    },
    {
      key: 'destinationMatchStatus',
      label: 'Dest Match',
      type: 'badge',
      badgeClassFn: (item: PaymentVerificationItem) => {
        const m = String(item.destinationMatchStatus);
        if (m === 'Matched') return 'status--active';
        if (m === 'Mismatched') return 'status--danger';
        if (m === 'UnableToConfirm') return 'status--low status--low-stock';
        return 'status--inactive';
      },
      valueFn: (item: PaymentVerificationItem) => item.destinationMatchStatus || '—'
    },
    {
      key: 'createdAtUtc',
      label: 'Date',
      type: 'date',
      valueFn: (item: PaymentVerificationItem) => item.createdAtUtc
    }
  ]);

  cardActions = computed<DataViewAction[]>(() => {
    const actions: DataViewAction[] = [
      { id: 'view', icon: 'visibility', label: 'View Details' },
      { id: 'copy', icon: 'content_copy', label: 'Copy Reference' },
      {
        id: 'retry',
        icon: 'replay',
        label: 'Retry Verification',
        visibleFn: (item: PaymentVerificationItem) => item.status === 'Failed' || item.status === 'Rejected'
      }
    ];

    if (this.isManagerOrAdmin) {
      actions.push({
        id: 'manual-review',
        icon: 'rate_review',
        label: 'Manual Review',
        color: 'warn',
        visibleFn: (item: PaymentVerificationItem) =>
          item.status === 'NeedsManualReview' ||
          item.status === 'UnableToConfirmDestination' ||
          item.status === 'AmountMismatch' ||
          item.status === 'DestinationMismatch'
      });
    }

    return actions;
  });

  onCardAction(event: { actionId: string; item: PaymentVerificationItem }): void {
    if (event.actionId === 'view') {
      this.viewVerificationDetails(event.item);
    } else if (event.actionId === 'copy') {
      this.copyToClipboard(event.item.submittedReference);
    } else if (event.actionId === 'retry') {
      this.onRetryVerification(event.item);
    } else if (event.actionId === 'manual-review') {
      this.openManualReviewFor(event.item);
    }
  }

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

    // Auto-sync selected sale if eligible sales load after saleId was already set
    effect(() => {
      const sales = this.store.eligibleSales();
      const currentSaleId = this.verifyForm?.get('saleId')?.value;
      if (currentSaleId && !this.store.selectedSale()) {
        const trimmed = String(currentSaleId).trim();
        const found = sales.find((s) => s.id === trimmed || s.saleNumber.toLowerCase() === trimmed.toLowerCase());
        if (found) {
          this.store.setSelectedSale(found);
        }
      }
    });
  }

  ngOnInit(): void {
    this.initVerifyForm();
    this.loadAllData();
  }

  private initVerifyForm(): void {
    this.verifyForm = this.fb.group({
      saleId: [''],
      paymentDestinationId: ['', [Validators.required]],
      bankCode: [''],
      submittedReference: ['', [Validators.required, Validators.minLength(4)]],
      payerPhone: [''],
      qrData: ['']
    });

    // When sale input changes, search/filter and auto-populate selected sale
    this.verifyForm.get('saleId')?.valueChanges.subscribe((saleId: string | null) => {
      const trimmed = saleId ? String(saleId).trim() : '';
      this.saleSearch.set(trimmed);

      if (!trimmed) {
        this.store.setSelectedSale(null);
        return;
      }

      const found =
        this.store
          .eligibleSales()
          .find((s) => s.id === trimmed || s.saleNumber.toLowerCase() === trimmed.toLowerCase()) || null;
      this.store.setSelectedSale(found);

      // If not found in loaded sales and input is at least 3 chars, query backend
      if (!found && trimmed.length >= 3) {
        this.loadEligibleSales(trimmed);
      }
    });

    // When destination selection changes, auto-fill bankCode if applicable
    this.verifyForm.get('paymentDestinationId')?.valueChanges.subscribe((destId: string) => {
      const dest = this.store.destinations().find((d) => d.id === destId);
      if (dest?.bankCode) {
        this.verifyForm.get('bankCode')?.setValue(dest.bankCode);
      }
    });
  }

  clearSaleId(): void {
    this.verifyForm.get('saleId')?.setValue('');
    this.saleSearch.set('');
    this.store.setSelectedSale(null);
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
    const saleIdVal = formVal.saleId ? String(formVal.saleId).trim() : undefined;
    const selected = this.store.selectedSale();
    const resolvedSaleId = selected?.id || saleIdVal || undefined;

    const request: VerifyPaymentRequest = {
      saleId: resolvedSaleId,
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
          const target = res.saleNumber ? ` for Sale #${res.saleNumber}` : '';
          this.snackBar.open(`Payment verified successfully${target}!`, 'Close', {
            duration: 4000,
            panelClass: 'snack-success'
          });
          this.verifyForm.get('submittedReference')?.reset();
          this.verifyForm.get('payerPhone')?.reset();
          this.verifyForm.get('saleId')?.reset('');
          this.saleSearch.set('');
          this.store.setSelectedSale(null);
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
