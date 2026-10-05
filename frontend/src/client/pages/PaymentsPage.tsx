import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgePercent,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  Landmark,
  Layers3,
  Loader2,
  Lock,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Upload,
  WalletCards,
  X,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  AlertCircle,
  FileCheck,
  ChevronRight,
} from 'lucide-react';

import type {
  Apartment,
  Payment,
  PaymentPlan,
  Reservation,
} from '@/shared/types';

import { paymentService } from '@/shared/services/paymentService';
import { paymentPlanService } from '@/shared/services/paymentPlanService';
import { reservationService } from '@/shared/services/reservationService';
import { apartmentService } from '@/shared/services/apartmentService';

import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';

import Badge, {
  statusToVariant,
} from '@/shared/components/ui/Badge';

import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import PaymentDetailsModal from '@/shared/components/PaymentDetailsModal';
import ReservationDetailsModal from '@/management/components/ReservationDetailsModal';
import EmptyState from '@/shared/components/ui/EmptyState';

import {
  Input,
  Select,
  Textarea,
} from '@/shared/components/ui/Form';

import {
  formatCurrency,
  formatDate,
  getTodayDateString,
  isPastDate,
} from '@/shared/utils/format';

/* =========================================================
   TYPES
   ========================================================= */

type TabType = 'All' | 'Verified' | 'Pending' | 'Rejected';

type SettlementMode =
  | 'Full'
  | 'Installment'
  | 'PartPayment'
  | 'ReservationFee';

interface PropertyAccount {
  reservationId: string;
  apartmentId: string;
  apartmentTitle: string;
  totalPrice: number;
  totalPaid: number;
  remainingBalance: number;
  reservationFee: number;
  reservationFeePaid: boolean;
  reservationFeePending?: boolean;
  reservationStatus: string;
  apartmentStatus?: string;
  isFullyPaid: boolean;
  hasCompletedSale?: boolean;
  isPurchased?: boolean;
  isCompletionPending?: boolean;
  isCancelledOrRefunded?: boolean;
  lastPaymentDate?: string;
  financiallyClosed: boolean;
  canPayReservationFee: boolean;
  canRequestSettlement: boolean;
  canConfirmRefund: boolean;
  settlementProgress: number;
  refundStatus?: string;
  refundAmount?: number;
  companyRetainedAmount?: number;
  refundProcessedAt?: string;
  customerConfirmedAt?: string;
  plan?: PaymentPlan;
  rawReservation: Reservation;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  /* -----------------------------
     SWR INSTANT CACHE INITIALIZATION (0ms)
     ----------------------------- */
  const [payments, setPayments] = useState<Payment[]>(() => {
    if (user?.email) {
      return paymentService.getCachedByCustomer(user.email) || [];
    }
    return [];
  });

  const [plans, setPlans] = useState<PaymentPlan[]>(() => {
    if (user?.email) {
      return paymentPlanService.getCachedAll(user.email) || [];
    }
    return [];
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    if (user?.email) {
      return reservationService.getCachedByCustomer(user.email) || [];
    }
    return [];
  });

