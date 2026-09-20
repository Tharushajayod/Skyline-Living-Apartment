import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
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

const tabFilters = [
  'Overview',
  'Outstanding',
  'History',
] as const;

type TabType = (typeof tabFilters)[number];

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
   HELPERS
   ========================================================= */

const getToken = () =>
  localStorage.getItem('auth_token') ||
  localStorage.getItem('token') ||
  sessionStorage.getItem('token');

const getStatusClasses = (status?: string) => {
  switch (status) {
    case 'Verified':
    case 'Paid':
    case 'Completed':
    case 'Approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    case 'Pending':
    case 'Pending Verification':
    case 'Upcoming':
      return 'bg-amber-50 text-amber-800 border-amber-200';

    case 'Rejected':
    case 'Cancelled':
      return 'bg-red-50 text-red-700 border-red-200';

    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const formatPlanType = (type?: string) => {
  if (!type) return 'Payment Plan';

  if (
    type === 'INSTALLMENT' ||
    type === 'Installment Plan'
  ) {
    return 'Installment Plan';
  }

  if (
    type === 'PART_PAYMENT' ||
    type === 'Part Payment Plan'
  ) {
    return 'Part Payment Plan';
  }

  return type;
};

/* =========================================================
   COMPONENT
   ========================================================= */

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  /* -----------------------------
     DATA
     ----------------------------- */

  const [payments, setPayments] = useState<Payment[]>(() => (user?.email ? paymentService.getCachedByCustomer(user.email) : null) || []);
  const [plans, setPlans] = useState<PaymentPlan[]>(() => (user?.email ? paymentPlanService.getCachedAll(user.email) : null) || []);
  const [reservations, setReservations] = useState<Reservation[]>(() => reservationService.getCachedAll() || []);
  const [apartments, setApartments] = useState<Apartment[]>(() => apartmentService.getCached() || []);

  const [loading, setLoading] = useState(!user?.email || !(paymentService.getCachedByCustomer(user.email) && reservationService.getCachedAll()));

  /* -----------------------------
     PAGE
     ----------------------------- */

  const [activeTab, setActiveTab] =
    useState<TabType>('Overview');

  const [selectedAccountId, setSelectedAccountId] =
    useState('');

  /* -----------------------------
     PAYMENT MODAL
     ----------------------------- */

  const [paymentModalOpen, setPaymentModalOpen] =
    useState(false);

  const [settlementMode, setSettlementMode] =
    useState<SettlementMode>('Full');

  const [paymentAmount, setPaymentAmount] =
    useState('');

  const [paymentNotes, setPaymentNotes] =
    useState('');

  const [paymentSlip, setPaymentSlip] =
    useState<File | null>(null);

  const [submittingPayment, setSubmittingPayment] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  /* -----------------------------
     PLAN REQUEST
     ----------------------------- */

  const [planPaymentAmount, setPlanPaymentAmount] =
    useState('');

  const [planPaymentCount, setPlanPaymentCount] =
    useState(6);

  const [planStartDate, setPlanStartDate] =
    useState('');

  const [planNotes, setPlanNotes] =
    useState('');

  const [submittingPlan, setSubmittingPlan] =
    useState(false);

  /* -----------------------------
     RECEIPT
     ----------------------------- */

  const [receiptTarget, setReceiptTarget] =
    useState<Payment | null>(null);

  const [planPayTarget, setPlanPayTarget] = useState<{
    plan: PaymentPlan;
    item: NonNullable<PaymentPlan['items']>[number];
  } | null>(null);
  const [planPaySlip, setPlanPaySlip] = useState<File | null>(null);
  const [planPayNotes, setPlanPayNotes] = useState('');
  const [submittingPlanPayment, setSubmittingPlanPayment] = useState(false);
  const planSlipInputRef = useRef<HTMLInputElement>(null);

  /* =========================================================
     LOAD DATA
     ========================================================= */

  const loadData = async (showSpinner = false) => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    if (showSpinner) {
      setLoading(true);
    }

    try {
      const [
        paymentData,
        reservationData,
        apartmentData,
        planData,
      ] = await Promise.all([
        paymentService
          .getByCustomer(user.email)
          .catch(() => []),

        reservationService
          .getAll()
          .catch(() => []),

        apartmentService
          .getAll()
          .catch(() => []),

        paymentPlanService
          .getAll(user.email)
          .catch(() => []),
      ]);

      setPayments(
        Array.isArray(paymentData)
          ? paymentData
          : [],
      );

      const myReservations =
        Array.isArray(reservationData)
          ? reservationData.filter(
              (reservation) =>
                reservation.customerEmail?.toLowerCase() ===
                user.email?.toLowerCase(),
            )
          : [];

      setReservations(myReservations);

      setApartments(
        Array.isArray(apartmentData)
          ? apartmentData
          : [],
      );

      setPlans(
        Array.isArray(planData)
          ? planData
          : [],
      );
    } catch (error) {
      console.error(
        'Failed to load payment information:',
        error,
      );

      toast(
        'Unable to load payment information.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasCache = user?.email && paymentService.getCachedByCustomer(user.email) && reservationService.getCachedAll();
    loadData(!hasCache);
  }, [user?.email]);

  /* =========================================================
     PROPERTY ACCOUNTS
     ========================================================= */

  const propertyAccounts: PropertyAccount[] =
    useMemo(() => {
      return reservations.map((reservation) => {
        const apartment = apartments.find(
          (item) =>
            item.id === reservation.apartmentId ||
            item.title ===
              reservation.apartmentTitle,
        );

        const propertyPayments =
          payments.filter((payment) => {
            const sameApartment =
              payment.apartmentId ===
                reservation.apartmentId ||
              payment.apartmentTitle ===
                reservation.apartmentTitle;

            return (
              sameApartment &&
              payment.status === 'Verified'
            );
          });

        const totalPaid =
          propertyPayments.reduce(
            (total, payment) =>
              total +
              (Number(payment.amount) || 0),
            0,
          );

        const totalPrice =
          Number(apartment?.price || 0);

        const remainingBalance = Math.max(
          totalPrice - totalPaid,
          0,
        );

        const pendingResFeePayment = payments.find((payment) => {
          const sameApartment =
            payment.apartmentId === reservation.apartmentId ||
            payment.apartmentTitle === reservation.apartmentTitle ||
            payment.reservationId === reservation.id;

          const isResFee =
            payment.type === 'Reservation Fee' ||
            String(payment.type).toLowerCase().includes('reservation');

          return (
            sameApartment &&
            isResFee &&
            (payment.status === 'Pending' || payment.status === 'Pending Verification')
          );
        });

        const reservationFeePaid =
          reservation.status === 'Confirmed' ||
          reservation.status === 'Approved' ||
          propertyPayments.some(
            (payment) =>
              payment.type === 'Reservation Fee' ||
              String(payment.type).toLowerCase().includes('reservation'),
          );

        const reservationFeePending = !reservationFeePaid && !!pendingResFeePayment;

        const relatedPlans = plans
          .filter(
            (plan) =>
              plan.reservationId ===
                reservation.id ||
              plan.apartmentId ===
                reservation.apartmentId,
          )
          .sort((a, b) => {
            return (
              new Date(
                b.createdAt || 0,
              ).getTime() -
              new Date(
                a.createdAt || 0,
              ).getTime()
            );
          });

        const activePlan =
          relatedPlans.find(
            (plan) =>
              plan.status === 'Approved',
          ) ||
          relatedPlans.find(
            (plan) =>
              plan.status === 'Pending',
          ) ||
          relatedPlans.find(
            (plan) =>
              plan.status === 'Completed',
          );

        return {
          reservationId: reservation.id,
          apartmentId:
            reservation.apartmentId,
          apartmentTitle:
            reservation.apartmentTitle,

          totalPrice,
          totalPaid,
          remainingBalance,

          reservationFee:
            Number(
              reservation.reservationFee ||
                totalPrice * 0.1,
            ),

          reservationFeePaid,
          reservationFeePending,

          reservationStatus:
            reservation.status,

          apartmentStatus:
            apartment?.status,

          isFullyPaid:
            remainingBalance <= 0,

          plan: activePlan,
        };
      });
    }, [
      reservations,
      apartments,
      payments,
      plans,
    ]);

  const selectedAccount = useMemo(
    () =>
      propertyAccounts.find(
        (account) =>
          account.reservationId ===
          selectedAccountId,
      ),
    [propertyAccounts, selectedAccountId],
  );

  /* =========================================================
     SUMMARY
     ========================================================= */

  const summary = useMemo(() => {
    const totalPropertyValue =
      propertyAccounts.reduce(
        (sum, account) =>
          sum + account.totalPrice,
        0,
      );

    const totalPaid =
      propertyAccounts.reduce(
        (sum, account) =>
          sum + account.totalPaid,
        0,
      );

    const remaining =
      propertyAccounts.reduce(
        (sum, account) =>
          sum + account.remainingBalance,
        0,
      );

    const pendingVerification =
      payments.filter(
        (payment) =>
          payment.status === 'Pending',
      ).length;

    return {
      totalPropertyValue,
      totalPaid,
      remaining,
      pendingVerification,
    };
  }, [propertyAccounts, payments]);

  /* =========================================================
     PAYMENT LISTS
     ========================================================= */

  const outstandingPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.status === 'Pending',
      ),
    [payments],
  );

  const historyPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.status === 'Verified' ||
          payment.status === 'Rejected',
      ),
    [payments],
  );

  /* =========================================================
     MODAL
     ========================================================= */

  const openPaymentModal = (
    account: PropertyAccount,
    mode: SettlementMode = 'Full',
  ) => {
    setSelectedAccountId(
      account.reservationId,
    );

    setSettlementMode(mode);

    setPaymentSlip(null);
    setPaymentNotes('');
    setPlanNotes('');

    if (mode === 'ReservationFee') {
      setPaymentAmount(
        String(account.reservationFee),
      );
    } else {
      setPaymentAmount(
        String(account.remainingBalance),
      );
    }

    const defaultCount = 6;

    setPlanPaymentCount(defaultCount);

    setPlanPaymentAmount(
      account.remainingBalance > 0
        ? String(
            Math.floor(
              account.remainingBalance /
                defaultCount,
            ),
          )
        : '',
    );

    const nextMonth = new Date();

    nextMonth.setMonth(
      nextMonth.getMonth() + 1,
    );

    setPlanStartDate(
      nextMonth
        .toISOString()
        .split('T')[0],
    );

    setPaymentModalOpen(true);
  };

  useEffect(() => {
    if (!selectedAccount) return;

    if (settlementMode === 'ReservationFee') {
      setPaymentAmount(
        String(
          selectedAccount.reservationFee,
        ),
      );
    } else if (settlementMode === 'Full') {
      setPaymentAmount(
        String(
          selectedAccount.remainingBalance,
        ),
      );
    }
  }, [
    settlementMode,
    selectedAccountId,
    selectedAccount?.remainingBalance,
    selectedAccount?.reservationFee,
  ]);

  const location = useLocation();
  const autoPayHandled = useRef(false);
  const autoPayReservationId = (location.state as { autoPayReservationId?: string })?.autoPayReservationId;

  useEffect(() => {
    if (autoPayHandled.current || !autoPayReservationId || propertyAccounts.length === 0) return;
    const target = propertyAccounts.find(
      (a) => (a.reservationId === autoPayReservationId || a.apartmentId === autoPayReservationId) && !a.reservationFeePaid
    );
    if (target) {
      autoPayHandled.current = true;
      openPaymentModal(target, 'ReservationFee');
    }
  }, [autoPayReservationId, propertyAccounts]);

  /* =========================================================
     PAYMENT SUBMISSION (RESERVATION FEE / FULL PAYMENT)
     ========================================================= */

  const handleFullPayment = async () => {
    if (!selectedAccount) {
      toast(
        'Please select a property.',
        'error',
      );
      return;
    }

    const isResFee = settlementMode === 'ReservationFee';

    if (
      !isResFee &&
      selectedAccount.remainingBalance <= 0
    ) {
      toast(
        'This property is already fully paid.',
        'error',
      );
      return;
    }

    if (!paymentSlip) {
      toast(
        isResFee
          ? 'Please attach the bank transfer receipt for the 10% reservation fee.'
          : 'Please attach the bank transfer receipt.',
        'error',
      );
      return;
    }

    setSubmittingPayment(true);

    try {
      const payload = {
        reservationId:
          selectedAccount.reservationId,

        apartmentId:
          selectedAccount.apartmentId,

        type: isResFee ? 'RESERVATION_FEE' : 'FULL_PAYMENT',

        amount: isResFee
          ? selectedAccount.reservationFee
          : selectedAccount.remainingBalance,

        notes:
          paymentNotes ||
          (isResFee
            ? '10% Reservation fee hold deposit'
            : 'Full remaining balance payment'),
      };

      const createdPayment = await paymentService.create(payload);

      const formData = new FormData();
      formData.append('file', paymentSlip);

      await paymentService.uploadProof(createdPayment.id, formData);

      toast(
        isResFee
          ? '10% Reservation fee submitted successfully! It is now waiting for staff verification.'
          : 'Full payment submitted successfully. It is now waiting for staff verification.',
        'success',
      );

      setPaymentModalOpen(false);
      setPaymentSlip(null);
      setPaymentNotes('');

      await loadData();
    } catch (error: any) {
      toast(
        error?.message ||
          'Payment submission failed.',
        'error',
      );
    } finally {
      setSubmittingPayment(false);
    }
  };

  /* =========================================================
     PLAN REQUEST
     ========================================================= */

  const handlePlanRequest = async () => {
    if (!selectedAccount) {
      toast(
        'Please select a property.',
        'error',
      );
      return;
    }

    const amount = Number(
      planPaymentAmount,
    );

    if (
      !amount ||
      amount <= 0
    ) {
      toast(
        'Enter a valid payment amount.',
        'error',
      );
      return;
    }

    if (
      !planPaymentCount ||
      planPaymentCount < 2
    ) {
      toast(
        'A payment plan must contain at least 2 payments.',
        'error',
      );
      return;
    }

    if (!planStartDate) {
      toast(
        'Please select the first due date.',
        'error',
      );
      return;
    }

    const existingActivePlan =
      plans.find(
        (plan) =>
          plan.reservationId ===
            selectedAccount.reservationId &&
          (plan.status === 'Pending' ||
            plan.status === 'Approved'),
      );

    if (existingActivePlan) {
      toast(
        `This property already has a ${existingActivePlan.status.toLowerCase()} payment plan.`,
        'error',
      );
      return;
    }

    setSubmittingPlan(true);

    try {
      await paymentPlanService.create({
        reservationId:
          selectedAccount.reservationId,

        planType:
          settlementMode ===
          'Installment'
            ? 'INSTALLMENT'
            : 'PART_PAYMENT',

        numberOfPayments:
          planPaymentCount,

        paymentAmount: amount,

        startDate:
          planStartDate,

        notes:
          planNotes || undefined,
      });

      toast(
        'Payment plan request submitted. No payment is required until the plan is approved.',
        'success',
      );

      setPaymentModalOpen(false);

      await loadData();
    } catch (error: any) {
      toast(
        error?.message ||
          'Unable to submit payment plan.',
        'error',
      );
    } finally {
      setSubmittingPlan(false);
    }
  };

  /* =========================================================
     APPROVED PLAN PAYMENT
     ========================================================= */

  const handlePlanItemPay = (
    plan: PaymentPlan,
    item: NonNullable<PaymentPlan['items']>[number],
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

      toast('Payment submitted. It is waiting for staff verification.', 'success');
      setPlanPayTarget(null);
      setPlanPaySlip(null);
      setPlanPayNotes('');
      await loadData();
    } catch (error: any) {
      toast(error?.message || 'Unable to submit scheduled payment.', 'error');
    } finally {
      setSubmittingPlanPayment(false);
    }
  };

  /* =========================================================
     FILE
     ========================================================= */

  const handleSlipSelected = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast(
        'Receipt file must be 5MB or smaller.',
        'error',
      );
      return;
    }

    setPaymentSlip(file);
  };

  const handlePlanSlipSelected = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast('Receipt file must be 5MB or smaller.', 'error');
      return;
    }

    setPlanPaySlip(file);
  };

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>

          <div className="text-center">
            <p className="text-sm font-extrabold text-slate-900">
              Loading Payment Center
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Preparing your property
              accounts...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

      {/* =====================================================
          HERO
          ===================================================== */}

      <div className="relative overflow-hidden rounded-[28px] bg-slate-950 text-white mb-7 shadow-xl shadow-slate-900/10">

        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-amber-400/5 blur-3xl" />

        <div className="relative p-6 sm:p-8">

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

            <div className="max-w-2xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 mb-4">

                <ShieldCheck className="w-3.5 h-3.5" />

                SECURE PROPERTY PAYMENT CENTER
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">

                Payments &{' '}

                <span className="text-amber-400">
                  Settlements
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-xl leading-relaxed">

                Track verified payments,
                remaining balances and
                approved payment plans for
                your Skyline Living
                residences.
              </p>

            </div>

            {propertyAccounts.some(
              (account) =>
                !account.isFullyPaid &&
                !account.plan,
            ) && (
              <button
                type="button"
                onClick={() => {
                  const account =
                    propertyAccounts.find(
                      (item) =>
                        !item.isFullyPaid &&
                        !item.plan,
                    );

                  if (account) {
                    openPaymentModal(
                      account,
                    );
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-extrabold text-sm transition shadow-lg shadow-amber-500/10"
              >
                <Plus className="w-4 h-4" />

                Settle Balance
              </button>
            )}

          </div>
        </div>
      </div>

      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">

        <SummaryCard
          icon={
            <Building2 className="w-5 h-5" />
          }
          label="Property Value"
          value={formatCurrency(
            summary.totalPropertyValue,
          )}
          description={`${propertyAccounts.length} active ${
            propertyAccounts.length === 1
              ? 'property'
              : 'properties'
          }`}
        />

        <SummaryCard
          icon={
            <CheckCircle2 className="w-5 h-5" />
          }
          label="Verified Paid"
          value={formatCurrency(
            summary.totalPaid,
          )}
          description="Confirmed by staff"
          accent="green"
        />

        <SummaryCard
          icon={
            <WalletCards className="w-5 h-5" />
          }
          label="Remaining"
          value={formatCurrency(
            summary.remaining,
          )}
          description="Across all properties"
          accent="amber"
        />

        <SummaryCard
          icon={
            <Clock3 className="w-5 h-5" />
          }
          label="Awaiting Audit"
          value={String(
            summary.pendingVerification,
          )}
          description="Payment submissions"
        />

      </div>

      {/* =====================================================
          TABS
          ===================================================== */}

      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1.5 mb-6 w-full sm:w-fit">

        {tabFilters.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() =>
              setActiveTab(tab)
            }
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === tab
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}

      </div>

      {/* =====================================================
          OVERVIEW
          ===================================================== */}

      {activeTab === 'Overview' && (
        <div className="space-y-6">

          {propertyAccounts.length ===
          0 ? (
            <EmptyState
              icon={<Building2 className="w-12 h-12 text-navy-300" />}
              title="No property payment accounts"
              description="A payment account will appear after you place a reservation."
            />
          ) : (
            propertyAccounts.map(
              (account) => (
                <PropertyAccountCard
                  key={
                    account.reservationId
                  }
                  account={account}
                  onOpenPayment={
                    openPaymentModal
                  }
                  onPayPlanItem={
                    handlePlanItemPay
                  }
                />
              ),
            )
          )}

        </div>
      )}

      {/* =====================================================
          OUTSTANDING
          ===================================================== */}

      {activeTab === 'Outstanding' && (
        <PaymentList
          payments={
            outstandingPayments
          }
          emptyTitle="No payments awaiting verification"
          emptyDescription="Submitted payment receipts waiting for staff review will appear here."
          onReceipt={
            setReceiptTarget
          }
        />
      )}

      {/* =====================================================
          HISTORY
          ===================================================== */}

      {activeTab === 'History' && (
        <PaymentList
          payments={historyPayments}
          emptyTitle="No payment history yet"
          emptyDescription="Verified and rejected payment records will appear here."
          onReceipt={
            setReceiptTarget
          }
        />
      )}

      {/* =====================================================
          SETTLEMENT MODAL
          ===================================================== */}

      <Modal
        open={paymentModalOpen}
        onClose={() => {
          if (
            !submittingPayment &&
            !submittingPlan
          ) {
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
              onClick={() =>
                setPaymentModalOpen(false)
              }
              disabled={
                submittingPayment ||
                submittingPlan
              }
            >
              Cancel
            </Button>

            {settlementMode === 'Full' ||
            settlementMode === 'ReservationFee' ? (
              <button
                type="button"
                onClick={
                  handleFullPayment
                }
                disabled={
                  submittingPayment
                }
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submittingPayment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}

                {settlementMode === 'ReservationFee'
                  ? 'Submit Reservation Fee'
                  : 'Submit Payment'}
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  handlePlanRequest
                }
                disabled={
                  submittingPlan
                }
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submittingPlan ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}

                Submit Plan Request
              </button>
            )}

          </div>
        }
      >

        <div className="space-y-5">

          {/* PROPERTY */}

          {propertyAccounts.length >
            0 && (
            <Select
              label="Property"
              value={
                selectedAccountId
              }
              onChange={(event) => {
                const id =
                  event.target.value;

                setSelectedAccountId(
                  id,
                );

                const account =
                  propertyAccounts.find(
                    (item) =>
                      item.reservationId ===
                      id,
                  );

                if (account) {
                  setPaymentAmount(
                    String(
                      settlementMode === 'ReservationFee'
                        ? account.reservationFee
                        : account.remainingBalance,
                    ),
                  );

                  setPlanPaymentAmount(
                    String(
                      Math.ceil(
                        account.remainingBalance /
                          planPaymentCount,
                      ),
                    ),
                  );
                }
              }}
              options={propertyAccounts
                .filter(
                  (account) =>
                    !account.isFullyPaid,
                )
                .map((account) => ({
                  value:
                    account.reservationId,

                  label: `${
                    account.apartmentTitle
                  } • ${
                    settlementMode === 'ReservationFee'
                      ? formatCurrency(account.reservationFee) + ' reservation deposit'
                      : formatCurrency(account.remainingBalance) + ' remaining'
                  }`,
                }))}
            />
          )}

          {/* BALANCE */}

          {selectedAccount && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>

                <div>
                  <p className="font-extrabold text-sm text-slate-900">
                    {
                      selectedAccount.apartmentTitle
                    }
                  </p>

                  <p className="text-[11px] text-slate-400">
                    Reservation{' '}
                    {
                      selectedAccount.reservationId
                    }
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-3 gap-2">

                <MiniAmount
                  label="Price"
                  value={
                    selectedAccount.totalPrice
                  }
                />

                <MiniAmount
                  label="Verified"
                  value={
                    selectedAccount.totalPaid
                  }
                  green
                />

                <MiniAmount
                  label="Remaining"
                  value={
                    selectedAccount.remainingBalance
                  }
                  amber
                />

              </div>
            </div>
          )}

          {/* OPTIONS */}

          {settlementMode === 'ReservationFee' ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <BadgePercent className="w-4 h-4 text-amber-700" />
                <p className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                  10% Reservation Hold Deposit
                </p>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                To secure and hold <strong className="text-slate-900">{selectedAccount?.apartmentTitle}</strong>, please deposit the 10% reservation fee of <strong className="text-slate-900 font-bold">{formatCurrency(selectedAccount?.reservationFee || 0)}</strong>. Once verified and approved by management, your balance settlement options (Full Payment, Installment Plan, Part Payment) will automatically unlock.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-slate-800 mb-2">
                How would you like to
                settle the remaining
                balance?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <SettlementOption
                  active={
                    settlementMode ===
                    'Full'
                  }
                  icon={
                    <CreditCard className="w-5 h-5" />
                  }
                  title="Full Payment"
                  description="Clear the full remaining balance"
                  onClick={() =>
                    setSettlementMode(
                      'Full',
                    )
                  }
                />

                <SettlementOption
                  active={
                    settlementMode ===
                    'Installment'
                  }
                  icon={
                    <CalendarDays className="w-5 h-5" />
                  }
                  title="Installments"
                  description="Request a monthly payment plan"
                  onClick={() =>
                    setSettlementMode(
                      'Installment',
                    )
                  }
                />

                <SettlementOption
                  active={
                    settlementMode ===
                    'PartPayment'
                  }
                  icon={
                    <Layers3 className="w-5 h-5" />
                  }
                  title="Part Payment"
                  description="Split the balance into agreed parts"
                  onClick={() =>
                    setSettlementMode(
                      'PartPayment',
                    )
                  }
                />
              </div>
            </div>
          )}

          {/* FULL PAYMENT OR RESERVATION FEE */}

          {(settlementMode === 'Full' ||
            settlementMode === 'ReservationFee') && (
            <div className="space-y-4">

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">

                <div className="flex items-start gap-3">

                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-amber-200 shrink-0">
                    <CircleDollarSign className="w-5 h-5 text-amber-600" />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-amber-950">
                      {settlementMode === 'ReservationFee'
                        ? '10% Reservation Hold Deposit'
                        : 'Full Balance Settlement'}
                    </p>

                    <p className="text-xl font-black text-slate-950 mt-1">
                      {formatCurrency(
                        settlementMode === 'ReservationFee'
                          ? selectedAccount?.reservationFee || 0
                          : selectedAccount?.remainingBalance || 0,
                      )}
                    </p>

                    <p className="text-[11px] text-amber-800 mt-1">
                      {settlementMode === 'ReservationFee'
                        ? 'Your reservation is confirmed once this deposit is verified by staff.'
                        : 'The apartment becomes Sold after this full payment is verified by staff.'}
                    </p>
                  </div>

                </div>
              </div>

              <BankDetails />

              <ReceiptUpload
                file={paymentSlip}
                fileInputRef={
                  fileInputRef
                }
                onFileSelected={
                  handleSlipSelected
                }
                onRemove={() =>
                  setPaymentSlip(null)
                }
              />

              <Textarea
                label="Transaction Reference / Notes"
                rows={2}
                placeholder="Bank reference, transaction ID, or optional note"
                value={paymentNotes}
                onChange={(event) =>
                  setPaymentNotes(
                    event.target.value,
                  )
                }
              />

            </div>
          )}

          {/* PLAN */}

          {(settlementMode ===
            'Installment' ||
            settlementMode ===
              'PartPayment') && (
            <div className="space-y-4">

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">

                <div className="flex gap-3">

                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />

                  <div>
                    <p className="text-xs font-extrabold text-blue-950">
                      Admin Approval
                      Required
                    </p>

                    <p className="text-[11px] leading-relaxed text-blue-700 mt-1">
                      No bank slip is
                      required now. Submit
                      your proposed plan.
                      Once approved, the
                      apartment is locked
                      as Sold and your
                      payment schedule
                      becomes available.
                    </p>
                  </div>

                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <Input
                  label={
                    settlementMode ===
                    'Installment'
                      ? 'Regular Installment Amount (Rs.)'
                      : 'Regular Part Amount (Rs.)'
                  }
                  type="number"
                  min="1"
                  value={
                    planPaymentAmount
                  }
                  onChange={(event) =>
                    setPlanPaymentAmount(
                      event.target.value,
                    )
                  }
                />

                <Input
                  label={
                    settlementMode ===
                    'Installment'
                      ? 'Number of Installments'
                      : 'Number of Parts'
                  }
                  type="number"
                  min="2"
                  value={
                    planPaymentCount
                  }
                  onChange={(event) => {
                    const count = Math.max(
                      2,
                      Number(event.target.value) || 2,
                    );
                    setPlanPaymentCount(count);
                    if (selectedAccount?.remainingBalance) {
                      setPlanPaymentAmount(
                        String(
                          Math.floor(
                            selectedAccount.remainingBalance / count,
                          ),
                        ),
                      );
                    }
                  }}
                />

                <Input
                  label="First Due Date"
                  type="date"
                  value={planStartDate}
                  onChange={(event) =>
                    setPlanStartDate(
                      event.target.value,
                    )
                  }
                />

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">

                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Payment Breakdown
                  </p>

                  <p className="text-sm font-black text-slate-900 mt-1">
                    {planPaymentCount - 1} × {formatCurrency(Number(planPaymentAmount || 0))}
                  </p>

                  <p className="text-xs font-bold text-amber-700 mt-0.5">
                    Final payment: {formatCurrency(
                      Math.max(
                        0,
                        (selectedAccount?.remainingBalance || 0) -
                          Number(planPaymentAmount || 0) * (planPaymentCount - 1),
                      ),
                    )}
                  </p>

                  <p className="text-[10px] text-slate-400 mt-1">
                    Total: {formatCurrency(selectedAccount?.remainingBalance || 0)}
                  </p>

                </div>

              </div>

              <Textarea
                label="Plan Request Notes (Optional)"
                rows={3}
                placeholder={
                  settlementMode ===
                  'Installment'
                    ? 'Add any information for the finance team...'
                    : 'Describe your preferred part-payment arrangement...'
                }
                value={planNotes}
                onChange={(event) =>
                  setPlanNotes(
                    event.target.value,
                  )
                }
              />

            </div>
          )}

        </div>

      </Modal>

      {/* =====================================================
          RECEIPT MODAL
          ===================================================== */}

      <Modal
        open={!!receiptTarget}
        onClose={() =>
          setReceiptTarget(null)
        }
        title="Payment Record"
        size="md"
      >

        {receiptTarget && (
          <div className="space-y-4">

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-xs text-slate-400">
                    Payment ID
                  </p>

                  <p className="font-mono font-bold text-sm text-slate-900">
                    {receiptTarget.id}
                  </p>
                </div>

                <Badge
                  variant={statusToVariant(
                    receiptTarget.status,
                  )}
                  size="sm"
                  dot
                >
                  {receiptTarget.status}
                </Badge>

              </div>

              <div className="border-t border-slate-200 mt-4 pt-4">

                <p className="text-[11px] text-slate-400">
                  Amount
                </p>

                <p className="text-xl font-black text-slate-950">
                  {formatCurrency(
                    Number(
                      receiptTarget.amount,
                    ),
                  )}
                </p>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">

              <InfoBox
                label="Type"
                value={
                  receiptTarget.type
                }
              />

              <InfoBox
                label="Submitted"
                value={formatDate(
                  receiptTarget.uploadedAt,
                )}
              />

              {receiptTarget.verifiedAt && (
                <InfoBox
                  label="Verified"
                  value={formatDate(
                    receiptTarget.verifiedAt,
                  )}
                />
              )}

              {receiptTarget.verifiedBy && (
                <InfoBox
                  label="Verified By"
                  value={
                    receiptTarget.verifiedBy
                  }
                />
              )}

            </div>

            {receiptTarget.notes && (
              <div className="rounded-xl border border-slate-200 p-3">

                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Notes
                </p>

                <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">
                  {receiptTarget.notes}
                </p>

              </div>
            )}

          </div>
        )}

      </Modal>

      <Modal
        open={!!planPayTarget}
        onClose={() => {
          if (!submittingPlanPayment) {
            setPlanPayTarget(null);
            setPlanPaySlip(null);
            setPlanPayNotes('');
          }
        }}
        title="Pay Scheduled Amount"
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
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-50 to-slate-100 border border-amber-200/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Payment #{planPayTarget.item.sequenceNo}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Due {formatDate(planPayTarget.item.dueDate)}
                </span>
              </div>
              <p className="text-2xl font-black text-slate-950 mt-1">
                {formatCurrency(Number(planPayTarget.item.amount))}
              </p>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {planPayTarget.plan.apartmentTitle}
              </p>
            </div>

            <BankDetails />

            <ReceiptUpload
              file={planPaySlip}
              fileInputRef={planSlipInputRef}
              onFileSelected={handlePlanSlipSelected}
              onRemove={() => {
                setPlanPaySlip(null);
                if (planSlipInputRef.current) planSlipInputRef.current.value = '';
              }}
            />

            <Textarea
              label="Transaction Reference / Notes (optional)"
              placeholder="e.g. Bank transaction reference or date of transfer"
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

