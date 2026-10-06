import { Reservation, ReservationDetails, ReservationStatus } from '@/shared/types';
import { formatDateTime } from './format';

export interface HoldTimingResult {
  state: 'awaiting_fee' | 'active' | 'expired' | 'closed';
  label: string;
  badgeVariant: 'warning' | 'primary' | 'neutral' | 'danger';
  countdownText: string;
  exactExpiryText: string | null;
  expiresAtIso: string | null;
  remainingSeconds: number;
  isExpired: boolean;
  isActive: boolean;
}

export interface CancellationTimingResult {
  state: 'awaiting_fee' | 'eligible' | 'expired' | 'closed';
  label: string;
  badgeVariant: 'warning' | 'success' | 'neutral';
  countdownText: string;
  exactDeadlineText: string | null;
  deadlineIso: string | null;
  remainingSeconds: number;
  isEligible: boolean;
  isExpired: boolean;
}

/**
 * Calculates authoritative 4-Day Reservation Hold timing.
 * 
 * Business Rule:
 * 1. Hold NEVER starts on reservation creation (when status is PENDING / fee unpaid).
 * 2. Hold starts ONLY when reservation fee is confirmed (status is CONFIRMED).
 * 3. Hold expires at: reservationFeeConfirmedAt + 4 days (or authoritative holdExpiresAt / expiresAt).
 * 4. Closed states (CANCELLED, EXPIRED, SOLD) stop live countdowns.
 */
