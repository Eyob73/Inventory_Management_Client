export type PaymentDestinationType = 'BankAccount' | 'Telebirr';

export interface PaymentDestination {
  id: string;
  name: string;
  type: PaymentDestinationType | number;
  typeName?: string;
  bankCode?: string;
  bankName?: string;
  maskedAccountNumber?: string;
  maskedPhoneNumber?: string;
  accountHolderName?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
}

export interface CreatePaymentDestinationRequest {
  name: string;
  type: PaymentDestinationType | number;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  phoneNumber?: string;
  accountHolderName?: string;
  isDefault: boolean;
}

export interface UpdatePaymentDestinationRequest {
  name: string;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  phoneNumber?: string;
  accountHolderName?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface SupportedBank {
  id: string;
  name: string;
  swift?: string;
  type: string;
  status: string;
  requiresAccount: boolean;
  accountDigits?: number;
  requiresPhone: boolean;
  color?: string;
  initials?: string;
}

export interface EligibleSale {
  id: string;
  saleNumber: string;
  customerId?: string;
  customerName?: string;
  totalAmount: number;
  amountAlreadyPaid: number;
  outstandingBalance: number;
  saleStatus: string;
  saleDate: string;
  paymentMethod: string;
}

export type PaymentVerificationStatus =
  | 'Pending'
  | 'Verified'
  | 'Rejected'
  | 'AmountMismatch'
  | 'DestinationMismatch'
  | 'UnableToConfirmDestination'
  | 'NeedsManualReview'
  | 'Failed';

export type DestinationMatchStatus =
  | 'Matched'
  | 'Mismatched'
  | 'UnableToConfirm'
  | 'NotApplicable';

export interface VerifyPaymentRequest {
  saleId?: string;
  cart?: any;
  paymentDestinationId: string;
  submittedReference: string;
  bankCode?: string;
  payerPhone?: string;
  qrData?: string;
}

export interface VerifyPaymentResponse {
  verificationId: string;
  saleId?: string;
  saleNumber?: string;
  paymentDestinationId?: string;
  paymentDestinationName?: string;
  provider: string;
  bankCode: string;
  submittedReference: string;
  verifiedReference?: string;
  expectedAmount: number;
  verifiedAmount?: number;
  currency: string;
  status: PaymentVerificationStatus | number;
  statusName: string;
  destinationMatchStatus: DestinationMatchStatus | number;
  destinationMatchStatusName: string;
  payerName?: string;
  payerAccount?: string;
  receiverName?: string;
  receiverAccount?: string;
  transactionDateUtc?: string;
  verificationTimestamp: string;
  failureCode?: string;
  failureMessage?: string;
  providerTransactionId?: string;
  isEligibleForRetry: boolean;
  needsManualReview: boolean;
  saleUpdated: boolean;
  newSaleStatus?: string;
  newOutstandingBalance?: number;
  sourceUrl?: string;
}

export interface PaymentVerificationItem {
  id: string;
  saleId?: string;
  saleNumber?: string;
  customerName?: string;
  paymentDestinationId?: string;
  paymentDestinationName?: string;
  provider: string;
  bankCode: string;
  submittedReference: string;
  verifiedReference?: string;
  expectedAmount: number;
  verifiedAmount?: number;
  currency: string;
  status: PaymentVerificationStatus | number;
  statusName: string;
  destinationMatchStatus: DestinationMatchStatus | number;
  destinationMatchStatusName: string;
  payerName?: string;
  payerAccount?: string;
  receiverName?: string;
  receiverAccount?: string;
  transactionDateUtc?: string;
  createdAtUtc: string;
  verifiedByUserId?: string;
  verifiedByUserName?: string;
  providerTransactionId?: string;
  failureCode?: string;
  failureMessage?: string;
  isManualReviewApproved?: boolean;
  manualReviewNotes?: string;
  reviewedByUserName?: string;
  reviewedAtUtc?: string;
  sourceUrl?: string;
}

export interface PaymentVerificationFilter {
  searchTerm?: string;
  provider?: string;
  status?: PaymentVerificationStatus | number;
  startDate?: string;
  endDate?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface PaymentVerificationSummary {
  totalDestinations: number;
  activeDestinations: number;
  verifiedTransactions: number;
  needsReviewTransactions: number;
  verifiedCount?: number;
  needsReviewCount?: number;
}

export interface ManualReviewRequest {
  approved: boolean;
  notes?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export type ReceiptScanMode = 'manual' | 'camera' | 'upload';

export interface ExtractedReceiptDetails {
  rawContent: string;
  provider?: string;
  providerName?: string;
  transactionReference?: string;
  amount?: number;
  currency?: string;
  transactionDate?: string;
  payerName?: string;
  payerPhone?: string;
  payerAccountMasked?: string;
  receiverAccountMasked?: string;
  receiverName?: string;
  receiptUrl?: string;
  isPaymentRequestOnly?: boolean;
  parseWarnings?: string[];
  parseErrors?: string[];
}