/* =========================================================
   PROPERTY CARD
   ========================================================= */

function PropertyAccountCard({
  account,
  onOpenPayment,
  onPayPlanItem,
}: {
  account: PropertyAccount;

  onOpenPayment: (
    account: PropertyAccount,
    mode?: SettlementMode,
  ) => void;

  onPayPlanItem: (
    plan: PaymentPlan,
    item: NonNullable<
      PaymentPlan['items']
    >[number],
  ) => void;
}) {
  const paidPercent =
    account.totalPrice > 0
      ? Math.min(
          100,
          Math.round(
            (account.totalPaid /
              account.totalPrice) *
              100,
          ),
        )
      : 0;

  const plan = account.plan;

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">

      {/* HEADER */}

      <div className="p-5 sm:p-6 border-b border-slate-100">

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

          <div className="flex gap-3">

            <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-lg font-black text-slate-950">
                  {account.apartmentTitle}
                </h2>

                <Badge
                  variant={
                    account.isFullyPaid
                      ? 'success'
                      : account.apartmentStatus ===
                          'Sold'
                        ? 'success'
                        : 'warning'
                  }
                  size="sm"
                  dot
                >
                  {account.isFullyPaid
                    ? 'Fully Paid'
                    : account.apartmentStatus ||
                      'Reserved'}
                </Badge>

              </div>

              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {account.reservationId}
              </p>

            </div>

          </div>

          {!account.isFullyPaid && (
            !account.reservationFeePaid ? (
              account.reservationFeePending ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-sm">
                  <Clock3 className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                  Fee Approval Pending
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onOpenPayment(
                      account,
                      'ReservationFee',
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 text-xs font-extrabold shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Pay Reservation Fee (10%)
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )
            ) : (
              !plan && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenPayment(
                      account,
                      'Full',
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-extrabold transition cursor-pointer"
                >
                  Manage Balance
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )
            )
          )}

        </div>

        {/* AMOUNTS */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">

          <AccountAmount
            label="Apartment Price"
            value={account.totalPrice}
            icon={
              <Building2 className="w-4 h-4" />
            }
          />

          <AccountAmount
            label="Verified Payments"
            value={account.totalPaid}
            icon={
              <CheckCircle2 className="w-4 h-4" />
            }
            green
          />

          <AccountAmount
            label="Remaining Balance"
            value={
              account.remainingBalance
            }
            icon={
              <WalletCards className="w-4 h-4" />
            }
            amber
          />

        </div>

        {/* PROGRESS */}

        <div className="mt-5">

          <div className="flex items-center justify-between text-[11px] mb-2">

            <span className="font-bold text-slate-500">
              Payment Progress
            </span>

            <span className="font-black text-slate-900">
              {paidPercent}%
            </span>

          </div>

          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">

            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{
                width: `${paidPercent}%`,
              }}
            />

          </div>

        </div>

        {/* RESERVATION FEE STATUS */}

        {account.reservationFeePaid ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reservation Fee Paid & Approved (10%): {formatCurrency(account.reservationFee)}</span>
            </div>
          </div>
        ) : account.reservationFeePending ? (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock3 className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-amber-950">
                  Reservation Fee (10%) Awaiting Staff Approval • {formatCurrency(account.reservationFee)}
                </p>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  Payment slip uploaded and under review. Once approved, your reservation will be confirmed and balance settlement options (Full, Installment, Part Payment) will unlock automatically.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-[11px] font-bold self-start sm:self-center whitespace-nowrap">
              <Clock3 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              Pending Approval
            </span>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-500/20">
                <BadgePercent className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-extrabold text-slate-900">
                    Required: Pay 10% Reservation Fee
                  </p>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                    Hold Deposit
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Pay the 10% reservation fee of <strong className="text-slate-900 font-bold">{formatCurrency(account.reservationFee)}</strong> to confirm your reservation hold.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenPayment(account, 'ReservationFee')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pay Reservation Fee
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

      {/* PLAN OR BALANCE SETTLEMENT */}

      {plan ? (
        <PlanSection
          plan={plan}
          account={account}
          onPay={onPayPlanItem}
        />
      ) : account.reservationFeePaid && !account.isFullyPaid ? (
        <div className="p-5 sm:p-6 bg-slate-50/70">

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            <div>
              <p className="text-sm font-extrabold text-slate-900">
                Choose how to settle
                your remaining balance ({formatCurrency(account.remainingBalance)})
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Full payment can be
                submitted immediately.
                Installment and part
                payment plans require
                finance approval.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <SmallAction
                icon={
                  <CreditCard className="w-3.5 h-3.5" />
                }
                text="Full Payment"
                onClick={() =>
                  onOpenPayment(
                    account,
                    'Full',
                  )
                }
              />

              <SmallAction
                icon={
                  <CalendarDays className="w-3.5 h-3.5" />
                }
                text="Installment Plan"
                onClick={() =>
                  onOpenPayment(
                    account,
                    'Installment',
                  )
                }
              />

              <SmallAction
                icon={
                  <Layers3 className="w-3.5 h-3.5" />
                }
                text="Part Payment"
                onClick={() =>
                  onOpenPayment(
                    account,
                    'PartPayment',
                  )
                }
              />

            </div>

          </div>

        </div>
      ) : !account.reservationFeePaid ? (
        <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Balance settlement options (Full, Installment, Part Payment) will automatically unlock once the 10% reservation fee is approved by staff.</span>
          </div>
        </div>
      ) : null}

    </div>
  );
}