  const [apartments, setApartments] = useState<Apartment[]>(() => {
    return apartmentService.getCached('apartments_all') || [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (user?.email && paymentService.getCachedByCustomer(user.email)) {
      return false;
    }
    return true;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* -----------------------------
     PAGE STATE
     ----------------------------- */
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  /* -----------------------------
     PAYMENT MODALS STATE
     ----------------------------- */
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [settlementMode, setSettlementMode] = useState<SettlementMode>('Full');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* -----------------------------
     PLAN REQUEST STATE & VALIDATION
     ----------------------------- */
  const [installmentCountInput, setInstallmentCountInput] = useState<number | string>(12);
  const [partCountInput, setPartCountInput] = useState<number | string>(3);
  const [installmentError, setInstallmentError] = useState<string | null>(null);
  const [partError, setPartError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [planStartDate, setPlanStartDate] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [submittingPlan, setSubmittingPlan] = useState(false);

  /* -----------------------------
     RECEIPT & PLAN ITEM MODAL STATE
     ----------------------------- */
  const [receiptTarget, setReceiptTarget] = useState<Payment | null>(null);
  const [planPayTarget, setPlanPayTarget] = useState<{
    plan: PaymentPlan;
    item: NonNullable<PaymentPlan['items']>[number];
  } | null>(null);
  const [planPaySlip, setPlanPaySlip] = useState<File | null>(null);
  const [planPayNotes, setPlanPayNotes] = useState('');
  const [submittingPlanPayment, setSubmittingPlanPayment] = useState(false);
  const planSlipInputRef = useRef<HTMLInputElement>(null);

  /* -----------------------------
     REFUND DIALOGS & CONFIRMATION
     ----------------------------- */
  const [viewDetailsReservationId, setViewDetailsReservationId] = useState<string | null>(null);
  const [confirmRefundAccount, setConfirmRefundAccount] = useState<PropertyAccount | null>(null);
  const [isConfirmingRefund, setIsConfirmingRefund] = useState(false);

  /* =========================================================
     OPTIMIZED DATA LOADING (CONCURRENT & TARGETED)
     ========================================================= */
  const loadData = useCallback(async (showRefreshing = false) => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    if (showRefreshing) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const [
        paymentRes,
        reservationRes,
        apartmentRes,
        planRes,
      ] = await Promise.allSettled([
        paymentService.getByCustomer(user.email),
        reservationService.getByCustomer(user.email),
        apartmentService.getAll({ includeSold: true }),
        paymentPlanService.getAll(user.email),
      ]);

      if (paymentRes.status === 'fulfilled' && Array.isArray(paymentRes.value)) {
        setPayments(paymentRes.value);
      } else if (paymentRes.status === 'rejected') {
        console.error('Failed to load customer payments:', paymentRes.reason);
      }

      if (reservationRes.status === 'fulfilled' && Array.isArray(reservationRes.value)) {
        setReservations(reservationRes.value);
      }

      if (apartmentRes.status === 'fulfilled' && Array.isArray(apartmentRes.value)) {
        setApartments(apartmentRes.value);
      }

      if (planRes.status === 'fulfilled' && Array.isArray(planRes.value)) {
        setPlans(planRes.value);
      }
    } catch (err: any) {
      console.error('Failed to load payment center records:', err);
      if (payments.length === 0) {
        setError('Unable to load payment information. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.email, payments.length]);

  useEffect(() => {
    let mounted = true;
    loadData();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  /* =========================================================
     PROPERTY ACCOUNTS DERIVATION (STRICT RESERVATION SCOPING)
     ========================================================= */
  const propertyAccounts: PropertyAccount[] = useMemo(() => {
    return reservations.map((reservation) => {
      const apartment = apartments.find(
        (item) => item.id === reservation.apartmentId || item.title === reservation.apartmentTitle
      );

      // CRITICAL RULE 1 & 2: Only payments belonging directly to THIS reservation count!
      const propertyPayments = payments.filter((payment) => {
        return payment.reservationId === reservation.id && payment.status === 'Verified';
      });

      const totalPaidFromPayments = propertyPayments.reduce(
        (total, payment) => total + (Number(payment.amount) || 0),
        0
      );

      const totalPrice = Number(apartment?.price || 0);

      // Prefer backend authoritative financial values
      const totalPaid = reservation.verifiedPaid !== undefined && reservation.verifiedPaid !== null
        ? Number(reservation.verifiedPaid)
        : totalPaidFromPayments;

      const remainingBalance = reservation.remainingBalance !== undefined && reservation.remainingBalance !== null
        ? Number(reservation.remainingBalance)
        : Math.max(0, totalPrice - totalPaid);

      const feePayments = payments.filter(
        (p) =>
          p.reservationId === reservation.id &&
          (p.type === 'RESERVATION_FEE' || p.type === 'Reservation Fee')
      );

      const reservationFeePaid = reservation.reservationFeePaid !== undefined && reservation.reservationFeePaid !== null
        ? Boolean(reservation.reservationFeePaid)
        : feePayments.some((p) => p.status === 'Verified');

      const reservationFeePending =
        !reservationFeePaid && feePayments.some((p) => p.status === 'Pending');

      const matchingPlan = plans
        .filter((plan) => plan.reservationId === reservation.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      const isCancelled = reservation.status === 'Cancelled';
      const isExpired = reservation.status === 'Expired';
      const isCancelledOrExpired = isCancelled || isExpired;

      const hasCompletedSale = Boolean(
        reservation.hasCompletedSale ||
        (apartment && apartment.status === 'Sold' && reservation.hasCompletedSale !== false)
      );

      const isFullyPaid = !isCancelledOrExpired && (
        Boolean(reservation.isFullyPaid) ||
        (totalPrice > 0 && totalPaid >= totalPrice) ||
        hasCompletedSale
      );

      const isPurchased = !isCancelledOrExpired && isFullyPaid && hasCompletedSale;
      const isCompletionPending = !isCancelledOrExpired && isFullyPaid && !hasCompletedSale;
      const isCancelledOrRefunded = isCancelledOrExpired;

      // financiallyClosed is ONLY true for cancelled/expired reservations
      const financiallyClosed = isCancelledOrExpired;

      const canPayReservationFee = Boolean(
        reservation.canPayReservationFee ?? (!financiallyClosed && !reservationFeePaid && !reservationFeePending)
      );

      const canRequestSettlement = Boolean(
        reservation.canRequestSettlement ?? (!financiallyClosed && reservationFeePaid && !isFullyPaid)
      );

      const canConfirmRefund = Boolean(
        reservation.canConfirmRefund ??
        (reservation.refundStatus === 'PROCESSED' || reservation.refundStatus === 'SENT')
      );

      const settlementProgress = isCancelledOrExpired
        ? 0
        : isFullyPaid
          ? 100
          : reservation.settlementProgress !== undefined && reservation.settlementProgress !== null
            ? Number(reservation.settlementProgress)
            : totalPrice > 0
              ? Math.min(100, Math.round((totalPaid / totalPrice) * 100))
              : 0;

      const relatedVerifiedPayments = payments
        .filter((p) => p.reservationId === reservation.id && p.status === 'Verified')
        .sort((a, b) => new Date(b.verifiedAt || b.uploadedAt || 0).getTime() - new Date(a.verifiedAt || a.uploadedAt || 0).getTime());
      const lastPaymentDate = relatedVerifiedPayments[0]?.verifiedAt || relatedVerifiedPayments[0]?.uploadedAt;

      return {
        reservationId: reservation.id,
        apartmentId: reservation.apartmentId,
        apartmentTitle: reservation.apartmentTitle,
        totalPrice,
        totalPaid,
        remainingBalance: (isCancelledOrExpired || isFullyPaid) ? 0 : remainingBalance,
        reservationFee: Number(reservation.reservationFee || 0),
        reservationFeePaid,
        reservationFeePending,
        reservationStatus: reservation.status,
        apartmentStatus: apartment?.status,
        isFullyPaid,
        hasCompletedSale,
        isPurchased,
        isCompletionPending,
        isCancelledOrRefunded,
        lastPaymentDate,
        financiallyClosed,
        canPayReservationFee,
        canRequestSettlement,
        canConfirmRefund,
        settlementProgress,
        refundStatus: reservation.refundStatus,
        refundAmount: reservation.refundAmount !== undefined ? Number(reservation.refundAmount) : undefined,
        companyRetainedAmount: reservation.companyRetainedAmount !== undefined ? Number(reservation.companyRetainedAmount) : undefined,
        refundProcessedAt: reservation.refundProcessedAt,
        customerConfirmedAt: reservation.customerConfirmedAt,
        plan: matchingPlan,
        rawReservation: reservation,
      };
    });
  }, [reservations, apartments, payments, plans]);

  const selectedAccount = useMemo(() => {
    return propertyAccounts.find((account) => account.reservationId === selectedAccountId);
  }, [propertyAccounts, selectedAccountId]);

  // Financial KPIs - Closed reservations & fully purchased units do NOT count toward outstanding balance
  const financialStats = useMemo(() => {
    const verifiedPayments = payments.filter((p) => p.status === 'Verified');
    const pendingPayments = payments.filter((p) => p.status === 'Pending');
    const totalPaidAll = verifiedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalPendingAll = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalOutstandingAll = propertyAccounts
      .filter((acc) => !acc.isPurchased && !acc.isCompletionPending && !acc.financiallyClosed)
      .reduce((sum, acc) => sum + acc.remainingBalance, 0);

    const activeUnitsCount = propertyAccounts.filter(
      (acc) => !acc.isPurchased && !acc.isCompletionPending && !acc.financiallyClosed
    ).length;

    return {
      totalPaid: totalPaidAll,
      totalPending: totalPendingAll,
      totalOutstanding: totalOutstandingAll,
      verifiedCount: verifiedPayments.length,
      pendingCount: pendingPayments.length,
      accountsCount: activeUnitsCount,
    };
  }, [payments, propertyAccounts]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return payments.filter((payment) => {
      let matchesTab = true;
      if (activeTab === 'Verified') {
        matchesTab = payment.status === 'Verified';
      } else if (activeTab === 'Pending') {
        matchesTab = payment.status === 'Pending';
      } else if (activeTab === 'Rejected') {
        matchesTab = payment.status === 'Rejected';
      }

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        payment.id?.toLowerCase().includes(query) ||
        payment.apartmentTitle?.toLowerCase().includes(query) ||
        payment.type?.toLowerCase().includes(query) ||
        payment.notes?.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [payments, activeTab, searchQuery]);

  /* =========================================================
     AUTO-CALCULATIONS FOR INSTALLMENTS & PART PAYMENTS
     ========================================================= */
  const parsedInstallments = typeof installmentCountInput === 'number'
    ? installmentCountInput
    : parseInt(String(installmentCountInput), 10);

  const isValidInstallmentCount =
    !isNaN(parsedInstallments) &&
    Number.isInteger(parsedInstallments) &&
    parsedInstallments >= 2 &&
    parsedInstallments <= 60;

  const calculatedInstallmentAmount = useMemo(() => {
    if (!selectedAccount || !isValidInstallmentCount) return 0;
    return Math.floor(selectedAccount.remainingBalance / parsedInstallments);
  }, [selectedAccount, isValidInstallmentCount, parsedInstallments]);

  const parsedParts = typeof partCountInput === 'number'
    ? partCountInput
    : parseInt(String(partCountInput), 10);

  const isValidPartCount =
    !isNaN(parsedParts) &&
    Number.isInteger(parsedParts) &&
    parsedParts >= 2 &&
    parsedParts <= 5;

  const calculatedPartAmount = useMemo(() => {
    if (!selectedAccount || !isValidPartCount) return 0;
    return Math.floor(selectedAccount.remainingBalance / parsedParts);
  }, [selectedAccount, isValidPartCount, parsedParts]);

  const handleInstallmentCountChange = (val: string) => {
    setInstallmentCountInput(val);
    const num = Number(val);
    if (!val || isNaN(num) || !Number.isInteger(num) || num < 2 || num > 60) {
      setInstallmentError('Number of installments must be a whole number between 2 and 60.');
    } else {
      setInstallmentError(null);
    }
  };

  const handlePartCountChange = (val: string) => {
    setPartCountInput(val);
    const num = Number(val);
    if (!val || isNaN(num) || !Number.isInteger(num) || num < 2 || num > 5) {
      setPartError('Number of parts must be a whole number between 2 and 5.');
    } else {
      setPartError(null);
    }
  };

  const handleDateChange = (val: string) => {
    setPlanStartDate(val);
    if (!val) {
      setDateError('Please select the first due date.');
    } else if (isPastDate(val)) {
      setDateError('First payment date cannot be in the past. Please select today or a future date.');
    } else {
      setDateError(null);
    }
  };

  /* =========================================================
     AUTO-PAY HANDLER FROM RESERVATIONS PAGE
     ========================================================= */
  const autoPayReservationId = (location.state as { autoPayReservationId?: string })
    ?.autoPayReservationId;
  const autoPayHandled = useRef(false);

  useEffect(() => {
    if (autoPayHandled.current || !autoPayReservationId || propertyAccounts.length === 0) return;
    const match = propertyAccounts.find(
      (a) =>
        !a.financiallyClosed &&
        (a.reservationId === autoPayReservationId || a.apartmentId === autoPayReservationId) &&
        !a.reservationFeePaid
    );
    if (match) {
      autoPayHandled.current = true;
      openPaymentModal(match, 'ReservationFee');
    }
  }, [autoPayReservationId, propertyAccounts]);

  /* =========================================================
     MODAL CONTROLS
     ========================================================= */
  const openPaymentModal = (
    account: PropertyAccount,
    mode: SettlementMode = 'Full'
  ) => {
    if (account.financiallyClosed || account.isPurchased || account.isFullyPaid) {
      toast('This property has already been fully paid and settled.', 'info');
      return;
    }

    if (!account.reservationFeePaid) {
      if (account.reservationFeePending) {
        toast('Payment options will be available after your reservation payment is approved.', 'info');
        return;
      }
      mode = 'ReservationFee';
    }

    setSelectedAccountId(account.reservationId);
    setSettlementMode(mode);

    if (mode === 'ReservationFee') {
      setPaymentAmount(String(account.reservationFee));
    } else {
      setPaymentAmount(String(account.remainingBalance));
    }

    setInstallmentCountInput(12);
    setPartCountInput(3);
    setInstallmentError(null);
    setPartError(null);
    setDateError(null);
    setPaymentSlip(null);
    setPaymentNotes('');
    setPlanNotes('');
    setPaymentModalOpen(true);
  };

  /* =========================================================
     SUBMIT FULL / RESERVATION FEE PAYMENT
     ========================================================= */
  const handleFullPayment = async () => {
    if (!selectedAccount) {
      toast('Please select a property account.', 'error');
      return;
    }

    if (selectedAccount.financiallyClosed || selectedAccount.isPurchased || selectedAccount.isFullyPaid) {
      toast('Cannot make payment on a fully paid or closed property.', 'error');
      return;
    }

    if (settlementMode === 'Full' && !selectedAccount.reservationFeePaid) {
      toast('Payment options will be available after your reservation payment is approved.', 'error');
      return;
    }

    if (!paymentSlip) {
      toast('Please upload the bank deposit slip / transfer receipt.', 'error');
      return;
    }

    setSubmittingPayment(true);

    try {
      const isResFee = settlementMode === 'ReservationFee';

      const payload = {
        reservationId: selectedAccount.reservationId,
        apartmentId: selectedAccount.apartmentId,
        type: isResFee ? ('RESERVATION_FEE' as const) : ('FULL_PAYMENT' as const),
        amount: isResFee ? selectedAccount.reservationFee : selectedAccount.remainingBalance,
        notes:
          paymentNotes ||
          (isResFee
            ? '10% Reservation fee hold deposit'
            : 'Full remaining balance payment settlement'),
      };

      const createdPayment = await paymentService.create(payload);

      const formData = new FormData();
      formData.append('file', paymentSlip);
      await paymentService.uploadProof(createdPayment.id, formData);

      toast(
        isResFee
          ? '10% Reservation fee submitted successfully! It is now waiting for staff verification.'
          : 'Full payment submitted successfully. It is now waiting for staff verification.',
        'success'
      );

      setPaymentModalOpen(false);
      setPaymentSlip(null);
      setPaymentNotes('');
      await loadData();
    } catch (error: any) {
      toast(error?.message || 'Payment submission failed.', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  /* =========================================================
     SUBMIT PAYMENT PLAN REQUEST
     ========================================================= */
  const handlePlanRequest = async () => {
    if (submittingPlan) return;

    if (!selectedAccount) {
      toast('Please select a property account.', 'error');
      return;
    }

    if (selectedAccount.financiallyClosed || selectedAccount.isPurchased || selectedAccount.isFullyPaid) {
      toast('Cannot request payment plan for a fully paid or closed property.', 'error');
      return;
    }

    if (!selectedAccount.reservationFeePaid) {
      toast('Payment options will be available after your reservation payment is approved.', 'error');
      return;
    }

    let count: number;
    let amount: number;

    if (settlementMode === 'Installment') {
      if (!isValidInstallmentCount) {
        setInstallmentError('Number of installments must be a whole number between 2 and 60.');
        toast('Number of installments must be between 2 and 60.', 'error');
        return;
      }
      count = parsedInstallments;
      amount = calculatedInstallmentAmount;
    } else if (settlementMode === 'PartPayment') {
      if (!isValidPartCount) {
        setPartError('Number of parts must be a whole number between 2 and 5.');
        toast('Number of parts must be between 2 and 5.', 'error');
        return;
      }
      count = parsedParts;
      amount = calculatedPartAmount;
    } else {
      return;
    }

    if (!planStartDate) {
      setDateError('Please select the first due date.');
      toast('Please select the first due date.', 'error');
      return;
    }

    if (isPastDate(planStartDate)) {
      setDateError('First payment date cannot be in the past.');
      toast('First payment date cannot be in the past. Please select today or a future date.', 'error');
      return;
    }

    const existingActivePlan = plans.find(
      (plan) =>
        plan.reservationId === selectedAccount.reservationId &&
        (plan.status === 'Pending' ||
          plan.status === 'Plan Ready for Confirmation' ||
          plan.status === 'Terms Proposed' ||
          plan.status === 'Approved')
    );

    if (existingActivePlan) {
      toast(
        'You already have an active or proposed payment plan for this reservation.',
        'error'
      );
      return;
    }

    setSubmittingPlan(true);

    try {
      await paymentPlanService.create({
        reservationId: selectedAccount.reservationId,
        planType: settlementMode === 'Installment' ? 'INSTALLMENT' : 'PART_PAYMENT',
        numberOfPayments: count,
        paymentAmount: amount,
        startDate: planStartDate,
        notes: planNotes || undefined,
      });

      toast(
        'Payment plan request submitted successfully. No payment is required until the plan is reviewed and approved.',
        'success'
      );

      setPaymentModalOpen(false);
      await loadData();
    } catch (error: any) {
      toast(error?.message || "We couldn't create the payment plan right now. Please try again.", 'error');
    } finally {
      setSubmittingPlan(false);
    }
  };

  /* =========================================================
     CUSTOMER RE-APPROVAL ACTIONS
     ========================================================= */
  const [actingPlanId, setActingPlanId] = useState<string | null>(null);

  const handleCustomerAcceptPlan = async (planId: string) => {
    try {
      setActingPlanId(planId);
      await paymentPlanService.customerAccept(planId);
      toast('Payment plan terms confirmed and activated! You can now make scheduled payments.', 'success');
      await loadData();
    } catch (err: any) {
      toast(err?.message || 'Failed to accept payment plan terms.', 'error');
    } finally {
      setActingPlanId(null);
    }
  };

  const handleCustomerDeclinePlan = async (planId: string) => {
    try {
      setActingPlanId(planId);
      await paymentPlanService.customerDecline(planId);
      toast('You have declined the proposed payment plan.', 'info');
      await loadData();
    } catch (err: any) {
      toast(err?.message || 'Failed to decline payment plan terms.', 'error');
    } finally {
      setActingPlanId(null);
    }
  };

  /* =========================================================
     CUSTOMER CONFIRM REFUND RECEIVED
     ========================================================= */
  const handleConfirmRefundReceived = async () => {
    if (!confirmRefundAccount) return;
    setIsConfirmingRefund(true);
    try {
      await reservationService.confirmRefundReceiptByReservation(confirmRefundAccount.reservationId);
      toast('Refund confirmation recorded! Receipt acknowledgement completed.', 'success');
      setConfirmRefundAccount(null);
      await loadData();
    } catch (err: any) {
      toast(err?.message || 'Failed to confirm refund receipt.', 'error');
    } finally {
      setIsConfirmingRefund(false);
    }
  };

  /* =========================================================
     SUBMIT SCHEDULED INSTALLMENT PAYMENT
     ========================================================= */
  const handlePlanItemPay = (
    plan: PaymentPlan,
    item: NonNullable<PaymentPlan['items']>[number]
  ) => {
    setPlanPayTarget({ plan, item });
    setPlanPaySlip(null);
    setPlanPayNotes('');
  };

  const submitPlanItemPayment = async () => {
    if (!planPayTarget || !planPaySlip) {
      toast('Please attach the bank transfer receipt.', 'error');
      return;
    }

    const { plan, item } = planPayTarget;
    setSubmittingPlanPayment(true);

    try {
      const type = String(plan.planType).toLowerCase().includes('part')
        ? 'PART_PAYMENT'
        : 'INSTALLMENT_PAYMENT';

      const created = await paymentService.create({
        reservationId: plan.reservationId,
        apartmentId: plan.apartmentId,
        paymentPlanId: plan.id,
        paymentPlanItemId: item.id,
        type,
        amount: Number(item.amount),
        notes: planPayNotes || `Scheduled payment #${item.sequenceNo}`,
      });

      const formData = new FormData();
      formData.append('file', planPaySlip);
      await paymentService.uploadProof(created.id, formData);

      toast('Installment payment submitted. Waiting for staff verification.', 'success');
      setPlanPayTarget(null);
      setPlanPaySlip(null);
      setPlanPayNotes('');
      await loadData();
    } catch (error: any) {
      toast(error?.message || 'Unable to submit scheduled installment payment.', 'error');
    } finally {
      setSubmittingPlanPayment(false);
    }
  };

  /* =========================================================
     FILE HANDLERS
     ========================================================= */
  const handleSlipSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('Receipt file must be 5MB or smaller.', 'error');
      return;
    }
    setPaymentSlip(file);
  };

  const handlePlanSlipSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('Receipt file must be 5MB or smaller.', 'error');
      return;
    }
    setPlanPaySlip(file);
  };

  // Helper for Payment Status Badge
  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case 'Verified':
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Verified & Settled
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Verification
          </span>
        );
      case 'Rejected':
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status || 'Recorded'}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">

      {/* ======================================================== */}
      {/* 1. COMPACT PAGE HEADER                                   */}
      {/* ======================================================== */}
      <div className="bg-white border-b border-slate-200/80 pt-8 pb-7 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1520px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* Title & Description */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                Payments
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1 font-normal">
                Track your payments, transactions, and outstanding balances in one place.
              </p>
            </div>

            {/* Header Action Bar */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                title="Refresh payments"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <Link
                to="/reservations"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>My Reservations</span>
              </Link>

              {propertyAccounts.some((a) => !a.isFullyPaid && !a.financiallyClosed) && (
                <button
                  type="button"
                  onClick={() => {
                    const acc = propertyAccounts.find((item) => !item.isFullyPaid && !item.financiallyClosed);
                    if (acc) {
                      openPaymentModal(acc, !acc.reservationFeePaid ? 'ReservationFee' : 'Full');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Make a Payment</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN FINANCIAL CANVAS                                    */}
      {/* ======================================================== */}
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">

        {/* ======================================================== */}
        {/* 2. FINANCIAL OVERVIEW KPI ROW (Compact Summary Cards)    */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

          {/* KPI 1: Total Paid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Paid</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 truncate">
                {formatCurrency(financialStats.totalPaid)}
              </p>
            </div>
          </div>

          {/* KPI 2: Outstanding Balance */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
              <WalletCards className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Outstanding</p>
              <p className="text-lg sm:text-2xl font-bold text-amber-900 mt-0.5 truncate">
                {formatCurrency(financialStats.totalOutstanding)}
              </p>
            </div>
          </div>

          {/* KPI 3: Pending Verification */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
              <Clock3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">Under Review</p>
              <p className="text-lg sm:text-2xl font-bold text-indigo-950 mt-0.5 truncate">
                {formatCurrency(financialStats.totalPending)}
              </p>
            </div>
          </div>

          {/* KPI 4: Active Property Accounts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Units</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5">
                {financialStats.accountsCount} {financialStats.accountsCount === 1 ? 'Unit' : 'Units'}
              </p>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* 3. ERROR BANNER IF ANY                                   */}
        {/* ======================================================== */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadData(true)}
              className="underline font-bold hover:text-rose-950 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. PROPERTY PROGRESS & SETTLEMENT ACCOUNTS SECTION       */}
        {/* ======================================================== */}
        {propertyAccounts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Property Settlement Balances
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {propertyAccounts.map((account) => {
                const plan = account.plan;

                /* =====================================================
                   CASE A: FULLY PAID / FULLY SETTLED / PURCHASED CARD
                   ===================================================== */
                if (account.isPurchased || account.isCompletionPending) {
                  return (
                    <div
                      key={account.reservationId}
                      className="bg-white rounded-3xl border border-emerald-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-slate-400">
                              <span>Reservation #{account.reservationId}</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                              {account.apartmentTitle}
                            </h3>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {account.isPurchased
                                ? 'FULLY PAID • PURCHASED'
                                : 'FULLY PAID • COMPLETION PENDING'}
                            </span>
                          </div>
                        </div>

                        {/* Financial Amounts Triple-Deck */}
                        <div className="grid grid-cols-3 gap-2.5 mt-4 text-center">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Purchase Price</p>
                            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                              {formatCurrency(account.totalPrice)}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                            <p className="text-[10px] font-bold uppercase text-emerald-700">Total Verified Paid</p>
                            <p className="text-xs font-bold text-emerald-900 mt-0.5 truncate">
                              {formatCurrency(account.totalPaid >= account.totalPrice ? account.totalPaid : (account.totalPaid || account.totalPrice))}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Remaining</p>
                            <p className="text-xs font-bold text-emerald-700 mt-0.5 truncate">
                              Rs. 0
                            </p>
                          </div>
                        </div>

                        {/* Settlement Progress 100% */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-semibold text-slate-500">Settlement Progress</span>
                            <span className="font-bold text-emerald-700">100%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full w-full" />
                          </div>
                        </div>

                        {/* Financial & Purchase Status Info Box */}
                        <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 text-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-700">
                            <span>Financial Status:</span>
                            <span className="font-bold text-emerald-900">Fully Settled</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-700">
                            <span>Purchase Status:</span>
                            <span className="font-bold text-slate-900">
                              {account.isPurchased
                                ? 'Completed / Purchased'
                                : 'Deed Transfer / Admin Finalization in Progress'}
                            </span>
                          </div>
                          {account.lastPaymentDate && (
                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span>Settlement Date:</span>
                              <span>{formatDate(account.lastPaymentDate)}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 text-[11px] text-emerald-700/80 font-medium flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>This residence has been fully settled and ownership verified.</span>
                        </div>
                      </div>

                      {/* Bottom Actions for Purchased Card */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            const elem = document.getElementById('transaction-history-section');
                            if (elem) {
                              elem.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                          <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Payment History</span>
                        </button>

                        <Link
                          to="/my-apartments"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-2xs ml-auto"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>View in My Apartments</span>
                        </Link>
                      </div>
                    </div>
                  );
                }

                /* =====================================================
                   CASE B: CLOSED / CANCELLED / REFUNDED HISTORICAL CARD
                   ===================================================== */
                if (account.isCancelledOrRefunded || account.financiallyClosed) {
                  const hasRefundInfo =
                    account.refundStatus === 'COMPLETED' ||
                    account.refundStatus === 'Completed' ||
                    account.refundStatus === 'PROCESSED' ||
                    account.refundStatus === 'SENT' ||
                    (account.refundAmount !== undefined && account.refundAmount > 0);

                  const badgeText = account.refundStatus === 'COMPLETED' || account.refundStatus === 'Completed'
                    ? 'CANCELLED • REFUNDED'
                    : account.refundStatus === 'PROCESSED' || account.refundStatus === 'SENT'
                      ? 'CANCELLED • REFUND SENT'
                      : account.reservationStatus === 'Expired'
                        ? 'EXPIRED'
                        : 'CANCELLED';

                  return (
                    <div
                      key={account.reservationId}
                      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col justify-between opacity-95 hover:opacity-100 transition"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-slate-400">
                              <span>Reservation #{account.reservationId}</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
                              {account.apartmentTitle}
                            </h3>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              {badgeText}
                            </span>
                          </div>
                        </div>

                        {/* Financial Closed Breakdown Triple-Deck (Only if refund info exists) */}
                        {hasRefundInfo ? (
                          <div className="grid grid-cols-3 gap-2.5 mt-4 text-center">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-[10px] font-bold uppercase text-slate-400">Reservation Fee Paid</p>
                              <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                                {formatCurrency(account.totalPaid > 0 ? account.totalPaid : account.reservationFee)}
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                              <p className="text-[10px] font-bold uppercase text-emerald-700">Refunded to Customer</p>
                              <p className="text-xs font-bold text-emerald-900 mt-0.5 truncate">
                                {formatCurrency(account.refundAmount ?? 0)}
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-[10px] font-bold uppercase text-slate-500">Company Retained Fee</p>
                              <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                                {formatCurrency(account.companyRetainedAmount ?? 0)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 text-center">
                            This reservation was cancelled prior to payment. No refund processing required.
                          </div>
                        )}

                        {/* Financial Status & Date info */}
                        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Financial Status:</span>
                            <span className="font-bold text-slate-900">
                              {account.refundStatus === 'COMPLETED' || account.refundStatus === 'Completed'
                                ? 'Refund Completed / Financially Closed'
                                : account.refundStatus === 'PROCESSED' || account.refundStatus === 'SENT'
                                  ? 'Payment Sent – Awaiting Your Confirmation'
                                  : 'Financially Closed'}
                            </span>
                          </div>
                          {account.refundProcessedAt && (
                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span>Refund Date:</span>
                              <span>{formatDate(account.refundProcessedAt)}</span>
                            </div>
                          )}
                          {account.customerConfirmedAt && (
                            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-medium">
                              <span>Customer Acknowledged:</span>
                              <span>{formatDate(account.customerConfirmedAt)}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 text-[11px] text-slate-400 italic">
                          This reservation is financially closed. Historical records are preserved for your records.
                        </div>
                      </div>

                      {/* Bottom Actions for Closed Card */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setViewDetailsReservationId(account.reservationId)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>{hasRefundInfo ? 'View Refund Details' : 'View Details'}</span>
                        </button>

                        {account.canConfirmRefund && (
                          <button
                            type="button"
                            onClick={() => setConfirmRefundAccount(account)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Refund Received</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                /* =====================================================
                   CASE B: ACTIVE RESERVATION CARD (FRESH OR IN PROGRESS)
                   ===================================================== */
                return (
                  <div
                    key={account.reservationId}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-slate-400">
                            <span>Reservation #{account.reservationId}</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                            {account.apartmentTitle}
                          </h3>
                        </div>

                        <Badge
                          variant={
                            account.isFullyPaid
                              ? 'success'
                              : account.apartmentStatus === 'Sold'
                                ? 'success'
                                : 'warning'
                          }
                          dot
                        >
                          {account.isFullyPaid
                            ? 'Fully Settled'
                            : account.apartmentStatus || 'Reserved'}
                        </Badge>
                      </div>

                      {/* Financial Amount Triple-Deck */}
                      <div className="grid grid-cols-3 gap-2.5 mt-4 text-center">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Unit Price</p>
                          <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                            {formatCurrency(account.totalPrice)}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                          <p className="text-[10px] font-bold uppercase text-emerald-700">Verified Paid</p>
                          <p className="text-xs font-bold text-emerald-900 mt-0.5 truncate">
                            {formatCurrency(account.totalPaid)}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
                          <p className="text-[10px] font-bold uppercase text-amber-800">Remaining</p>
                          <p className="text-xs font-bold text-amber-950 mt-0.5 truncate">
                            {formatCurrency(account.remainingBalance)}
                          </p>
                        </div>
                      </div>

                      {/* Payment Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="font-semibold text-slate-500">Settlement Progress</span>
                          <span className="font-bold text-slate-900">{account.settlementProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${account.settlementProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* 10% Fee Indicator / Plan Pill */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        {account.reservationFeePaid ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>10% Hold Deposit Verified ({formatCurrency(account.reservationFee)})</span>
                          </div>
                        ) : account.reservationFeePending ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                            <Clock3 className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                            <span>10% Deposit Awaiting Staff Verification</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                            <CircleDollarSign className="w-3.5 h-3.5 text-amber-600" />
                            <span>10% Reservation Fee Due: {formatCurrency(account.reservationFee)}</span>
                          </div>
                        )}
                      </div>

                      {/* Pending Review Status */}
                      {plan && plan.status === 'Pending' && (
                        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                            <span className="flex items-center gap-1.5">
                              <Clock3 className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              Waiting for Admin Approval
                            </span>
                            <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded font-mono">
                              {String(plan.planType || '').toLowerCase().includes('part') ? `${plan.numberOfPayments} Parts` : `${plan.numberOfPayments} Installments`}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900/90 leading-relaxed">
                            Your payment plan request is currently under financial review. Once staff configures and approves the applicable terms, you will be invited to review and confirm the finalized schedule.
                          </p>
                        </div>
                      )}

                      {/* Terms Proposed / Awaiting Customer Confirmation */}
                      {plan && (plan.status === 'Plan Ready for Confirmation' || plan.status === 'Terms Proposed') && (
                        <div className="mt-4 p-4 rounded-2xl bg-blue-50/80 border-2 border-blue-300 space-y-3.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                              </span>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                                Plan Ready for Your Confirmation
                              </h4>
                            </div>
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                              Confirmation Required
                            </span>
                          </div>

                          <p className="text-xs text-blue-900/90 leading-relaxed">
                            Management has reviewed your payment plan request and prepared the finalized terms below. Please review the breakdown and accept the terms to confirm and activate your schedule.
                          </p>

                          {/* Proposed Financial Breakdown */}
                          <div className="bg-white rounded-xl p-3.5 border border-blue-200/80 space-y-2 text-xs">
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Apartment Price:</span>
                              <span className="font-bold text-slate-900">{formatCurrency(plan.apartmentPrice || account.totalPrice)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Reservation Fee (Paid):</span>
                              <span className="font-bold text-slate-900">-{formatCurrency(plan.reservationFee || account.reservationFee)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-1">
                              <span>Remaining Principal:</span>
                              <span className="font-bold text-slate-900">{formatCurrency(plan.remainingPrincipal || (account.totalPrice - account.reservationFee))}</span>
                            </div>

                            {!String(plan.planType || '').toLowerCase().includes('part') ? (
                              <>
                                <div className="flex justify-between items-center text-slate-600">
                                  <span>Annual Interest Rate:</span>
                                  <span className="font-bold text-blue-700">{plan.annualInterestRate || 0}%</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                  <span>Interest Amount:</span>
                                  <span className="font-bold text-slate-900">+{formatCurrency(plan.interestAmount || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-900 border-t border-slate-200 pt-1 font-bold">
                                  <span>Total Payable under Plan:</span>
                                  <span className="text-amber-800 font-extrabold text-sm">{formatCurrency(plan.totalPlanAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-900 bg-emerald-50 border border-emerald-200 p-2 rounded-xl font-bold">
                                  <span>Monthly Installment ({plan.numberOfPayments} payments):</span>
                                  <span className="text-emerald-900 font-extrabold text-sm">{formatCurrency(plan.paymentAmount)}/mo</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between items-center text-slate-600">
                                  <span>Additional Amount:</span>
                                  <span className="font-bold text-slate-900">+{formatCurrency(plan.additionalAmount || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-900 border-t border-slate-200 pt-1 font-bold">
                                  <span>Total Payable under Plan:</span>
                                  <span className="text-purple-900 font-extrabold text-sm">{formatCurrency(plan.totalPlanAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-900 bg-emerald-50 border border-emerald-200 p-2 rounded-xl font-bold">
                                  <span>Amount per Part ({plan.numberOfPayments} parts):</span>
                                  <span className="text-emerald-900 font-extrabold text-sm">{formatCurrency(plan.paymentAmount)}/part</span>
                                </div>
                              </>
                            )}

                            {plan.adminNotes && (
                              <div className="text-[11px] text-slate-600 border-t border-slate-100 pt-1.5">
                                <span className="font-bold text-slate-800">Admin Remarks:</span> "{plan.adminNotes}"
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={actingPlanId === plan.id}
                              onClick={() => handleCustomerAcceptPlan(plan.id)}
                              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                            >
                              {actingPlanId === plan.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              <span>Accept & Continue</span>
                            </button>

                            <button
                              type="button"
                              disabled={actingPlanId === plan.id}
                              onClick={() => handleCustomerDeclinePlan(plan.id)}
                              className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                            >
                              <span>Decline</span>
                            </button>
                          </div>

                          <p className="text-[10px] text-slate-500 italic text-center">
                            Please review and accept the payment plan to continue. Installment payments unlock after acceptance.
                          </p>
                        </div>
                      )}

                      {/* Active Payment Plan Items List (Approved) */}
                      {plan && plan.status === 'Approved' && plan.items && plan.items.length > 0 && (
                        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                              Installment Schedule ({plan.items.filter((i) => i.status === 'Paid').length}/{plan.items.length} Paid)
                            </span>
                            <span className="text-[11px] text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                              {!String(plan.planType || '').toLowerCase().includes('part') ? 'Monthly Plan' : 'Part Payment Plan'}
                            </span>
                          </div>

                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {plan.items.map((item) => (
                              <div
                                key={item.id}
                                className="p-2 rounded-xl bg-white border border-slate-200/60 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-bold text-slate-900">
                                    Payment #{item.sequenceNo}
                                  </span>
                                  <span className="text-slate-400 text-[11px] ml-2">
                                    Due {formatDate(item.dueDate)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">
                                    {formatCurrency(Number(item.amount))}
                                  </span>
                                  {item.status === 'Paid' ? (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                      Paid
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handlePlanItemPay(plan, item)}
                                      className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold transition cursor-pointer"
                                    >
                                      Pay Now
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rejected Status Notice */}
                      {plan && plan.status === 'Rejected' && (
                        <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Payment Plan Proposal Declined / Rejected</span>
                          </div>
                          <p className="text-[11px] text-rose-800">
                            {plan.adminNotes
                              ? `Note: ${plan.adminNotes}`
                              : 'You or the administration declined the proposed payment terms. You may submit a new payment plan request or proceed with full balance settlement.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    {!account.isFullyPaid && (
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        {!account.reservationFeePaid && !account.reservationFeePending ? (
                          <>
                            <p className="text-[11px] text-slate-500">
                              Payment options will be available after your reservation payment is approved.
                            </p>
                            <button
                              type="button"
                              onClick={() => openPaymentModal(account, 'ReservationFee')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-2xs shrink-0"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay 10% Deposit</span>
                            </button>
                          </>
                        ) : account.reservationFeePending ? (
                          <div className="w-full flex items-center justify-between gap-2 bg-amber-50/80 border border-amber-200/80 px-3.5 py-2.5 rounded-2xl">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Payment options will be available after your reservation payment is approved.</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded shrink-0">
                              Deposit Pending
                            </span>
                          </div>
                        ) : (!plan || plan.status === 'Rejected') ? (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(account, 'Full')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs ml-auto"
                          >
                            <span>Balance Settlement</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. TRANSACTION HISTORY                                   */}
        {/* ======================================================== */}
        <div id="transaction-history-section" className="space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Transaction History
              </h2>
            </div>
          </div>

          {/* Filter Tabs & Search Controls */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setActiveTab('All')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'All'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <span>All</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {payments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('Verified')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'Verified'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <span>Verified</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'Verified' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {payments.filter((p) => p.status === 'Verified').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('Pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'Pending'
                  ? 'bg-white text-amber-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <span>Pending Review</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'Pending' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                  {payments.filter((p) => p.status === 'Pending').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('Rejected')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'Rejected'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <span>Rejected</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'Rejected' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {payments.filter((p) => p.status === 'Rejected').length}
                </span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[260px] sm:min-w-[320px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by payment ID, type, or apartment..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-hidden transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {loading && payments.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs animate-pulse flex flex-col sm:flex-row justify-between items-center gap-4"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                        <div className="h-3 w-48 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-24 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-2xs space-y-4 max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center mx-auto">
                  <ReceiptText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {searchQuery || activeTab !== 'All'
                      ? 'No matching transactions'
                      : 'No payments recorded yet'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    {searchQuery || activeTab !== 'All'
                      ? 'Try clearing your search query or selecting a different status tab.'
                      : 'Your payment activity will appear here once a deposit or settlement slip is uploaded.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredTransactions.map((payment) => (
                <div
                  key={payment.id}
                  onClick={() => setReceiptTarget(payment)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setReceiptTarget(payment);
                    }
                  }}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-amber-400 hover:bg-amber-50/20 hover:shadow-xs transition duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                >
                  {/* Left Side: Icon & Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-amber-100/70 border border-slate-200 group-hover:border-amber-300 flex items-center justify-center text-slate-700 group-hover:text-amber-900 shrink-0 transition">
                      <Landmark className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-amber-950 transition">
                          {payment.apartmentTitle || 'Skyline Property'}
                        </span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-[11px] font-mono text-slate-400 font-medium">
                          #{payment.id}
                        </span>
                        {payment.proofUrl && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            Slip Attached
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                          {payment.type || 'Direct Bank Settlement'}
                        </span>
                        <span>•</span>
                        <span>{formatDate(payment.uploadedAt)}</span>
                        {payment.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 italic truncate max-w-[200px]">
                              "{payment.notes}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Amount & Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <div className="text-right">
                      <p className="text-base font-bold text-slate-900">
                        {formatCurrency(Number(payment.amount))}
                      </p>
                      <div className="mt-0.5">{getPaymentStatusBadge(payment.status)}</div>
                    </div>

                    <div className="text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition hidden sm:flex items-center pl-1">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 6. REDESIGNED BALANCE SETTLEMENT & 10% FEE MODAL         */}
      {/* ======================================================== */}
      <Modal
        open={paymentModalOpen}
        onClose={() => {
          if (!submittingPayment && !submittingPlan) {
            setPaymentModalOpen(false);
          }
        }}
        title={
          !selectedAccount?.reservationFeePaid
            ? 'Pay 10% Reservation Fee'
            : settlementMode === 'ReservationFee'
              ? 'Pay 10% Reservation Fee'
              : 'Balance Settlement'
        }
        size="lg"
        footer={
          <div className="w-full flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
              disabled={submittingPayment || submittingPlan}
            >
              Cancel
            </Button>

            {!selectedAccount?.reservationFeePaid || settlementMode === 'ReservationFee' ? (
              <button
                type="button"
                onClick={handleFullPayment}
                disabled={submittingPayment}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Submit 10% Deposit Slip</span>
              </button>
            ) : settlementMode === 'Full' ? (
              <button
                type="button"
                onClick={handleFullPayment}
                disabled={submittingPayment}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Submit Balance Slip</span>
              </button>
            ) : settlementMode === 'Installment' ? (
              <button
                type="button"
                onClick={handlePlanRequest}
                disabled={submittingPlan || !!installmentError || !!dateError}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {submittingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Submit Installment Request</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlanRequest}
                disabled={submittingPlan || !!partError || !!dateError}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {submittingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Submit Part Payment Request</span>
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {/* Property Selector if multiple accounts */}
          {propertyAccounts.filter((a) => !a.financiallyClosed && !a.isFullyPaid).length > 1 && (
            <Select
              label="Selected Property Account"
              value={selectedAccountId}
              onChange={(event) => {
                const id = event.target.value;
                setSelectedAccountId(id);
                const account = propertyAccounts.find((item) => item.reservationId === id);
                if (account) {
                  if (!account.reservationFeePaid) {
                    setSettlementMode('ReservationFee');
                    setPaymentAmount(String(account.reservationFee));
                  } else {
                    setPaymentAmount(String(account.remainingBalance));
                  }
                }
              }}
              options={propertyAccounts
                .filter((account) => !account.financiallyClosed && !account.isFullyPaid)
                .map((account) => ({
                  value: account.reservationId,
                  label: `${account.apartmentTitle} (#${account.reservationId}) • ${!account.reservationFeePaid
                    ? formatCurrency(account.reservationFee) + ' deposit due'
                    : formatCurrency(account.remainingBalance) + ' remaining'
                    }`,
                }))}
            />
          )}

          {/* Compact Top Summary (Section 15) */}
          {selectedAccount && (
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {selectedAccount.apartmentTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Reservation #{selectedAccount.reservationId}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {selectedAccount.reservationStatus || 'Reserved'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Total Price</p>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">
                    {formatCurrency(selectedAccount.totalPrice)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 shadow-2xs">
                  <p className="text-[9px] uppercase font-bold text-emerald-700">Paid</p>
                  <p className="font-bold text-emerald-900 mt-0.5 truncate">
                    {formatCurrency(selectedAccount.totalPaid)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 shadow-2xs">
                  <p className="text-[9px] uppercase font-bold text-amber-800">Remaining</p>
                  <p className="font-bold text-amber-950 mt-0.5 truncate">
                    {formatCurrency(selectedAccount.remainingBalance)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settlement Option Switcher */}
          {!selectedAccount?.reservationFeePaid ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BadgePercent className="w-4 h-4 text-amber-700" />
                  <p className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    10% Reservation Hold Deposit
                  </p>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  To secure <strong className="text-slate-900">{selectedAccount?.apartmentTitle}</strong>, please deposit the 10% reservation fee of <strong className="text-slate-900 font-bold">{formatCurrency(selectedAccount?.reservationFee || 0)}</strong>. Once verified, your balance settlement options will unlock.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3.5 flex items-center gap-2 text-xs text-slate-600">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Payment options will be available after your reservation payment is approved.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">
                  Choose Payment Method
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSettlementMode('Full')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${settlementMode === 'Full'
                      ? 'border-amber-400 bg-amber-50/60 shadow-2xs ring-2 ring-amber-400/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <CreditCard className="w-4 h-4 text-slate-700 mb-1" />
                    <p className="text-xs font-bold text-slate-900">Full Settlement</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Pay remaining balance once</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSettlementMode('Installment');
                      setInstallmentError(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${settlementMode === 'Installment'
                      ? 'border-amber-400 bg-amber-50/60 shadow-2xs ring-2 ring-amber-400/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <CalendarDays className="w-4 h-4 text-slate-700 mb-1" />
                    <p className="text-xs font-bold text-slate-900">Installments</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">2–60 monthly payments</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSettlementMode('PartPayment');
                      setPartError(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${settlementMode === 'PartPayment'
                      ? 'border-amber-400 bg-amber-50/60 shadow-2xs ring-2 ring-amber-400/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <Layers3 className="w-4 h-4 text-slate-700 mb-1" />
                    <p className="text-xs font-bold text-slate-900">Part Payment</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Split into 2–5 larger payments</p>
                  </button>
                </div>
              </div>

              {/* Section 16: Clean Installment UI */}
              {settlementMode === 'Installment' && (
                <div className="space-y-3.5 pt-1">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Number of Installments (2–60) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="60"
                        step="1"
                        value={installmentCountInput}
                        onChange={(e) => handleInstallmentCountChange(e.target.value)}
                        className={`w-full px-3.5 py-2 bg-slate-50 focus:bg-white text-xs text-slate-900 rounded-xl border outline-hidden transition ${installmentError ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
                          }`}
                      />
                      {installmentError && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{installmentError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Estimated Monthly Payment
                      </label>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {formatCurrency(calculatedInstallmentAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      First Due Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={getTodayDateString()}
                      value={planStartDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className={`w-full px-3.5 py-2 bg-slate-50 focus:bg-white text-xs text-slate-900 rounded-xl border outline-hidden transition ${dateError ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
                        }`}
                    />
                    {dateError && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{dateError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Optional Note
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Special timeline request or instructions..."
                      value={planNotes}
                      onChange={(e) => setPlanNotes(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-hidden transition"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    Final amount may change if Finance management applies an approved Interest Rate.
                  </p>
                </div>
              )}

              {/* Section 17: Clean Part Payment UI */}
              {settlementMode === 'PartPayment' && (
                <div className="space-y-3.5 pt-1">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Number of Parts (2–5) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="5"
                        step="1"
                        value={partCountInput}
                        onChange={(e) => handlePartCountChange(e.target.value)}
                        className={`w-full px-3.5 py-2 bg-slate-50 focus:bg-white text-xs text-slate-900 rounded-xl border outline-hidden transition ${partError ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
                          }`}
                      />
                      {partError && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{partError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Estimated Amount / Part
                      </label>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {formatCurrency(calculatedPartAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      First Due Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={getTodayDateString()}
                      value={planStartDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className={`w-full px-3.5 py-2 bg-slate-50 focus:bg-white text-xs text-slate-900 rounded-xl border outline-hidden transition ${dateError ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
                        }`}
                    />
                    {dateError && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{dateError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Optional Note
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Special milestone notes or remarks..."
                      value={planNotes}
                      onChange={(e) => setPlanNotes(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-hidden transition"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    Admin/Staff may adjust the payable amount before approval. You will review and confirm the finalized schedule.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Full Payment or Reservation Fee Bank Details & Upload */}
          {(settlementMode === 'Full' || settlementMode === 'ReservationFee') && (
            <div className="space-y-4 pt-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-bold mb-2">
                  <Landmark className="w-4 h-4 text-amber-600" />
                  <span>Beneficiary Escrow Account Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Bank:</span>
                    <p className="font-bold text-slate-900">Commercial Bank PLC</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Branch:</span>
                    <p className="font-bold text-slate-900">Colombo City Centre</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Account Name:</span>
                    <p className="font-bold text-slate-900">Skyline Living Residences (Pvt) Ltd</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Account No:</span>
                    <p className="font-bold text-slate-900 font-mono">1000 8945 2311</p>
                  </div>
                </div>
              </div>

              {/* Upload Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bank Transfer / Deposit Slip Receipt <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleSlipSelected}
                  className="hidden"
                />

                {paymentSlip ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {paymentSlip.name}
                        </p>
                        <p className="text-[10px] text-emerald-700">Receipt attached</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentSlip(null)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl p-5 bg-slate-50 hover:bg-amber-50/30 transition flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="w-5 h-5 text-amber-600 mb-1.5" />
                    <p className="text-xs font-bold text-slate-800">Click to upload deposit slip</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, or PDF up to 5MB</p>
                  </button>
                )}
              </div>

              <Textarea
                label="Transaction Notes / Reference (Optional)"
                rows={2}
                placeholder="Bank transaction reference number or remarks..."
                value={paymentNotes}
                onChange={(event) => setPaymentNotes(event.target.value)}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* 7. TRANSACTION RECORD DETAILS MODAL                      */}
      {/* ======================================================== */}
      <PaymentDetailsModal
        payment={receiptTarget}
        open={!!receiptTarget}
        onClose={() => setReceiptTarget(null)}
      />

      {/* ======================================================== */}
      {/* 8. RESERVATION & REFUND DETAILS MODAL                    */}
      {/* ======================================================== */}
      {viewDetailsReservationId && (
        <ReservationDetailsModal
          reservationId={viewDetailsReservationId}
          open={!!viewDetailsReservationId}
          onClose={() => setViewDetailsReservationId(null)}
        />
      )}

      {/* ======================================================== */}
      {/* 9. CUSTOMER CONFIRM REFUND RECEIVED DIALOG (Section 8)   */}
      {/* ======================================================== */}
      <Modal
        open={!!confirmRefundAccount}
        onClose={() => {
          if (!isConfirmingRefund) {
            setConfirmRefundAccount(null);
          }
        }}
        title="Confirm Refund Received?"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              onClick={() => setConfirmRefundAccount(null)}
              disabled={isConfirmingRefund}
            >
              Not Yet
            </Button>
            <Button
              onClick={handleConfirmRefundReceived}
              disabled={isConfirmingRefund}
              loading={isConfirmingRefund}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Yes, I Received It
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs text-slate-600">
          <p>
            Only confirm this after the refund amount has reached you.
          </p>
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-slate-700">
              <span>Reservation:</span>
              <span className="font-mono font-bold">#{confirmRefundAccount?.reservationId}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Apartment:</span>
              <span className="font-bold text-slate-900">{confirmRefundAccount?.apartmentTitle}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold text-slate-900">
              <span>Refund Amount:</span>
              <span className="text-emerald-700 text-sm font-extrabold">
                {formatCurrency(confirmRefundAccount?.refundAmount || 0)}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* 10. PAY SCHEDULED INSTALLMENT MODAL                      */}
      {/* ======================================================== */}
      <Modal
        open={!!planPayTarget}
        onClose={() => {
          if (!submittingPlanPayment) {
            setPlanPayTarget(null);
            setPlanPaySlip(null);
            setPlanPayNotes('');
          }
        }}
        title="Pay Scheduled Installment"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => {
                setPlanPayTarget(null);
                setPlanPaySlip(null);
                setPlanPayNotes('');
              }}
              disabled={submittingPlanPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={submitPlanItemPayment}
              disabled={submittingPlanPayment || !planPaySlip}
              loading={submittingPlanPayment}
              icon={<Upload className="w-4 h-4" />}
            >
              {submittingPlanPayment ? 'Submitting...' : 'Submit Payment'}
            </Button>
          </div>
        }
      >
        {planPayTarget && (
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl bg-amber-50 border border-amber-200/60 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                  Installment #{planPayTarget.item.sequenceNo}
                </span>
                <span className="font-semibold text-slate-500 text-[11px]">
                  Due {formatDate(planPayTarget.item.dueDate)}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-950 mt-1">
                {formatCurrency(Number(planPayTarget.item.amount))}
              </p>
              <p className="text-slate-600 mt-1 font-medium">
                {planPayTarget.plan.apartmentTitle}
              </p>
            </div>

            {/* Bank details */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[11px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Bank:</span>
                  <p className="font-bold text-slate-900">Commercial Bank PLC</p>
                </div>
                <div>
                  <span className="text-slate-400">Account No:</span>
                  <p className="font-bold text-slate-900 font-mono">1000 8945 2311</p>
                </div>
              </div>
            </div>

            {/* Upload Slip */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Bank Transfer Receipt Slip <span className="text-rose-500">*</span>
              </label>
              <input
                ref={planSlipInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handlePlanSlipSelected}
                className="hidden"
              />

              {planPaySlip ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {planPaySlip.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlanPaySlip(null)}
                    className="p-1 rounded text-red-600 hover:bg-red-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => planSlipInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl p-4 bg-slate-50 hover:bg-amber-50/30 transition flex flex-col items-center cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-amber-600 mb-1" />
                  <p className="text-xs font-bold text-slate-800">Attach bank transfer receipt</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG or PDF up to 5MB</p>
                </button>
              )}
            </div>

            <Textarea
              label="Transaction Notes (Optional)"
              placeholder="e.g. Bank reference or transaction date"
              value={planPayNotes}
              onChange={(e) => setPlanPayNotes(e.target.value)}
              rows={2}
            />
          </div>
        )}
      </Modal>

    </div>
  );
}