export function getReservationHoldTiming(
  reservation?: Partial<Reservation> | null
): HoldTimingResult {
  if (!reservation) {
    return {
      state: 'closed',
      label: 'Unknown',
      badgeVariant: 'neutral',
      countdownText: 'No reservation',
      exactExpiryText: null,
      expiresAtIso: null,
      remainingSeconds: 0,
      isExpired: false,
      isActive: false,
    };
  }

  const status = reservation.status as ReservationStatus;

  // Closed / Final States
  if (status === 'Cancelled') {
    return {
      state: 'closed',
      label: 'Cancelled',
      badgeVariant: 'neutral',
      countdownText: 'Reservation Cancelled',
      exactExpiryText: null,
      expiresAtIso: null,
      remainingSeconds: 0,
      isExpired: false,
      isActive: false,
    };
  }

  if (status === 'Expired') {
    return {
      state: 'expired',
      label: 'Hold Expired',
      badgeVariant: 'neutral',
      countdownText: 'Expired',
      exactExpiryText: reservation.holdExpiresAt || reservation.expiresAt ? formatDateTime(reservation.holdExpiresAt || reservation.expiresAt!) : null,
      expiresAtIso: reservation.holdExpiresAt || reservation.expiresAt || null,
      remainingSeconds: 0,
      isExpired: true,
      isActive: false,
    };
  }

  // Pending / Unconfirmed State: Fee not yet confirmed -> NO 4-day countdown!
  if (status === 'Pending' || (!reservation.reservationFeeConfirmedAt && !reservation.reservationFeePaid && status !== 'Confirmed')) {
    return {
      state: 'awaiting_fee',
      label: 'Awaiting Reservation Fee',
      badgeVariant: 'warning',
      countdownText: 'Hold period starts after reservation fee confirmation',
      exactExpiryText: null,
      expiresAtIso: null,
      remainingSeconds: 0,
      isExpired: false,
      isActive: false,
    };
  }

  // Confirmed State: Hold is running or expired
  const expiryIso = reservation.holdExpiresAt || reservation.expiresAt || null;
  if (!expiryIso) {
    return {
      state: 'active',
      label: 'Reservation Active',
      badgeVariant: 'primary',
      countdownText: 'Active',
      exactExpiryText: null,
      expiresAtIso: null,
      remainingSeconds: 0,
      isExpired: false,
      isActive: true,
    };
  }

  const targetTime = new Date(expiryIso).getTime();
  const now = Date.now();
  const diff = targetTime - now;

  if (isNaN(targetTime) || diff <= 0) {
    return {
      state: 'expired',
      label: 'Hold Expired',
      badgeVariant: 'danger',
      countdownText: 'Expired',
      exactExpiryText: formatDateTime(expiryIso),
      expiresAtIso: expiryIso,
      remainingSeconds: 0,
      isExpired: true,
      isActive: false,
    };
  }

  const remainingSeconds = Math.floor(diff / 1000);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let countdownText = `${minutes}m remaining`;
  if (days > 0) {
    countdownText = `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    countdownText = `${hours}h ${minutes}m remaining`;
  }

  return {
    state: 'active',
    label: '4-Day Hold Active',
    badgeVariant: 'primary',
    countdownText,
    exactExpiryText: formatDateTime(expiryIso),
    expiresAtIso: expiryIso,
    remainingSeconds,
    isExpired: false,
    isActive: true,
  };
}

/**
 * Calculates authoritative 48-Hour Cancellation / Refund Window timing.
 * 
 * Business Rule:
 * 1. Window starts ONLY when reservation fee is confirmed.
 * 2. Window deadline = reservationFeeConfirmedAt + 48 hours.
 * 3. Never calculated from reservation creation timestamp.
 */
export function getReservationCancellationTiming(
  reservation?: Partial<Reservation> | null,
  details?: Partial<ReservationDetails> | null
): CancellationTimingResult {
  const status = (details?.reservation?.status || reservation?.status) as ReservationStatus;

  if (status === 'Cancelled') {
    return {
      state: 'closed',
      label: 'Cancelled',
      badgeVariant: 'neutral',
      countdownText: 'Reservation Cancelled',
      exactDeadlineText: null,
      deadlineIso: null,
      remainingSeconds: 0,
      isEligible: false,
      isExpired: false,
    };
  }

  if (status === 'Expired') {
    return {
      state: 'closed',
      label: 'Hold Expired',
      badgeVariant: 'neutral',
      countdownText: 'Cancellation Window Closed',
      exactDeadlineText: null,
      deadlineIso: null,
      remainingSeconds: 0,
      isEligible: false,
      isExpired: true,
    };
  }

  const isFeeConfirmed = Boolean(
    details?.reservationFeeConfirmedAt ||
    reservation?.reservationFeeConfirmedAt ||
    reservation?.reservationFeePaid ||
    status === 'Confirmed'
  );

  if (status === 'Pending' || !isFeeConfirmed) {
    return {
      state: 'awaiting_fee',
      label: 'Awaiting Fee Confirmation',
      badgeVariant: 'warning',
      countdownText: '48h refund window starts after fee confirmation',
      exactDeadlineText: null,
      deadlineIso: null,
      remainingSeconds: 0,
      isEligible: false,
      isExpired: false,
    };
  }

  const deadlineIso =
    details?.cancellationDeadline ||
    details?.refundDeadline ||
    reservation?.cancellationDeadline ||
    null;

  if (!deadlineIso) {
    return {
      state: 'expired',
      label: 'Cancellation Window Expired',
      badgeVariant: 'neutral',
      countdownText: 'Expired',
      exactDeadlineText: null,
      deadlineIso: null,
      remainingSeconds: 0,
      isEligible: false,
      isExpired: true,
    };
  }

  const targetTime = new Date(deadlineIso).getTime();
  const now = Date.now();
  const diff = targetTime - now;

  if (isNaN(targetTime) || diff <= 0) {
    return {
      state: 'expired',
      label: 'Cancellation Window Expired',
      badgeVariant: 'neutral',
      countdownText: '48h refund window expired',
      exactDeadlineText: formatDateTime(deadlineIso),
      deadlineIso,
      remainingSeconds: 0,
      isEligible: false,
      isExpired: true,
    };
  }

  const remainingSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const countdownText = hours > 0
    ? `${hours}h ${minutes}m remaining`
    : `${minutes}m remaining`;

  return {
    state: 'eligible',
    label: '48h Refund Eligible',
    badgeVariant: 'success',
    countdownText,
    exactDeadlineText: formatDateTime(deadlineIso),
    deadlineIso,
    remainingSeconds,
    isEligible: true,
    isExpired: false,
  };
}
