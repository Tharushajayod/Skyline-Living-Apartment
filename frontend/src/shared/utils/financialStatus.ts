export type CustomerFinancialStatusKey =
  | 'PURCHASED'
  | 'COMPLETION_PENDING'
  | 'CANCELLED_REFUNDED'
  | 'CANCELLED_REFUND_SENT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'RESERVED'
  | 'PENDING';

export interface CustomerFinancialStatus {
  key: CustomerFinancialStatusKey;
  label: string;
  financialStatusText: string;
  purchaseStatusText?: string;
  badgeVariant: 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
  isPurchased: boolean;
  isCompletionPending: boolean;
  isFullyPaid: boolean;
  isCancelledOrRefunded: boolean;
  isRefunded: boolean;
}

export interface FinancialItemInput {
  status?: string;
  isFullyPaid?: boolean;
  hasCompletedSale?: boolean;
  apartmentStatus?: string;
  refundStatus?: string;
  refundAmount?: number;
  totalPaid?: number;
  totalPrice?: number;
  remainingBalance?: number;
  displayStatus?: string;
}

/**
 * Authoritative customer-facing financial lifecycle mapping.
 *
 * Rules:
 * 1. Cancelled or Expired reservations are NEVER treated as purchased, even if derived balances are 0.
 * 2. Fully settled apartments with verified payment and sale record display as FULLY PAID • PURCHASED.
 * 3. Fully paid apartments awaiting sale finalization display as FULLY PAID • COMPLETION PENDING.
 * 4. Cancelled reservations with completed refunds display as CANCELLED • REFUNDED.
 * 5. Cancelled reservations without refund display as CANCELLED (no fabricated refund figures).
 */
export function getCustomerFacingFinancialStatus(
  item: FinancialItemInput
): CustomerFinancialStatus {
  const isCancelled = item.status === 'Cancelled';
  const isExpired = item.status === 'Expired';
  const isCancelledOrExpired = isCancelled || isExpired;

  // 1. GENUINE CANCELLATION / EXPIRATION TERMINAL OUTCOMES
  if (isCancelledOrExpired) {
    const hasRefundCompleted =
      item.refundStatus === 'COMPLETED' ||
      item.refundStatus === 'Completed' ||
      (item.refundAmount !== undefined && item.refundAmount > 0 && item.refundStatus !== 'PROCESSED' && item.refundStatus !== 'SENT');

    const hasRefundSent =
      item.refundStatus === 'PROCESSED' ||
      item.refundStatus === 'SENT' ||
      item.refundStatus === 'Payment Sent – Awaiting Confirmation';

    if (hasRefundCompleted) {
      return {
        key: 'CANCELLED_REFUNDED',
        label: 'CANCELLED • REFUNDED',
        financialStatusText: 'Refund Completed / Financially Closed',
        badgeVariant: 'neutral',
        isPurchased: false,
        isCompletionPending: false,
        isFullyPaid: false,
        isCancelledOrRefunded: true,
        isRefunded: true,
      };
    }

    if (hasRefundSent) {
      return {
        key: 'CANCELLED_REFUND_SENT',
        label: 'CANCELLED • REFUND SENT',
        financialStatusText: 'Payment Sent – Awaiting Your Confirmation',
        badgeVariant: 'warning',
        isPurchased: false,
        isCompletionPending: false,
        isFullyPaid: false,
        isCancelledOrRefunded: true,
        isRefunded: false,
      };
    }

    if (isExpired) {
      return {
        key: 'EXPIRED',
        label: 'EXPIRED',
        financialStatusText: 'Reservation Expired',
        badgeVariant: 'neutral',
        isPurchased: false,
        isCompletionPending: false,
        isFullyPaid: false,
        isCancelledOrRefunded: true,
        isRefunded: false,
      };
    }

    return {
      key: 'CANCELLED',
      label: 'CANCELLED',
      financialStatusText: 'Cancelled – No Payment/Refund Associated',
      badgeVariant: 'neutral',
      isPurchased: false,
      isCompletionPending: false,
      isFullyPaid: false,
      isCancelledOrRefunded: true,
      isRefunded: false,
    };
  }

  // 2. GENUINE FULL PAYMENT / PURCHASE OUTCOMES
  const hasSale = Boolean(item.hasCompletedSale || item.apartmentStatus === 'Sold');
  const totalPrice = Number(item.totalPrice || 0);
  const totalPaid = Number(item.totalPaid || 0);
  const isPaidInFull =
    Boolean(item.isFullyPaid) ||
    (totalPrice > 0 && totalPaid >= totalPrice) ||
    hasSale;

  if (isPaidInFull) {
    if (hasSale) {
      return {
        key: 'PURCHASED',
        label: 'FULLY PAID • PURCHASED',
        financialStatusText: 'Fully Settled',
        purchaseStatusText: 'Completed / Purchased',
        badgeVariant: 'success',
        isPurchased: true,
        isCompletionPending: false,
        isFullyPaid: true,
        isCancelledOrRefunded: false,
        isRefunded: false,
      };
    }

    return {
      key: 'COMPLETION_PENDING',
      label: 'FULLY PAID • COMPLETION PENDING',
      financialStatusText: 'Fully Settled',
      purchaseStatusText: 'Deed Transfer / Admin Finalization in Progress',
      badgeVariant: 'success',
      isPurchased: false,
      isCompletionPending: true,
      isFullyPaid: true,
      isCancelledOrRefunded: false,
      isRefunded: false,
    };
  }

  // 3. ACTIVE / IN-PROGRESS RESERVATION OUTCOMES
  if (item.status === 'Confirmed') {
    return {
      key: 'RESERVED',
      label: 'RESERVED',
      financialStatusText: '10% Hold Deposit Confirmed',
      badgeVariant: 'primary',
      isPurchased: false,
      isCompletionPending: false,
      isFullyPaid: false,
      isCancelledOrRefunded: false,
      isRefunded: false,
    };
  }

  return {
    key: 'PENDING',
    label: 'AWAITING RESERVATION FEE',
    financialStatusText: 'Awaiting 10% Reservation Fee Confirmation',
    badgeVariant: 'warning',
    isPurchased: false,
    isCompletionPending: false,
    isFullyPaid: false,
    isCancelledOrRefunded: false,
    isRefunded: false,
  };
}
