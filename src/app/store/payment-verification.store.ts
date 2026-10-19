import { computed, inject } from '@angular/core';
import {
  signalStore,
  withComputed,
  withMethods,
  patchState,
  withState
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, EMPTY, switchMap, exhaustMap, forkJoin, of } from 'rxjs';
import { PaymentVerificationService } from '../core/services/payment-verification.service';
import { PaymentDestinationService } from '../core/services/payment-destination.service';
import {
  PaymentDestination,
  PaymentVerificationItem,
  PaymentVerificationSummary,
  EligibleSale,
  SupportedBank,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  PaymentVerificationFilter,
  ManualReviewRequest,
  CreatePaymentDestinationRequest,
  UpdatePaymentDestinationRequest
} from '../models/payment-verification.model';

export interface PaymentVerificationState {
  // Navigation / Tabs
  selectedTabIndex: number;

  // Summary Metrics
  summary: PaymentVerificationSummary;
  isLoadingSummary: boolean;

  // Destinations
  destinations: PaymentDestination[];
  isLoadingDestinations: boolean;
  supportedBanks: SupportedBank[];
  isLoadingBanks: boolean;

  // Eligible Sales
  eligibleSales: EligibleSale[];
  isLoadingSales: boolean;
  selectedSale: EligibleSale | null;

  // Active Verification Action
  isVerifying: boolean;
  verificationResult: VerifyPaymentResponse | null;
  verifyErrorMessage: string | null;

  // Verification History & Pagination
  verifications: PaymentVerificationItem[];
  totalHistoryCount: number;
  isLoadingHistory: boolean;

  // Filters
  searchTerm: string;
  selectedProvider: string;
  selectedStatus: string;
  startDate: string;
  endDate: string;
  pageIndex: number;
  pageSize: number;

  // Error
  error: string | null;
}

function errMsg(err: any, fallback: string): string {
  return typeof err?.error === 'string'
    ? err.error
    : err?.error?.detail || err?.error?.message || err?.message || fallback;
}