/* =========================================================
   PLAN
   ========================================================= */

function PlanSection({
  plan,
  account,
  onPay,
}: {
  plan: PaymentPlan;
  account: PropertyAccount;

  onPay: (
    plan: PaymentPlan,
    item: NonNullable<
      PaymentPlan['items']
    >[number],
  ) => void;
}) {
  const items = plan.items || [];

  const paidItems =
    items.filter(
      (item) =>
        item.status === 'Paid',
    ).length;

  return (
    <div className="p-5 sm:p-6 bg-slate-50/70">

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">

        <div>

          <div className="flex flex-wrap items-center gap-2">

            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-amber-600" />
            </div>

            <div>
              <p className="font-extrabold text-sm text-slate-950">
                {formatPlanType(
                  String(plan.planType),
                )}
              </p>

              <p className="text-[11px] text-slate-400">
                {plan.numberOfPayments}{' '}
                scheduled payments
              </p>
            </div>

          </div>

        </div>

        <span
          className={`inline-flex self-start items-center px-3 py-1.5 rounded-full border text-[10px] font-extrabold ${getStatusClasses(
            plan.status,
          )}`}
        >
          {plan.status}
        </span>

      </div>

      {/* PENDING */}

      {plan.status === 'Pending' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">

          <div className="flex gap-3">

            <Clock3 className="w-5 h-5 text-amber-600 shrink-0" />

            <div>
              <p className="text-xs font-extrabold text-amber-950">
                Waiting for Finance
                Approval
              </p>

              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                Your plan request has
                been submitted. No bank
                slip or payment is
                required until the plan
                is approved.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* REJECTED */}

      {plan.status === 'Rejected' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">

          <div className="flex gap-3">

            <XCircle className="w-5 h-5 text-red-600 shrink-0" />

            <div>
              <p className="text-xs font-extrabold text-red-900">
                Plan Request Rejected
              </p>

              <p className="text-[11px] text-red-700 mt-1">
                {plan.adminNotes ||
                  'Please contact the finance team for more information.'}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* APPROVED / COMPLETED */}

      {(plan.status === 'Approved' ||
        plan.status ===
          'Completed') && (
        <>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">

            <PlanMetric
              label="Plan Balance"
              value={formatCurrency(
                Number(
                  plan.remainingAmount,
                ),
              )}
            />

            <PlanMetric
              label="Regular Amount"
              value={formatCurrency(
                Number(
                  plan.paymentAmount,
                ),
              )}
            />

            <PlanMetric
              label="Progress"
              value={`${paidItems}/${items.length || plan.numberOfPayments}`}
            />

            <PlanMetric
              label="Apartment"
              value={
                account.apartmentStatus ===
                'Sold'
                  ? 'SOLD'
                  : account.apartmentStatus ||
                    'SOLD'
              }
            />

          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 mb-4 flex gap-2">

            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />

            <p className="text-[11px] text-emerald-800 leading-relaxed">
              This plan is approved. The
              apartment is locked as{' '}
              <strong>Sold</strong> and
              cannot be reserved by
              another customer. Remaining
              payments continue according
              to this schedule.
            </p>

          </div>

          {/* SCHEDULE */}

          <div className="space-y-2">

            <div className="flex items-center justify-between mb-3">

              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Payment Schedule
              </p>

              <span className="text-[10px] text-slate-400">
                First due:{' '}
                {plan.startDate
                  ? formatDate(
                      plan.startDate,
                    )
                  : '—'}
              </span>

            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
                <p className="text-xs font-bold text-slate-600">
                  Schedule is being prepared.
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Refresh after the approved plan schedule has been generated.
                </p>
              </div>
            ) : (() => {
              const sortedItems = [...items].sort(
                (a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0),
              );

              // Next payable item is the first one that is NOT Paid, and ONLY if its status is 'Upcoming'
              const firstUnpaidIndex = sortedItems.findIndex(
                (it) => it.status !== 'Paid',
              );
              const nextPayableItem =
                firstUnpaidIndex !== -1 &&
                sortedItems[firstUnpaidIndex].status === 'Upcoming'
                  ? sortedItems[firstUnpaidIndex]
                  : null;

              return sortedItems.map((item) => {
                const isNextPayable =
                  nextPayableItem && nextPayableItem.id === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                          item.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'Pending Verification'
                              ? 'bg-amber-100 text-amber-800'
                              : isNextPayable
                                ? 'bg-amber-50 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.status === 'Paid' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          `#${item.sequenceNo}`
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-extrabold text-slate-900">
                            Payment #{item.sequenceNo}
                          </p>
                          {isNextPayable && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[9px] font-extrabold uppercase">
                              Current Due
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Due {formatDate(item.dueDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-950">
                          {formatCurrency(Number(item.amount))}
                        </p>

                        <span
                          className={`inline-flex mt-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusClasses(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {isNextPayable && (
                        <button
                          type="button"
                          onClick={() => onPay(plan, item)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}

          </div>

        </>
      )}

    </div>
  );
}

/* =========================================================
   PAYMENT LIST
   ========================================================= */

function PaymentList({
  payments,
  emptyTitle,
  emptyDescription,
  onReceipt,
}: {
  payments: Payment[];
  emptyTitle: string;
  emptyDescription: string;

  onReceipt: (
    payment: Payment,
  ) => void;
}) {
  if (payments.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptText className="w-12 h-12 text-navy-300" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">

      <div className="hidden md:grid grid-cols-[1.2fr_1.5fr_1fr_1fr_0.8fr] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">

        <span>Payment</span>
        <span>Property</span>
        <span>Amount</span>
        <span>Status</span>
        <span />

      </div>

      <div className="divide-y divide-slate-100">

        {payments.map((payment) => (
          <div
            key={payment.id}
            className="grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_1fr_1fr_0.8fr] gap-3 md:gap-4 px-5 py-4 items-center hover:bg-slate-50/70 transition"
          >

            <div>
              <p className="font-mono text-[11px] font-bold text-slate-900">
                {payment.id}
              </p>

              <p className="text-[10px] text-slate-400 mt-1">
                {formatDate(
                  payment.uploadedAt,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-extrabold text-slate-900">
                {payment.apartmentTitle}
              </p>

              <p className="text-[10px] text-slate-400 mt-1">
                {payment.type}
              </p>
            </div>

            <p className="text-sm font-black text-slate-950">
              {formatCurrency(
                Number(payment.amount),
              )}
            </p>

            <div>
              <Badge
                variant={statusToVariant(
                  payment.status,
                )}
                size="sm"
                dot
              >
                {payment.status}
              </Badge>
            </div>

            <div className="md:text-right">

              <button
                type="button"
                onClick={() =>
                  onReceipt(payment)
                }
                className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-slate-600 hover:text-amber-700 transition"
              >
                <FileText className="w-3.5 h-3.5" />

                Details
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function SummaryCard({
  icon,
  label,
  value,
  description,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  accent?: 'green' | 'amber';
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">

      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${
          accent === 'green'
            ? 'bg-emerald-50 text-emerald-600'
            : accent === 'amber'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-slate-100 text-slate-600'
        }`}
      >
        {icon}
      </div>

      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
        {label}
      </p>

      <p className="text-base sm:text-xl font-black text-slate-950 mt-1 truncate">
        {value}
      </p>

      <p className="text-[10px] text-slate-400 mt-1">
        {description}
      </p>

    </div>
  );
}

function AccountAmount({
  label,
  value,
  icon,
  green,
  amber,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  green?: boolean;
  amber?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        green
          ? 'bg-emerald-50/60 border-emerald-100'
          : amber
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-slate-50 border-slate-100'
      }`}
    >

      <div
        className={`flex items-center gap-1.5 text-[10px] font-bold ${
          green
            ? 'text-emerald-700'
            : amber
              ? 'text-amber-800'
              : 'text-slate-400'
        }`}
      >
        {icon}

        {label}
      </div>

      <p className="text-sm sm:text-base font-black text-slate-950 mt-1.5">
        {formatCurrency(value)}
      </p>

    </div>
  );
}

function MiniAmount({
  label,
  value,
  green,
  amber,
}: {
  label: string;
  value: number;
  green?: boolean;
  amber?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-2.5 border ${
        green
          ? 'bg-emerald-50 border-emerald-100'
          : amber
            ? 'bg-amber-50 border-amber-200'
            : 'bg-white border-slate-200'
      }`}
    >

      <p className="text-[9px] uppercase font-bold text-slate-400">
        {label}
      </p>

      <p className="text-[11px] sm:text-xs font-black text-slate-950 mt-1">
        {formatCurrency(value)}
      </p>

    </div>
  );
}

function SettlementOption({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border p-3.5 transition ${
        active
          ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-100'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >

      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
          active
            ? 'bg-amber-400 text-slate-950'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        {icon}
      </div>

      <p className="text-xs font-extrabold text-slate-950">
        {title}
      </p>

      <p className="text-[10px] leading-relaxed text-slate-400 mt-1">
        {description}
      </p>

    </button>
  );
}

function BankDetails() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

      <div className="flex items-center gap-2 mb-3">

        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
          <Landmark className="w-4 h-4 text-amber-600" />
        </div>

        <div>
          <p className="text-xs font-extrabold text-slate-900">
            Bank Transfer Details
          </p>

          <p className="text-[10px] text-slate-400">
            Transfer before uploading
            your receipt
          </p>
        </div>

      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-[11px]">

        <BankRow
          label="Bank"
          value="Commercial Bank PLC"
        />

        <BankRow
          label="Branch"
          value="Colombo City Centre"
        />

        <BankRow
          label="Account Name"
          value="Skyline Living Residences (Pvt) Ltd"
        />

        <BankRow
          label="Account No."
          value="1000 8945 2311"
        />

      </div>

    </div>
  );
}

function BankRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between sm:block border-b sm:border-0 border-slate-200 pb-1">

      <span className="text-slate-400">
        {label}
      </span>

      <p className="font-bold text-slate-800 sm:mt-0.5">
        {value}
      </p>

    </div>
  );
}

function ReceiptUpload({
  file,
  fileInputRef,
  onFileSelected,
  onRemove,
}: {
  file: File | null;

  fileInputRef:
    React.RefObject<HTMLInputElement | null>;

  onFileSelected: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;

  onRemove: () => void;
}) {
  return (
    <div>

      <label className="block text-sm font-semibold text-slate-800 mb-1.5">
        Bank Deposit Slip / Transfer
        Receipt *
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={onFileSelected}
        className="hidden"
      />

      {file ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between gap-3">

          <div className="flex items-center gap-3 min-w-0">

            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="min-w-0">

              <p className="text-xs font-extrabold text-slate-900 truncate">
                {file.name}
              </p>

              <p className="text-[10px] text-emerald-700 mt-0.5">
                Receipt ready to upload
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onRemove}
            className="w-8 h-8 rounded-full bg-white border border-emerald-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition"
          >
            <X className="w-4 h-4" />
          </button>

        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="w-full border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-2xl p-6 bg-slate-50 hover:bg-amber-50/40 transition flex flex-col items-center"
        >

          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <Upload className="w-5 h-5 text-amber-600" />
          </div>

          <p className="text-xs font-extrabold text-slate-800 mt-3">
            Upload payment receipt
          </p>

          <p className="text-[10px] text-slate-400 mt-1">
            PNG, JPG or PDF • Maximum 5MB
          </p>

        </button>
      )}

    </div>
  );
}

function PlanMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-3">

      <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
        {label}
      </p>

      <p className="text-xs font-black text-slate-900 mt-1">
        {value}
      </p>

    </div>
  );
}

function SmallAction({
  icon,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50 text-[10px] font-extrabold text-slate-700 transition"
    >
      {icon}
      {text}
    </button>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">

      <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
        {label}
      </p>

      <p className="text-xs font-bold text-slate-800 mt-1">
        {value}
      </p>

    </div>
  );
}