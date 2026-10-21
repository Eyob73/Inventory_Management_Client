import { Component, OnInit, OnDestroy, inject, ViewChild, effect, computed, signal } from '@angular/core';
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
import { Html5Qrcode } from 'html5-qrcode';

import { PaymentVerificationStore } from '../../store/payment-verification.store';
import { AuthService } from '../../services/auth';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';
import { TableSkeleton } from '../../ui/table-skeleton/table-skeleton';
import { DataViewComponent, DataViewCardField, DataViewAction } from '../../shared/components/data-view/data-view.component';
import { ReceiptScannerService } from '../../core/services/receipt-scanner.service';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import {
  PaymentDestination,
  PaymentVerificationItem,
  EligibleSale,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  ReceiptScanMode,
  ExtractedReceiptDetails
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
    DataViewComponent,
    TranslocoDirective
  ],
  templateUrl: './payment-verification.html',
  styleUrl: './payment-verification.scss'
})
export class PaymentVerificationComponent implements OnInit, OnDestroy {
  readonly store = inject(PaymentVerificationStore);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);
  private scannerService = inject(ReceiptScannerService);
  readonly transloco = inject(TranslocoService);

  // Scanner & Upload states
  scanMode = signal<ReceiptScanMode>('manual');
  isCameraLoading = signal<boolean>(false);
  isCameraScanning = signal<boolean>(false);
  cameraError = signal<string | null>(null);
  private cameraScanner: Html5Qrcode | null = null;

  selectedFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);
  isDecodingImage = signal<boolean>(false);
  uploadError = signal<string | null>(null);

  // Extracted details review state
  scannedDetails = signal<ExtractedReceiptDetails | null>(null);

  readonly isScannedAmountMatch = computed(() => {
    const details = this.scannedDetails();
    if (!details || details.amount === undefined || details.amount === null) return true;
    const sale = this.selectedSale();
    if (!sale) return true;
    return Math.abs(details.amount - sale.outstandingBalance) < 0.01;
  });

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
    { key: 'submittedReference', label: this.transloco.translate('paymentVerification.history.columns.reference') || 'Reference', type: 'code' },
    {
      key: 'saleNumber',
      label: this.transloco.translate('paymentVerification.history.columns.saleNumber') || 'Sale #',
      type: 'text',
      valueFn: (item: PaymentVerificationItem) => (item.saleNumber ? `#${item.saleNumber}` : '—')
    },
    {
      key: 'customerName',
      label: this.transloco.translate('paymentVerification.history.columns.customer') || 'Customer',
      type: 'text',
      valueFn: (item: PaymentVerificationItem) => item.customerName || this.transloco.translate('paymentVerification.context.walkInCustomer') || 'Walk-in Customer'
    },
    {
      key: 'payer',
      label: this.transloco.translate('paymentVerification.review.payerInfo') || 'Payer',
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
      label: this.transloco.translate('paymentVerification.history.columns.provider') || 'Provider',
      type: 'text',
      valueFn: (item: PaymentVerificationItem) => item.provider || '—'
    },
    {
      key: 'paymentDestinationName',
      label: this.transloco.translate('paymentVerification.history.columns.destination') || 'Destination',
      type: 'text',
      valueFn: (item: PaymentVerificationItem) => item.paymentDestinationName || 'None'
    },
    {
      key: 'expectedAmount',
      label: this.transloco.translate('paymentVerification.history.columns.expected') || 'Expected',
      type: 'currency',
      valueFn: (item: PaymentVerificationItem) => item.expectedAmount
    },
    {
      key: 'verifiedAmount',
      label: this.transloco.translate('paymentVerification.history.columns.verified') || 'Verified',
      type: 'currency',
      valueFn: (item: PaymentVerificationItem) => item.verifiedAmount ?? 0
    },
    {
      key: 'status',
      label: this.transloco.translate('paymentVerification.history.columns.status') || 'Status',
      type: 'badge',
      badgeClassFn: (item: PaymentVerificationItem) => {
        const s = String(item.status || '').toLowerCase();
        if (s === 'verified' || s === '2') return 'status--active';
        if (s === 'failed' || s === 'rejected' || s === '8' || s === '3') return 'status--danger';
        if (
          s === 'needsmanualreview' ||
          s === 'amountmismatch' ||
          s === 'destinationmismatch' ||
          s === 'unabletoconfirmdestination' ||
          s === '4' ||
          s === '5' ||
          s === '6' ||
          s === '7'
        ) {
          return 'status--low status--low-stock';
        }
        return 'status--inactive';
      },
      valueFn: (item: PaymentVerificationItem) => this.formatStatus(item.status)
    },
    {
      key: 'destinationMatchStatus',
      label: this.transloco.translate('paymentVerification.history.columns.destMatch') || 'Dest Match',
      type: 'badge',
      badgeClassFn: (item: PaymentVerificationItem) => {
        const m = String(item.destinationMatchStatus || '').toLowerCase();
        if (m === 'matched' || m === '1') return 'status--active';
        if (m === 'mismatched' || m === '2') return 'status--danger';
        if (m === 'unabletoconfirm' || m === '3') return 'status--low status--low-stock';
        return 'status--inactive';
      },
      valueFn: (item: PaymentVerificationItem) => this.formatDestinationMatch(item.destinationMatchStatus)
    },
    {
      key: 'createdAtUtc',
      label: this.transloco.translate('paymentVerification.history.columns.date') || 'Date',
      type: 'date',
      valueFn: (item: PaymentVerificationItem) => item.createdAtUtc
    }
  ]);

  cardActions = computed<DataViewAction[]>(() => {
    const actions: DataViewAction[] = [
      { id: 'view', icon: 'visibility', label: this.transloco.translate('paymentVerification.history.viewDetailsTooltip') || 'View Details' },
      { id: 'copy', icon: 'content_copy', label: this.transloco.translate('paymentVerification.history.copyTooltip') || 'Copy Reference' },
      {
        id: 'retry',
        icon: 'replay',
        label: this.transloco.translate('paymentVerification.history.retryTooltip') || 'Retry Verification',
        visibleFn: (item: PaymentVerificationItem) => item.status === 'Failed' || item.status === 'Rejected'
      }
    ];

    if (this.isManagerOrAdmin) {
      actions.push({
        id: 'manual-review',
        icon: 'rate_review',
        label: this.transloco.translate('paymentVerification.history.manualReviewTooltip') || 'Manual Review',
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

  ngOnDestroy(): void {
    this.stopCameraScan();
    this.cleanupPreviewUrl();
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

  // --- Scan Mode & Camera Management ---

  async setScanMode(mode: ReceiptScanMode): Promise<void> {
    if (this.scanMode() === mode) return;

    if (this.scanMode() === 'camera' || this.isCameraScanning() || this.cameraScanner) {
      await this.stopCameraScan();
    }

    this.scanMode.set(mode);
    this.uploadError.set(null);
    this.cameraError.set(null);

    if (mode === 'camera') {
      setTimeout(() => this.startCameraScan(), 100);
    }
  }

  async startCameraScan(): Promise<void> {
    this.scanMode.set('camera');
    this.cameraError.set(null);
    this.isCameraLoading.set(true);
    this.isCameraScanning.set(false);

    try {
      this.cameraScanner = await this.scannerService.startCamera(
        'page-qr-reader',
        (decodedText) => this.onQrScanned(decodedText),
        (err) => {
          this.cameraError.set(err?.message || 'Error occurred during camera scanning.');
        }
      );
      this.isCameraLoading.set(false);
      this.isCameraScanning.set(true);
    } catch (err: any) {
      this.isCameraLoading.set(false);
      this.isCameraScanning.set(false);
      this.cameraError.set(err?.message || 'Unable to access camera.');
    }
  }

  async stopCameraScan(): Promise<void> {
    this.isCameraLoading.set(false);
    this.isCameraScanning.set(false);
    if (this.cameraScanner) {
      const scanner = this.cameraScanner;
      this.cameraScanner = null;
      await this.scannerService.stopCamera(scanner);
    }
  }

  // --- File Upload Handling ---

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.processUploadedFile(file);
    input.value = '';
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;
    const file = event.dataTransfer.files[0];
    this.processUploadedFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private processUploadedFile(file: File): void {
    const validation = this.scannerService.validateReceiptImage(file);
    if (!validation.valid) {
      this.uploadError.set(validation.error || 'Invalid file format.');
      return;
    }

    this.uploadError.set(null);
    this.cleanupPreviewUrl();

    this.selectedFile.set(file);
    const objectUrl = URL.createObjectURL(file);
    this.imagePreviewUrl.set(objectUrl);

    this.decodeUploadedImage(file);
  }

  async decodeUploadedImage(file: File): Promise<void> {
    this.isDecodingImage.set(true);
    this.uploadError.set(null);

    try {
      const decodedText = await this.scannerService.decodeReceiptImage(file);
      this.onQrScanned(decodedText);
    } catch (err: any) {
      this.uploadError.set(err?.message || 'Failed to decode receipt image.');
    } finally {
      this.isDecodingImage.set(false);
    }
  }

  removeSelectedFile(): void {
    this.cleanupPreviewUrl();
    this.selectedFile.set(null);
    this.uploadError.set(null);
  }

  private cleanupPreviewUrl(): void {
    const url = this.imagePreviewUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.imagePreviewUrl.set(null);
    }
  }

  // --- QR Parsing & Form Population ---

  onQrScanned(decodedText: string): void {
    const extracted = this.scannerService.parseQrData(decodedText);
    this.scannedDetails.set(extracted);

    if (this.isCameraScanning()) {
      this.stopCameraScan();
    }

    const formUpdates: any = {};

    if (extracted.transactionReference) {
      formUpdates.submittedReference = extracted.transactionReference;
    } else if (extracted.receiptUrl) {
      formUpdates.submittedReference = extracted.receiptUrl;
    }

    if (extracted.payerPhone) {
      formUpdates.payerPhone = extracted.payerPhone;
    }

    if (extracted.rawContent) {
      formUpdates.qrData = extracted.rawContent;
    }

    if (extracted.provider) {
      const currentDestId = this.verifyForm.get('paymentDestinationId')?.value;
      const destinations = this.destinations();
      if (!currentDestId || currentDestId === '') {
        const provLower = extracted.provider.toLowerCase();
        const matched = destinations.find((d) => {
          if (provLower.includes('telebirr') && (d.type === 'Telebirr' || (d as any).type === 2)) return true;
          if (provLower.includes('cbe') && (d.bankCode?.toLowerCase() === 'cbe' || d.type === 'BankAccount' || (d as any).type === 1)) return true;
          if (d.bankCode && provLower.includes(d.bankCode.toLowerCase())) return true;
          return false;
        });
        if (matched) {
          formUpdates.paymentDestinationId = matched.id;
          if (matched.bankCode) {
            formUpdates.bankCode = matched.bankCode;
          }
        }
      }
    }

    this.verifyForm.patchValue(formUpdates);
    this.verifyForm.markAsDirty();

    if (extracted.isPaymentRequestOnly) {
      this.snackBar.open(
        'Warning: Scanned QR is a payment request instruction, not a completed receipt. Please enter the transaction ID from the customer SMS.',
        'Dismiss',
        { duration: 5000, panelClass: ['snack-error'] }
      );
    } else if (extracted.transactionReference) {
      this.snackBar.open(
        `Scanned reference ${extracted.transactionReference} extracted. Please review details before verifying.`,
        'OK',
        { duration: 3500, panelClass: ['snack-success'] }
      );
    } else {
      this.snackBar.open('Receipt scanned. Please verify and complete the details before submitting.', 'OK', {
        duration: 3500
      });
    }

    this.scanMode.set('manual');
  }

  clearScannedDetails(): void {
    this.scannedDetails.set(null);
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
          this.verifyForm.get('qrData')?.reset();
          this.verifyForm.get('saleId')?.reset('');
          this.saleSearch.set('');
          this.store.setSelectedSale(null);
          this.clearScannedDetails();
          this.removeSelectedFile();
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
    if (index !== 0) {
      this.stopCameraScan();
    }
    this.store.setTabIndex(index);
    // Ensure stretched tabs container is never shifted or scrolled horizontally on mobile
    setTimeout(() => {
      try {
        const container = document.querySelector('.tabs-container .mat-mdc-tab-label-container');
        if (container && container.scrollLeft !== 0) {
          container.scrollLeft = 0;
        }
        const list = document.querySelector('.tabs-container .mat-mdc-tab-list') as HTMLElement;
        if (list && list.style.transform && list.style.transform !== 'none') {
          list.style.transform = 'none';
        }
      } catch {}
    }, 0);
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

  formatStatus(status: any): string {
    const s = String(status || '').trim().toLowerCase();
    switch (s) {
      case 'verified':
      case '2': {
        const val = this.transloco.translate('paymentVerification.statuses.verified');
        return val && !val.startsWith('paymentVerification.') ? val : 'Verified';
      }
      case 'rejected':
      case '3': {
        const val = this.transloco.translate('paymentVerification.statuses.rejected');
        return val && !val.startsWith('paymentVerification.') ? val : 'Rejected';
      }
      case 'amountmismatch':
      case '4': {
        const val = this.transloco.translate('paymentVerification.statuses.amountMismatch');
        return val && !val.startsWith('paymentVerification.') ? val : 'Amount Mismatch';
      }
      case 'destinationmismatch':
      case '5': {
        const val = this.transloco.translate('paymentVerification.statuses.destinationMismatch');
        return val && !val.startsWith('paymentVerification.') ? val : 'Destination Mismatch';
      }
      case 'unabletoconfirmdestination':
      case '6': {
        const val = this.transloco.translate('paymentVerification.statuses.unableToConfirmDestination');
        return val && !val.startsWith('paymentVerification.') ? val : 'Unable to Confirm Dest';
      }
      case 'needsmanualreview':
      case '7': {
        const val = this.transloco.translate('paymentVerification.statuses.needsManualReview');
        return val && !val.startsWith('paymentVerification.') ? val : 'Needs Manual Review';
      }
      case 'failed':
      case '8': {
        const val = this.transloco.translate('paymentVerification.statuses.failed');
        return val && !val.startsWith('paymentVerification.') ? val : 'Failed';
      }
      case 'pending':
      case '1': {
        const val = this.transloco.translate('paymentVerification.statuses.pending');
        return val && !val.startsWith('paymentVerification.') ? val : 'Pending';
      }
      default:
        return status ? String(status) : '—';
    }
  }

  formatDestinationMatch(match: any): string {
    const m = String(match || '').trim().toLowerCase();
    switch (m) {
      case 'matched':
      case '1': {
        const val = this.transloco.translate('paymentVerification.destinationMatches.matched');
        return val && !val.startsWith('paymentVerification.') ? val : 'Matched';
      }
      case 'mismatched':
      case '2': {
        const val = this.transloco.translate('paymentVerification.destinationMatches.mismatched');
        return val && !val.startsWith('paymentVerification.') ? val : 'Mismatched';
      }
      case 'unabletoconfirm':
      case '3': {
        const val = this.transloco.translate('paymentVerification.destinationMatches.unableToConfirm');
        return val && !val.startsWith('paymentVerification.') ? val : 'Unable to Confirm';
      }
      case 'notapplicable':
      case '0':
      case '4': {
        const val = this.transloco.translate('paymentVerification.destinationMatches.notApplicable');
        return val && !val.startsWith('paymentVerification.') ? val : 'Not Applicable';
      }
      default:
        return match ? String(match) : '—';
    }
  }

  getStatusClass(status: any): string {
    const s = String(status || '').trim().toLowerCase();
    switch (s) {
      case 'verified':
      case '2':
        return 'chip-verified';
      case 'amountmismatch':
      case 'destinationmismatch':
      case 'unabletoconfirmdestination':
      case 'needsmanualreview':
      case '4':
      case '5':
      case '6':
      case '7':
        return 'chip-warning';
      case 'rejected':
      case 'failed':
      case '3':
      case '8':
        return 'chip-danger';
      default:
        return 'chip-pending';
    }
  }

  getMatchClass(matchStatus: any): string {
    const m = String(matchStatus || '').trim().toLowerCase();
    switch (m) {
      case 'matched':
      case '1':
        return 'match-matched';
      case 'mismatched':
      case '2':
        return 'match-mismatched';
      case 'unabletoconfirm':
      case '3':
        return 'match-unabletoconfirm';
      default:
        return 'match-notapplicable';
    }
  }

  getOutcomeStatusClass(res: VerifyPaymentResponse | null): string {
    if (!res) return '';
    const st = String(res.statusName || res.status || '').toLowerCase();
    return `outcome-${st}`;
  }
}
