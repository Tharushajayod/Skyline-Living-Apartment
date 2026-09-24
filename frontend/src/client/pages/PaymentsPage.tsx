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
import EmptyState from '@/shared/components/ui/EmptyState';

import {
  Input,
  Select,
  Textarea,
} from '@/shared/components/ui/Form';

import {
  formatCurrency,
  formatDate,
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
  plan?: PaymentPlan;
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
     PLAN REQUEST STATE
     ----------------------------- */
  const [planPaymentAmount, setPlanPaymentAmount] = useState('');
  const [planPaymentCount, setPlanPaymentCount] = useState(6);
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
      // Use getByCustomer instead of fetching the entire database
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
     PROPERTY ACCOUNTS DERIVATION
     ========================================================= */
  const propertyAccounts: PropertyAccount[] = useMemo(() => {
    return reservations.map((reservation) => {
      const apartment = apartments.find(
        (item) => item.id === reservation.apartmentId || item.title === reservation.apartmentTitle
      );

      const propertyPayments = payments.filter((payment) => {
        const sameApartment =
          payment.apartmentId === reservation.apartmentId ||
          payment.apartmentTitle === reservation.apartmentTitle;
        return sameApartment && payment.status === 'Verified';
      });

      const totalPaid = propertyPayments.reduce(
        (total, payment) => total + (Number(payment.amount) || 0),
        0
      );

      const totalPrice = Number(apartment?.price || 0);
      const remainingBalance = Math.max(0, totalPrice - totalPaid);

      const isFullyPaid = totalPrice > 0 && totalPaid >= totalPrice;

      const feePayments = payments.filter(
        (p) =>
          (p.apartmentId === reservation.apartmentId ||
            p.apartmentTitle === reservation.apartmentTitle) &&
          (p.type === 'RESERVATION_FEE' || p.type === 'Reservation Fee')
      );

      const reservationFeePaid = feePayments.some((p) => p.status === 'Verified');
      const reservationFeePending =
        !reservationFeePaid && feePayments.some((p) => p.status === 'Pending');

      const matchingPlan = plans.find(
        (plan) =>
          (plan.reservationId === reservation.id ||
            plan.apartmentId === reservation.apartmentId) &&
          (plan.status === 'Approved' || plan.status === 'Pending')
      );

      return {
        reservationId: reservation.id,
        apartmentId: reservation.apartmentId,
        apartmentTitle: reservation.apartmentTitle,
        totalPrice,
        totalPaid,
        remainingBalance,
        reservationFee: Number(reservation.reservationFee || 0),
        reservationFeePaid,
        reservationFeePending,
        reservationStatus: reservation.status,
        apartmentStatus: apartment?.status,
        isFullyPaid,
        plan: matchingPlan,
      };
    });
  }, [reservations, apartments, payments, plans]);

  const selectedAccount = useMemo(() => {
    return propertyAccounts.find((account) => account.reservationId === selectedAccountId);
  }, [propertyAccounts, selectedAccountId]);

  // Financial KPIs
  const financialStats = useMemo(() => {
    const verifiedPayments = payments.filter((p) => p.status === 'Verified');
    const pendingPayments = payments.filter((p) => p.status === 'Pending');
    const totalPaidAll = verifiedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalPendingAll = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalOutstandingAll = propertyAccounts.reduce(
      (sum, acc) => sum + acc.remainingBalance,
      0
    );

    return {
      totalPaid: totalPaidAll,
      totalPending: totalPendingAll,
      totalOutstanding: totalOutstandingAll,
      verifiedCount: verifiedPayments.length,
      pendingCount: pendingPayments.length,
      accountsCount: propertyAccounts.length,
    };
  }, [payments, propertyAccounts]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return payments.filter((payment) => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === 'Verified') {
        matchesTab = payment.status === 'Verified';
      } else if (activeTab === 'Pending') {
        matchesTab = payment.status === 'Pending';
      } else if (activeTab === 'Rejected') {
        matchesTab = payment.status === 'Rejected';
      }

      // Search filter
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
     AUTO-PAY HANDLER FROM RESERVATIONS PAGE
     ========================================================= */
  const autoPayReservationId = (location.state as { autoPayReservationId?: string })
    ?.autoPayReservationId;
  const autoPayHandled = useRef(false);

  useEffect(() => {
    if (autoPayHandled.current || !autoPayReservationId || propertyAccounts.length === 0) return;
    const match = propertyAccounts.find(
      (a) =>
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
    setSelectedAccountId(account.reservationId);
    setSettlementMode(mode);

    if (mode === 'ReservationFee') {
      setPaymentAmount(String(account.reservationFee));
    } else {
      setPaymentAmount(String(account.remainingBalance));
    }

    setPlanPaymentAmount(String(Math.ceil(account.remainingBalance / planPaymentCount)));
    setPaymentSlip(null);
    setPaymentNotes('');
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
    if (!selectedAccount) {
      toast('Please select a property account.', 'error');
      return;
    }

    const amount = Number(planPaymentAmount);
    if (!amount || amount <= 0) {
      toast('Enter a valid payment amount.', 'error');
      return;
    }

    if (!planPaymentCount || planPaymentCount < 2) {
      toast('A payment plan must contain at least 2 installments.', 'error');
      return;
    }

    if (!planStartDate) {
      toast('Please select the first due date.', 'error');
      return;
    }

    const existingActivePlan = plans.find(
      (plan) =>
        plan.reservationId === selectedAccount.reservationId &&
        (plan.status === 'Pending' || plan.status === 'Approved')
    );

    if (existingActivePlan) {
      toast(
        `This property already has an active ${existingActivePlan.status.toLowerCase()} payment plan.`,
        'error'
      );
      return;
    }

    setSubmittingPlan(true);

    try {
      await paymentPlanService.create({
        reservationId: selectedAccount.reservationId,
        planType: settlementMode === 'Installment' ? 'INSTALLMENT' : 'PART_PAYMENT',
        numberOfPayments: planPaymentCount,
        paymentAmount: amount,
        startDate: planStartDate,
        notes: planNotes || undefined,
      });

      toast(
        'Payment plan request submitted. No payment is required until the plan is reviewed and approved.',
        'success'
      );

      setPaymentModalOpen(false);
      await loadData();
    } catch (error: any) {
      toast(error?.message || 'Unable to submit payment plan.', 'error');
    } finally {
      setSubmittingPlan(false);
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
      {/* 1. COMPACT PAGE HEADER (REPLACING THE LARGE DARK BOX)    */}
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

              {propertyAccounts.some((a) => !a.isFullyPaid) && (
                <button
                  type="button"
                  onClick={() => {
                    const acc = propertyAccounts.find((item) => !item.isFullyPaid);
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
      {/* MAIN FINANCIAL CANVAS */}
      {/* ======================================================== */}
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        
        {/* ======================================================== */}
        {/* 2. FINANCIAL OVERVIEW KPI ROW (Compact Summary Cards) */}
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reserved Units</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5">
                {financialStats.accountsCount} {financialStats.accountsCount === 1 ? 'Unit' : 'Units'}
              </p>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* 3. ERROR BANNER IF ANY */}
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
        {/* 4. PROPERTY PROGRESS & SETTLEMENT ACCOUNTS SECTION      */}
        {/* ======================================================== */}
        {propertyAccounts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Property Settlement Balances
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time escrow reconciliation, hold deposits, and active installment schedules.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {propertyAccounts.map((account) => {
                const paidPercent =
                  account.totalPrice > 0
                    ? Math.min(100, Math.round((account.totalPaid / account.totalPrice) * 100))
                    : 0;
                const plan = account.plan;

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
                          <span className="font-bold text-slate-900">{paidPercent}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${paidPercent}%` }}
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

                      {/* Active Payment Plan Items List (if applicable) */}
                      {plan && plan.status === 'Approved' && plan.items && plan.items.length > 0 && (
                        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                              Installment Schedule ({plan.items.filter((i) => i.status === 'Paid').length}/{plan.items.length} Paid)
                            </span>
                            <span className="text-[11px] text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                              {plan.planType === 'INSTALLMENT' ? 'Monthly Plan' : 'Part Payment Plan'}
                            </span>
                          </div>

                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
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
                    </div>

                    {/* Bottom Actions */}
                    {!account.isFullyPaid && (
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                        {!account.reservationFeePaid && !account.reservationFeePending ? (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(account, 'ReservationFee')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-2xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay 10% Deposit</span>
                          </button>
                        ) : !plan ? (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(account, 'Full')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
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
        {/* 5. TRANSACTION HISTORY (MAIN FOCUS OF PAGE)             */}
        {/* ======================================================== */}
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Transaction History
              </h2>
              <p className="text-xs text-slate-500">
                Audit log of all verified bank transfers, hold fees, and pending receipts.
              </p>
            </div>
          </div>

          {/* Filter Tabs & Search Controls */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setActiveTab('All')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'All'
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'Verified'
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'Pending'
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'Rejected'
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
              /* Skeleton Loader */
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
              /* Empty State */
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
              /* Transactions Rows */
              filteredTransactions.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left Side: Icon & Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <Landmark className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-slate-900">
                          {payment.apartmentTitle || 'Skyline Property'}
                        </span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-[11px] font-mono text-slate-400 font-medium">
                          #{payment.id}
                        </span>
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

                  {/* Right Side: Amount & Status & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <div className="text-right">
                      <p className="text-base font-bold text-slate-900">
                        {formatCurrency(Number(payment.amount))}
                      </p>
                      <div className="mt-0.5">{getPaymentStatusBadge(payment.status)}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setReceiptTarget(payment)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                      title="View transaction receipt details"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Record</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 6. BALANCE SETTLEMENT & 10% FEE MODAL                    */}
      {/* ======================================================== */}
      <Modal
        open={paymentModalOpen}
        onClose={() => {
          if (!submittingPayment && !submittingPlan) {
            setPaymentModalOpen(false);
          }
        }}
        title={
          settlementMode === 'ReservationFee'
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

            {settlementMode === 'Full' || settlementMode === 'ReservationFee' ? (
              <button
                type="button"
                onClick={handleFullPayment}
                disabled={submittingPayment}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {submittingPayment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>
                  {settlementMode === 'ReservationFee'
                    ? 'Submit 10% Deposit Slip'
                    : 'Submit Balance Slip'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlanRequest}
                disabled={submittingPlan}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {submittingPlan ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>Submit Plan Request</span>
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-5">
          {/* Property Selector */}
          {propertyAccounts.length > 0 && (
            <Select
              label="Selected Property Account"
              value={selectedAccountId}
              onChange={(event) => {
                const id = event.target.value;
                setSelectedAccountId(id);
                const account = propertyAccounts.find((item) => item.reservationId === id);
                if (account) {
                  setPaymentAmount(
                    String(
                      settlementMode === 'ReservationFee'
                        ? account.reservationFee
                        : account.remainingBalance
                    )
                  );
                  setPlanPaymentAmount(
                    String(Math.ceil(account.remainingBalance / planPaymentCount))
                  );
                }
              }}
              options={propertyAccounts
                .filter((account) => !account.isFullyPaid)
                .map((account) => ({
                  value: account.reservationId,
                  label: `${account.apartmentTitle} • ${
                    settlementMode === 'ReservationFee'
                      ? formatCurrency(account.reservationFee) + ' reservation deposit'
                      : formatCurrency(account.remainingBalance) + ' remaining'
                  }`,
                }))}
            />
          )}

          {/* Account Balance Summary */}
          {selectedAccount && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">
                    {selectedAccount.apartmentTitle}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Reservation #{selectedAccount.reservationId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Total Price</p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {formatCurrency(selectedAccount.totalPrice)}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[9px] uppercase font-bold text-emerald-700">Verified</p>
                  <p className="font-bold text-emerald-900 mt-0.5">
                    {formatCurrency(selectedAccount.totalPaid)}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-[9px] uppercase font-bold text-amber-800">Remaining</p>
                  <p className="font-bold text-amber-950 mt-0.5">
                    {formatCurrency(selectedAccount.remainingBalance)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settlement Option Switcher */}
          {settlementMode === 'ReservationFee' ? (
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
          ) : (
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">
                Settlement Structure:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSettlementMode('Full')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    settlementMode === 'Full'
                      ? 'border-amber-400 bg-amber-50/50 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-slate-700 mb-1" />
                  <p className="text-xs font-bold text-slate-900">Full Settlement</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Clear remaining balance</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSettlementMode('Installment')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    settlementMode === 'Installment'
                      ? 'border-amber-400 bg-amber-50/50 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-slate-700 mb-1" />
                  <p className="text-xs font-bold text-slate-900">Installment Plan</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Monthly schedule</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSettlementMode('PartPayment')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    settlementMode === 'PartPayment'
                      ? 'border-amber-400 bg-amber-50/50 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Layers3 className="w-4 h-4 text-slate-700 mb-1" />
                  <p className="text-xs font-bold text-slate-900">Part Payment</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Agreed milestone parts</p>
                </button>
              </div>
            </div>
          )}

          {/* Full Payment or Reservation Fee Bank Details & Upload */}
          {(settlementMode === 'Full' || settlementMode === 'ReservationFee') && (
            <div className="space-y-4">
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

          {/* Installment Plan Request Form */}
          {(settlementMode === 'Installment' || settlementMode === 'PartPayment') && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  No payment slip is required now. Submit your proposed schedule. Once reviewed and approved by the finance team, your scheduled payments will appear here.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Proposed Installment Amount (Rs.)"
                  type="number"
                  min="1"
                  value={planPaymentAmount}
                  onChange={(event) => setPlanPaymentAmount(event.target.value)}
                />

                <Input
                  label="Number of Installments"
                  type="number"
                  min="2"
                  value={planPaymentCount}
                  onChange={(event) => {
                    const count = Math.max(2, Number(event.target.value) || 2);
                    setPlanPaymentCount(count);
                    if (selectedAccount?.remainingBalance) {
                      setPlanPaymentAmount(
                        String(Math.floor(selectedAccount.remainingBalance / count))
                      );
                    }
                  }}
                />

                <Input
                  label="First Due Date"
                  type="date"
                  value={planStartDate}
                  onChange={(event) => setPlanStartDate(event.target.value)}
                />
              </div>

              <Textarea
                label="Plan Request Notes (Optional)"
                rows={2}
                placeholder="Describe your requested payment timeline..."
                value={planNotes}
                onChange={(event) => setPlanNotes(event.target.value)}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* 7. TRANSACTION RECORD DETAILS MODAL                      */}
      {/* ======================================================== */}
      <Modal
        open={!!receiptTarget}
        onClose={() => setReceiptTarget(null)}
        title="Payment Record Details"
        size="md"
      >
        {receiptTarget && (
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-slate-400 text-[11px]">Payment Transaction ID</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">#{receiptTarget.id}</p>
                </div>
                {getPaymentStatusBadge(receiptTarget.status)}
              </div>

              <div className="border-t border-slate-200 mt-3 pt-3">
                <p className="text-[11px] text-slate-400">Total Settled Amount</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {formatCurrency(Number(receiptTarget.amount))}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Payment Category</p>
                <p className="font-bold text-slate-900 mt-0.5">{receiptTarget.type}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Submission Date</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {formatDate(receiptTarget.uploadedAt)}
                </p>
              </div>

              {receiptTarget.verifiedAt && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] uppercase font-bold text-emerald-700">Verified Date</p>
                  <p className="font-bold text-emerald-900 mt-0.5">
                    {formatDate(receiptTarget.verifiedAt)}
                  </p>
                </div>
              )}

              {receiptTarget.verifiedBy && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Verified By</p>
                  <p className="font-bold text-slate-900 mt-0.5">{receiptTarget.verifiedBy}</p>
                </div>
              )}
            </div>

            {receiptTarget.notes && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Notes & Reference</p>
                <p className="text-slate-700 mt-0.5 italic">"{receiptTarget.notes}"</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* 8. PAY SCHEDULED INSTALLMENT MODAL                       */}
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