export const PaymentVerificationStore = signalStore(
  { providedIn: 'root' },
  withState<PaymentVerificationState>({
    selectedTabIndex: 0,
    summary: {
      totalDestinations: 0,
      activeDestinations: 0,
      verifiedTransactions: 0,
      needsReviewTransactions: 0
    },
    isLoadingSummary: false,
    destinations: [],
    isLoadingDestinations: false,
    supportedBanks: [],
    isLoadingBanks: false,
    eligibleSales: [],
    isLoadingSales: false,
    selectedSale: null,
    isVerifying: false,
    verificationResult: null,
    verifyErrorMessage: null,
    verifications: [],
    totalHistoryCount: 0,
    isLoadingHistory: false,
    searchTerm: '',
    selectedProvider: '',
    selectedStatus: '',
    startDate: '',
    endDate: '',
    pageIndex: 1,
    pageSize: 10,
    error: null
  }),
  withComputed((store) => ({
    activeDestinations: computed(() =>
      store.destinations().filter((d) => d.isActive)
    ),
    defaultDestination: computed(() =>
      store.destinations().find((d) => d.isDefault && d.isActive)
    ),
    hasNeedsReview: computed(() =>
      store.summary().needsReviewTransactions > 0
    )
  })),
  withMethods(
    (
      store,
      verificationApi = inject(PaymentVerificationService),
      destinationApi = inject(PaymentDestinationService)
    ) => {
      const loadHistoryQuery = (customFilter?: Partial<PaymentVerificationFilter>) => {
        patchState(store, { isLoadingHistory: true, error: null });
        const filter: PaymentVerificationFilter = {
          searchTerm: customFilter?.searchTerm ?? (store.searchTerm().trim() || undefined),
          provider: customFilter?.provider ?? (store.selectedProvider() || undefined),
          status: customFilter?.status ?? (store.selectedStatus() ? (store.selectedStatus() as any) : undefined),
          startDate: customFilter?.startDate ?? (store.startDate() || undefined),
          endDate: customFilter?.endDate ?? (store.endDate() || undefined),
          pageIndex: customFilter?.pageIndex ?? store.pageIndex(),
          pageSize: customFilter?.pageSize ?? store.pageSize()
        };

        return verificationApi.getVerifications(filter).pipe(
          tap((res) => {
            patchState(store, {
              verifications: res.items || [],
              totalHistoryCount: res.totalCount || 0,
              isLoadingHistory: false
            });
          }),
          catchError((err) => {
            patchState(store, {
              isLoadingHistory: false,
              error: errMsg(err, 'Failed to load verification history')
            });
            return EMPTY;
          })
        );
      };

      return {
        // State mutators
        setTabIndex(selectedTabIndex: number) {
          patchState(store, { selectedTabIndex });
        },
        setSelectedSale(selectedSale: EligibleSale | null) {
          patchState(store, {
            selectedSale,
            verificationResult: null,
            verifyErrorMessage: null
          });
        },
        setSearchTerm(searchTerm: string) {
          patchState(store, { searchTerm, pageIndex: 1 });
        },
        setSelectedProvider(selectedProvider: string) {
          patchState(store, { selectedProvider, pageIndex: 1 });
        },
        setSelectedStatus(selectedStatus: string) {
          patchState(store, { selectedStatus, pageIndex: 1 });
        },
        setDateRange(startDate: string, endDate: string) {
          patchState(store, { startDate, endDate, pageIndex: 1 });
        },
        setPagination(pageIndex: number, pageSize: number) {
          patchState(store, { pageIndex, pageSize });
        },
        resetFilters() {
          patchState(store, {
            searchTerm: '',
            selectedProvider: '',
            selectedStatus: '',
            startDate: '',
            endDate: '',
            pageIndex: 1
          });
        },
        clearVerificationResult() {
          patchState(store, { verificationResult: null, verifyErrorMessage: null });
        },
        clearError() {
          patchState(store, { error: null });
        },

        // Data fetching rxMethods
        loadSummary: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { isLoadingSummary: true })),
            switchMap(() =>
              verificationApi.getSummary().pipe(
                tap((summary) => patchState(store, { summary, isLoadingSummary: false })),
                catchError((err) => {
                  patchState(store, { isLoadingSummary: false });
                  return EMPTY;
                })
              )
            )
          )
        ),

        loadDestinations: rxMethod<boolean | void>(
          pipe(
            tap(() => patchState(store, { isLoadingDestinations: true })),
            switchMap((activeOnly) =>
              destinationApi.getAll(typeof activeOnly === 'boolean' ? activeOnly : undefined).pipe(
                tap((destinations) =>
                  patchState(store, { destinations: destinations || [], isLoadingDestinations: false })
                ),
                catchError((err) => {
                  patchState(store, {
                    isLoadingDestinations: false,
                    error: errMsg(err, 'Failed to load payment destinations')
                  });
                  return EMPTY;
                })
              )
            )
          )
        ),

        loadSupportedBanks: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { isLoadingBanks: true })),
            switchMap(() =>
              destinationApi.getSupportedBanks().pipe(
                tap((supportedBanks) =>
                  patchState(store, { supportedBanks: supportedBanks || [], isLoadingBanks: false })
                ),
                catchError(() => {
                  patchState(store, { isLoadingBanks: false });
                  return EMPTY;
                })
              )
            )
          )
        ),

        loadEligibleSales: rxMethod<string | void>(
          pipe(
            tap(() => patchState(store, { isLoadingSales: true })),
            switchMap((search) =>
              verificationApi.getEligibleSales(search || undefined).pipe(
                tap((eligibleSales) =>
                  patchState(store, { eligibleSales: eligibleSales || [], isLoadingSales: false })
                ),
                catchError((err) => {
                  patchState(store, {
                    isLoadingSales: false,
                    error: errMsg(err, 'Failed to load eligible sales')
                  });
                  return EMPTY;
                })
              )
            )
          )
        ),

        loadHistory: rxMethod<Partial<PaymentVerificationFilter> | void>(
          pipe(
            switchMap((customFilter) => loadHistoryQuery(customFilter || undefined))
          )
        ),

        loadAllData: rxMethod<void>(
          pipe(
            switchMap(() => {
              patchState(store, {
                isLoadingSummary: true,
                isLoadingDestinations: true,
                isLoadingSales: true,
                isLoadingHistory: true,
                isLoadingBanks: true
              });

              return forkJoin({
                summary: verificationApi.getSummary().pipe(catchError(() => of(store.summary()))),
                destinations: destinationApi.getAll().pipe(catchError(() => of([]))),
                sales: verificationApi.getEligibleSales().pipe(catchError(() => of([]))),
                banks: destinationApi.getSupportedBanks().pipe(catchError(() => of([]))),
                history: verificationApi.getVerifications({
                  searchTerm: store.searchTerm().trim() || undefined,
                  provider: store.selectedProvider() || undefined,
                  status: store.selectedStatus() ? (store.selectedStatus() as any) : undefined,
                  startDate: store.startDate() || undefined,
                  endDate: store.endDate() || undefined,
                  pageIndex: store.pageIndex(),
                  pageSize: store.pageSize()
                }).pipe(catchError(() => of({ items: [], totalCount: 0, page: 1, pageSize: 10 })))
              }).pipe(
                tap(({ summary, destinations, sales, banks, history }) => {
                  patchState(store, {
                    summary,
                    isLoadingSummary: false,
                    destinations: destinations || [],
                    isLoadingDestinations: false,
                    eligibleSales: sales || [],
                    isLoadingSales: false,
                    supportedBanks: banks || [],
                    isLoadingBanks: false,
                    verifications: history.items || [],
                    totalHistoryCount: history.totalCount || 0,
                    isLoadingHistory: false
                  });
                }),
                catchError((err) => {
                  patchState(store, {
                    isLoadingSummary: false,
                    isLoadingDestinations: false,
                    isLoadingSales: false,
                    isLoadingHistory: false,
                    isLoadingBanks: false,
                    error: errMsg(err, 'Failed to refresh payment verification data')
                  });
                  return EMPTY;
                })
              );
            })
          )
        ),

        // Verification Actions
        verifyPayment: rxMethod<{
          request: VerifyPaymentRequest;
          onSuccess?: (res: VerifyPaymentResponse) => void;
          onError?: (msg: string) => void;
        }>(
          pipe(
            tap(() => patchState(store, { isVerifying: true, verifyErrorMessage: null })),
            exhaustMap(({ request, onSuccess, onError }) =>
              verificationApi.verifyPayment(request).pipe(
                tap((res) => {
                  patchState(store, {
                    isVerifying: false,
                    verificationResult: res
                  });
                  onSuccess?.(res);
                }),
                switchMap(() =>
                  forkJoin({
                    summary: verificationApi.getSummary().pipe(catchError(() => of(store.summary()))),
                    sales: verificationApi.getEligibleSales().pipe(catchError(() => of([]))),
                    history: verificationApi.getVerifications({
                      pageIndex: store.pageIndex(),
                      pageSize: store.pageSize()
                    }).pipe(catchError(() => of({ items: store.verifications(), totalCount: store.totalHistoryCount() })))
                  }).pipe(
                    tap(({ summary, sales, history }) => {
                      patchState(store, {
                        summary,
                        eligibleSales: sales,
                        verifications: history.items || [],
                        totalHistoryCount: history.totalCount || 0
                      });
                    })
                  )
                ),
                catchError((err) => {
                  const msg = errMsg(err, 'Payment verification failed.');
                  patchState(store, {
                    isVerifying: false,
                    verifyErrorMessage: msg,
                    error: msg
                  });
                  onError?.(msg);
                  return EMPTY;
                })
              )
            )
          )
        ),

        retryVerification: rxMethod<{
          id: string;
          onSuccess?: (res: VerifyPaymentResponse) => void;
          onError?: (msg: string) => void;
        }>(
          pipe(
            exhaustMap(({ id, onSuccess, onError }) =>
              verificationApi.retryVerification(id).pipe(
                tap((res) => onSuccess?.(res)),
                switchMap(() =>
                  forkJoin({
                    summary: verificationApi.getSummary().pipe(catchError(() => of(store.summary()))),
                    sales: verificationApi.getEligibleSales().pipe(catchError(() => of([]))),
                    history: verificationApi.getVerifications({
                      pageIndex: store.pageIndex(),
                      pageSize: store.pageSize()
                    }).pipe(catchError(() => of({ items: store.verifications(), totalCount: store.totalHistoryCount() })))
                  }).pipe(
                    tap(({ summary, sales, history }) => {
                      patchState(store, {
                        summary,
                        eligibleSales: sales,
                        verifications: history.items || [],
                        totalHistoryCount: history.totalCount || 0
                      });
                    })
                  )
                ),
                catchError((err) => {
                  const msg = errMsg(err, 'Retry failed.');
                  onError?.(msg);
                  return EMPTY;
                })
              )
            )
          )
        ),

        // Destinations management methods
        createDestination: rxMethod<{
          dto: CreatePaymentDestinationRequest;
          onSuccess?: (dest: PaymentDestination) => void;
          onError?: (msg: string) => void;
        }>(
          pipe(
            exhaustMap(({ dto, onSuccess, onError }) =>
              destinationApi.create(dto).pipe(
                tap((dest) => onSuccess?.(dest)),
                switchMap(() =>
                  forkJoin({
                    destinations: destinationApi.getAll(),
                    summary: verificationApi.getSummary().pipe(catchError(() => of(store.summary())))
                  })
                ),
                tap(({ destinations, summary }) =>
                  patchState(store, { destinations, summary })
                ),
                catchError((err) => {
                  const msg = errMsg(err, 'Failed to create payment destination.');
                  onError?.(msg);
                  return EMPTY;
                })
              )
            )
          )
        ),

        updateDestination: rxMethod<{
          id: string;
          dto: UpdatePaymentDestinationRequest;
          onSuccess?: (dest: PaymentDestination) => void;
          onError?: (msg: string) => void;
        }>(
          pipe(
            exhaustMap(({ id, dto, onSuccess, onError }) =>
              destinationApi.update(id, dto).pipe(
                tap((dest) => onSuccess?.(dest)),
                switchMap(() =>
                  forkJoin({
                    destinations: destinationApi.getAll(),
                    summary: verificationApi.getSummary().pipe(catchError(() => of(store.summary())))
                  })
                ),
                tap(({ destinations, summary }) =>
                  patchState(store, { destinations, summary })
                ),
                catchError((err) => {
                  const msg = errMsg(err, 'Failed to update payment destination.');
                  onError?.(msg);
                  return EMPTY;
                })
              )
            )
          )
        ),

        processManualReview: rxMethod<{
          id: string;
          request: ManualReviewRequest;
          onSuccess?: (item: PaymentVerificationItem) => void;
          onError?: (msg: string) => void;
        }>(
          pipe(
            exhaustMap(({ id, request, onSuccess, onError }) =>
              verificationApi.processManualReview(id, request).pipe(
                tap((item) => onSuccess?.(item)),
                switchMap(() =>
                  forkJoin({
                    summary: verificationApi.getSummary().pipe(catchError(() => of(store.summary()))),
                    sales: verificationApi.getEligibleSales().pipe(catchError(() => of([]))),
                    history: verificationApi.getVerifications({
                      pageIndex: store.pageIndex(),
                      pageSize: store.pageSize()
                    }).pipe(catchError(() => of({ items: store.verifications(), totalCount: store.totalHistoryCount() })))
                  })
                ),
                tap(({ summary, sales, history }) =>
                  patchState(store, {
                    summary,
                    eligibleSales: sales,
                    verifications: history.items || [],
                    totalHistoryCount: history.totalCount || 0
                  })
                ),
                catchError((err) => {
                  const msg = errMsg(err, 'Failed to process manual review.');
                  onError?.(msg);
                  return EMPTY;
                })
              )
            )
          )
        ),

        setDefaultDestination: rxMethod<{
          id: string;
          onSuccess?: () => void;
          onError?: (msg: string) => void;
        }>(
          pipe(
            exhaustMap(({ id, onSuccess, onError }) =>
              destinationApi.setDefault(id).pipe(
                tap(() => onSuccess?.()),
                switchMap(() => destinationApi.getAll()),
                tap((destinations) => patchState(store, { destinations })),
                catchError((err) => {
                  const msg = errMsg(err, 'Failed to set default destination.');
                  onError?.(msg);
                  return EMPTY;
                })
              )
            )
          )
        ),

        toggleDestinationStatus: rxMethod<{
          id: string;
          isActive: boolean;
          onSuccess?: () => void;
          onError?: (msg: string) => void;
        }>(
          pipe(
            exhaustMap(({ id, isActive, onSuccess, onError }) =>
              destinationApi.setStatus(id, isActive).pipe(
                tap(() => onSuccess?.()),
                switchMap(() =>
                  forkJoin({
                    destinations: destinationApi.getAll(),
                    summary: verificationApi.getSummary().pipe(catchError(() => of(store.summary())))
                  })
                ),
                tap(({ destinations, summary }) =>
                  patchState(store, { destinations, summary })
                ),
                catchError((err) => {
                  const msg = errMsg(err, 'Failed to update destination status.');
                  onError?.(msg);
                  return EMPTY;
                })
              )
            )
          )
        ),

        deleteDestination: rxMethod<{
          id: string;
          onSuccess?: () => void;
          onError?: (msg: string) => void;
        }>(
          pipe(
            exhaustMap(({ id, onSuccess, onError }) =>
              destinationApi.delete(id).pipe(
                tap(() => onSuccess?.()),
                switchMap(() =>
                  forkJoin({
                    destinations: destinationApi.getAll(),
                    summary: verificationApi.getSummary().pipe(catchError(() => of(store.summary())))
                  })
                ),
                tap(({ destinations, summary }) =>
                  patchState(store, { destinations, summary })
                ),
                catchError((err) => {
                  const msg = errMsg(err, 'Failed to delete payment destination.');
                  onError?.(msg);
                  return EMPTY;
                })
              )
            )
          )
        )
      };
    }
  )
);

export const PaymentStore = PaymentVerificationStore;
