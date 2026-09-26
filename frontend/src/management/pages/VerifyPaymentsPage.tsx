import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  X,
  Eye,
  CreditCard,
  DollarSign,
  Clock,
  FileText,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Layers3,
  ClipboardCheck,
  Lock,
  User,
  Building2,
} from 'lucide-react';

import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Textarea, Select, Input } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { useAuth } from '@/shared/contexts/AuthContext';

import { paymentService } from '@/shared/services/paymentService';
import { paymentPlanService } from '@/shared/services/paymentPlanService';

import {
  formatCurrency,
  formatDateTime,
} from '@/shared/utils/format';

import type {
  Payment,
  PaymentStatus,
  PaymentPlan,
} from '@/shared/types';

// ============================================================
// TYPES
// ============================================================

type MainView = 'payments' | 'plans';

type PlanAction = 'approve' | 'reject';

const tabStatuses: (PaymentStatus | 'All')[] = [
  'Pending',
  'Verified',
  'Rejected',
  'All',
];

// ============================================================
// COMPONENT
// ============================================================

export default function VerifyPaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ==========================================================
  // MAIN VIEW
  // ==========================================================

  const [mainView, setMainView] =
    useState<MainView>('payments');

  // ==========================================================
  // PAYMENT STATE
  // ==========================================================

  const [list, setList] =
    useState<Payment[]>(() => paymentService.getCachedAll() || []);

  const [loading, setLoading] =
    useState(!paymentService.getCachedAll());

  const [activeTab, setActiveTab] =
    useState<PaymentStatus | 'All'>('Pending');

  const [search, setSearch] =
    useState('');

  const [typeFilter, setTypeFilter] =
    useState('');

  const [proofTarget, setProofTarget] =
    useState<Payment | null>(null);

  const [actionTarget, setActionTarget] =
    useState<Payment | null>(null);

  const [actionType, setActionType] =
    useState<'verify' | 'reject'>('verify');

  const [notes, setNotes] =
    useState('');

  // ==========================================================
  // PAYMENT PLAN STATE
  // ==========================================================

  const [plans, setPlans] =
    useState<PaymentPlan[]>(() => paymentPlanService.getCachedAll() || []);

  const [plansLoading, setPlansLoading] =
    useState(!paymentPlanService.getCachedAll());

  const [planSearch, setPlanSearch] =
    useState('');

  const [planStatusFilter, setPlanStatusFilter] =
    useState('All');

  const [planActionTarget, setPlanActionTarget] =
    useState<PaymentPlan | null>(null);

  const [planActionType, setPlanActionType] =
    useState<PlanAction>('approve');

  const [planNotes, setPlanNotes] =
    useState('');

  const [adminInterestRate, setAdminInterestRate] =
    useState<string>('10.0');

  const [adminAdditionalAmount, setAdminAdditionalAmount] =
    useState<string>('0');

  const [planActionLoading, setPlanActionLoading] =
    useState(false);

  // ==========================================================
  // LOAD PAYMENTS
  // ==========================================================

  const fetchPayments = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);

      const data =
        await paymentService.getAll();

      setList(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err: any) {
      console.error(
        'Failed to load payments:',
        err
      );

      toast(
        err?.message ||
          'Failed to load payments',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // LOAD PAYMENT PLANS
  // ==========================================================

  const fetchPlans = async (showSpinner = false) => {
    try {
      if (showSpinner) setPlansLoading(true);

      const data =
        await paymentPlanService.getAll();

      setPlans(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err: any) {
      console.error(
        'Failed to load payment plans:',
        err
      );

      toast(
        err?.message ||
          'Failed to load payment plan requests',
        'error'
      );
    } finally {
      setPlansLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchPayments(!paymentService.getCachedAll());
    fetchPlans(!paymentPlanService.getCachedAll());
  }, []);

  // ==========================================================
  // PAYMENT OPTIONS
  // ==========================================================

  const typeOptions: {
    value: string;
    label: string;
  }[] = [
    {
      value: '',
      label: 'All Payment Types',
    },
    {
      value: 'Reservation Fee',
      label: 'Reservation Fee',
    },
    {
      value: 'Full Payment',
      label: 'Full Payment',
    },
    {
      value: 'Installment Payment',
      label: 'Installment Payment',
    },
    {
      value: 'Part Payment',
      label: 'Part Payment',
    },
  ];

  // ==========================================================
  // PAYMENT COUNTS
  // ==========================================================

  const counts = useMemo(
    () => ({
      Pending:
        list.filter(
          (p) => p.status === 'Pending'
        ).length,

      Verified:
        list.filter(
          (p) => p.status === 'Verified'
        ).length,

      Rejected:
        list.filter(
          (p) => p.status === 'Rejected'
        ).length,

      All: list.length,
    }),
    [list]
  );

  // ==========================================================
  // PLAN COUNTS
  // ==========================================================

  const planCounts = useMemo(
    () => ({
      Pending:
        plans.filter(
          (p) => String(p.status || '').toLowerCase() === 'pending'
        ).length,

      Approved:
        plans.filter(
          (p) => String(p.status || '').toLowerCase() === 'approved'
        ).length,

      Rejected:
        plans.filter(
          (p) => String(p.status || '').toLowerCase() === 'rejected'
        ).length,

      Completed:
        plans.filter(
          (p) => String(p.status || '').toLowerCase() === 'completed'
        ).length,

      All: plans.length,
    }),
    [plans]
  );

  // ==========================================================
  // KPI VALUES
  // ==========================================================

  const pendingAmount = useMemo(
    () =>
      list
        .filter(
          (p) => p.status === 'Pending'
        )
        .reduce(
          (sum, p) =>
            sum + Number(p.amount || 0),
          0
        ),
  [list]
  );

  const verifiedAmount = useMemo(
    () =>
      list
        .filter(
          (p) => p.status === 'Verified'
        )
        .reduce(
          (sum, p) =>
            sum + Number(p.amount || 0),
          0
        ),
  [list]
  );

  // ==========================================================
  // PAYMENT FILTER
  // ==========================================================

  const filtered = useMemo(() => {
    return list.filter((p) => {
      const matchesTab =
        activeTab === 'All' ||
        p.status === activeTab;

      const matchesType =
        !typeFilter ||
        p.type === typeFilter;

      const query =
        search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        String(p.id)
          .toLowerCase()
          .includes(query) ||
        (p.customerName || '')
          .toLowerCase()
          .includes(query) ||
        (p.apartmentTitle || '')
          .toLowerCase()
          .includes(query);

      return (
        matchesTab &&
        matchesType &&
        matchesSearch
      );
    });
  }, [
    list,
    activeTab,
    typeFilter,
    search,
  ]);

  // ==========================================================
  // PLAN FILTER
  // ==========================================================

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const query =
        planSearch
          .trim()
          .toLowerCase();

      const matchesStatus =
        !planStatusFilter ||
        planStatusFilter === 'All' ||
        planStatusFilter.toLowerCase() === 'all' ||
        String(plan.status || '').toLowerCase() === planStatusFilter.toLowerCase();

      const matchesSearch =
        !query ||
        String(plan.id)
          .toLowerCase()
          .includes(query) ||
        (plan.customerName || '')
          .toLowerCase()
          .includes(query) ||
        (plan.customerEmail || '')
          .toLowerCase()
          .includes(query) ||
        (plan.apartmentTitle || '')
          .toLowerCase()
          .includes(query);

      return (
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    plans,
    planSearch,
    planStatusFilter,
  ]);

  // ==========================================================
  // PAYMENT ACTION
  // ==========================================================

  function openAction(
    payment: Payment,
    type: 'verify' | 'reject'
  ) {
    setActionTarget(payment);
    setActionType(type);
    setNotes('');
  }

  async function confirmAction() {
    if (!actionTarget) {
      return;
    }

    if (
      actionType === 'reject' &&
      !notes.trim()
    ) {
      toast(
        'Rejection notes are required',
        'error'
      );

      return;
    }

    try {
      const verifier =
        user?.name ||
        user?.email ||
        'Staff Member';

      let updated: Payment;

      if (actionType === 'verify') {
        updated =
          await paymentService.verify(
            actionTarget.id,
            verifier,
            notes
          );
      } else {
        updated =
          await paymentService.reject(
            actionTarget.id,
            verifier,
            notes
          );
      }

      setList((prev) =>
        prev.map((p) =>
          p.id === actionTarget.id
            ? updated
            : p
        )
      );

      toast(
        `Payment ${
          actionType === 'verify'
            ? 'verified'
            : 'rejected'
        } successfully`,
        'success'
      );

      setActionTarget(null);
      setNotes('');
    } catch (err: any) {
      toast(
        err?.message ||
          'Failed to update payment',
        'error'
      );
    }
  }

  // ==========================================================
  // PLAN ACTION
  // ==========================================================

  function openPlanAction(
    plan: PaymentPlan,
    type: PlanAction
  ) {
    setPlanActionTarget(plan);
    setPlanActionType(type);
    setPlanNotes('');
    setAdminInterestRate(
      plan.annualInterestRate !== undefined && plan.annualInterestRate !== null
        ? String(plan.annualInterestRate)
        : '10.0'
    );
    setAdminAdditionalAmount(
      plan.additionalAmount !== undefined && plan.additionalAmount !== null
        ? String(plan.additionalAmount)
        : '0'
    );
  }

  async function confirmPlanAction() {
    if (!planActionTarget) {
      return;
    }

    const s = String(planActionTarget.status || '').toLowerCase();
    if (s === 'approved' || s === 'completed') {
      toast('This payment plan has already been accepted and its financial terms can no longer be changed.', 'error');
      return;
    }

    if (
      planActionType === 'reject' &&
      !planNotes.trim()
    ) {
      toast(
        'Please enter a reason for rejecting this payment plan.',
        'error'
      );

      return;
    }

    const isPartPayment = String(planActionTarget.planType || '').toLowerCase().includes('part');
    const isInstallment = !isPartPayment;

    let rateNum = 0;
    let addNum = 0;

    if (planActionType === 'approve') {
      if (isInstallment) {
        rateNum = Number(adminInterestRate);
        if (isNaN(rateNum) || rateNum < 0) {
          toast('Please enter a valid annual interest rate (0% or greater).', 'error');
          return;
        }
      } else {
        addNum = Number(adminAdditionalAmount);
        if (isNaN(addNum) || addNum < 0) {
          toast('Please enter a valid additional amount (0 or greater).', 'error');
          return;
        }
      }
    }

    try {
      setPlanActionLoading(true);

      let updated: PaymentPlan;

      if (planActionType === 'approve') {
        updated =
          await paymentPlanService.approve(
            planActionTarget.id,
            {
              notes: planNotes,
              annualInterestRate: isInstallment ? rateNum : undefined,
              additionalAmount: isPartPayment ? addNum : undefined,
            }
          );
      } else {
        updated =
          await paymentPlanService.reject(
            planActionTarget.id,
            planNotes
          );
      }

      setPlans((prev) =>
        prev.map((plan) =>
          plan.id ===
          planActionTarget.id
            ? updated
            : plan
        )
      );

      toast(
        planActionType === 'approve'
          ? 'Payment plan terms proposed successfully. Customer can now review and confirm.'
          : 'Payment plan rejected successfully',
        'success'
      );

      setPlanActionTarget(null);
      setPlanNotes('');

      /*
       * Reload because approval may create
       * schedule items and change related data.
       */
      await fetchPlans();
    } catch (err: any) {
      console.error(err);

      toast(
        err?.message ||
          `Failed to ${planActionType} payment plan`,
        'error'
      );
    } finally {
      setPlanActionLoading(false);
    }
  }

  // ==========================================================
  // PLAN STATUS BADGE
  // ==========================================================

  function getPlanStatusClasses(
    status: string
  ) {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'plan ready for confirmation':
      case 'awaiting customer':
      case 'terms proposed':
        return 'bg-purple-50 text-purple-700 border-purple-200';

      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      case 'cancelled':
        return 'bg-slate-100 text-slate-600 border-slate-200';

      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }

  // ==========================================================
  // DATE FORMATTER FOR PLAN
  // ==========================================================

  function formatPlanDate(
    value?: string
  ) {
    if (!value) {
      return '—';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-6 pb-12">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-5 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">

              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Finance & Compliance
              </span>

              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {counts.All} Payment Slips
              </span>

              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {planCounts.Pending} Pending Plan Requests
              </span>

            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Payments & Plan Approvals
            </h1>

            <p className="text-slate-500 text-sm mt-0.5">
              Verify customer payment slips and review installment or part-payment requests.
            </p>
          </div>

          {(counts.Pending > 0 ||
            planCounts.Pending > 0) && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />

              {counts.Pending +
                planCounts.Pending}{' '}
              action(s) waiting
            </div>
          )}

        </div>
      </div>

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)]">

          <div className="flex items-center justify-between mb-3">

            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <DollarSign className="w-5 h-5" />
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Pending Audit
            </span>

          </div>

          <p className="text-xs font-semibold text-slate-400">
            Pending Payment Amount
          </p>

          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {formatCurrency(
              pendingAmount
            )}
          </h3>

          <p className="text-[11px] text-slate-400 mt-1">
            Awaiting bank deposit confirmation
          </p>

        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)]">

          <div className="flex items-center justify-between mb-3">

            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700">
              <ClipboardCheck className="w-5 h-5" />
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
              Plan Requests
            </span>

          </div>

          <p className="text-xs font-semibold text-slate-400">
            Pending Plan Approvals
          </p>

          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {planCounts.Pending}{' '}
            Requests
          </h3>

          <p className="text-[11px] text-slate-400 mt-1">
            Installment and part-payment requests
          </p>

        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)]">

          <div className="flex items-center justify-between mb-3">

            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
              <CreditCard className="w-5 h-5" />
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
              Settled
            </span>

          </div>

          <p className="text-xs font-semibold text-slate-400">
            Total Verified Volume
          </p>

          <h3 className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-0.5">
            {formatCurrency(
              verifiedAmount
            )}
          </h3>

          <p className="text-[11px] text-slate-400 mt-1">
            {counts.Verified}{' '}
            payments verified
          </p>

        </div>

      </div>

      {/* ======================================================
          MAIN PAYMENT / PLAN SWITCH
      ====================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-2">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

          <button
            type="button"
            onClick={() =>
              setMainView('payments')
            }
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
              mainView === 'payments'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />

            Payment Slips

            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                mainView === 'payments'
                  ? 'bg-white/15 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.All}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setMainView('plans')
            }
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
              mainView === 'plans'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers3 className="w-4 h-4" />

            Plan Requests

            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                mainView === 'plans'
                  ? 'bg-white/40 text-slate-900'
                  : planCounts.Pending > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {planCounts.Pending}
            </span>
          </button>

        </div>
      </div>

      {/* ======================================================
          PAYMENT VIEW
      ====================================================== */}

      {mainView === 'payments' && (
        <>
          {/* FILTERS */}

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">

            <div className="flex items-center p-1 bg-slate-100 rounded-xl overflow-x-auto w-full md:w-auto border border-slate-200/70">

              {tabStatuses.map(
                (status) => {
                  const count =
                    counts[
                      status as keyof typeof counts
                    ] || 0;

                  const isActive =
                    activeTab === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          status
                        )
                      }
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>
                        {status ===
                        'Pending'
                          ? 'Pending Review'
                          : status}
                      </span>

                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                          isActive
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                }
              )}

            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">

              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search slip ID or customer..."
                  icon={
                    <Search className="w-4 h-4 text-slate-400" />
                  }
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="w-full sm:w-52">
                <Select
                  options={typeOptions}
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(
                      e.target.value
                    )
                  }
                />
              </div>

            </div>
          </div>

          {/* PAYMENT TABLE */}

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] overflow-hidden">

            {loading ? (
              <div className="p-16 text-center text-slate-400 text-sm">
                Loading payment verification records...
              </div>
            ) : filtered.length ===
              0 ? (
              <div className="p-12 text-center">
                <EmptyState
                  variant="inbox"
                  title="No payments in this view"
                  description="Payment receipts uploaded by buyers will appear here for audit."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="px-5 py-3.5">Slip Reference</th>
                      <th className="px-5 py-3.5">Customer & Unit</th>
                      <th className="px-5 py-3.5">Amount & Category</th>
                      <th className="px-5 py-3.5 text-center">Bank Slip</th>
                      <th className="px-5 py-3.5 text-right">Audit & Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* 1. Slip Reference */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            #{p.id}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1 font-medium">
                            {formatDateTime(p.uploadedAt)}
                          </p>
                        </td>

                        {/* 2. Customer & Unit */}
                        <td className="px-5 py-3.5">
                          <p className="font-extrabold text-slate-900 text-sm">
                            {p.customerName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                            {p.apartmentTitle}
                          </p>
                        </td>

                        {/* 3. Amount & Category */}
                        <td className="px-5 py-3.5">
                          <p className="font-extrabold text-slate-900 text-sm">
                            {formatCurrency(p.amount)}
                          </p>
                          <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80">
                            {p.type}
                          </span>
                        </td>

                        {/* 4. Bank Slip */}
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setProofTarget(p)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Slip
                          </button>
                        </td>

                        {/* 5. Status & Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.status === 'Pending' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openAction(p, 'verify')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Verify
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openAction(p, 'reject')}
                                  className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            ) : (
                              <Badge variant={statusToVariant(p.status)} size="sm" dot>
                                {p.status}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </>
      )}

      {/* ======================================================
          PAYMENT PLAN VIEW
      ====================================================== */}

      {mainView === 'plans' && (
        <>
          {/* PLAN FILTER */}

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search plan ID, customer or unit..."
                icon={<Search className="w-4 h-4 text-slate-400" />}
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-56">
              <Select
                options={[
                  { value: 'All', label: 'All Plan Statuses' },
                  { value: 'Pending', label: 'Pending Approval' },
                  { value: 'Approved', label: 'Approved Plans' },
                  { value: 'Rejected', label: 'Rejected Plans' },
                  { value: 'Completed', label: 'Completed Plans' },
                ]}
                value={planStatusFilter}
                onChange={(e) => setPlanStatusFilter(e.target.value)}
              />
            </div>

          </div>

          {/* PLAN TABLE */}

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] overflow-hidden">

            {plansLoading ? (
              <div className="p-16 text-center text-slate-400 text-sm">
                Loading payment plan applications...
              </div>
            ) : filteredPlans.length ===
              0 ? (
              <div className="p-12 text-center">
                <EmptyState
                  variant="inbox"
                  title="No payment plans found"
                  description="Customer requested installment schemes will appear here for management approval."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full text-sm min-w-[780px]">

                  <thead>

                    <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500 font-bold">

                      <th className="px-5 py-3.5">Plan & Scheme</th>
                      <th className="px-5 py-3.5">Customer & Residence</th>
                      <th className="px-5 py-3.5">Installment Terms</th>
                      <th className="px-5 py-3.5">Financial Breakdown</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredPlans.map(
                      (plan) => (
                        <tr
                          key={plan.id}
                          className="hover:bg-slate-50/60 transition"
                        >

                          {/* PLAN & SCHEME */}

                          <td className="px-5 py-3.5">

                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                              {plan.id?.startsWith('PLN-') ? plan.id : `PLN-${plan.id}`}
                            </span>

                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                <Layers3 className="w-3 h-3" />
                                {plan.planType}
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-slate-400" />
                              First due: {formatPlanDate(plan.startDate)}
                            </p>

                          </td>

                          {/* CUSTOMER & RESIDENCE */}

                          <td className="px-5 py-3.5">

                            <p className="font-extrabold text-slate-900 text-sm">
                              {plan.customerName}
                            </p>

                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">
                              {plan.apartmentTitle}
                            </p>

                            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                              {plan.customerEmail}
                            </p>

                          </td>

                          {/* INSTALLMENT TERMS */}

                          <td className="px-5 py-3.5">

                            <p className="font-extrabold text-slate-900 text-sm">
                              {formatCurrency(
                                Number(
                                  plan.paymentAmount ||
                                    0
                                )
                              )}
                            </p>

                            <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                              {plan.numberOfPayments} Total Installments
                            </p>

                          </td>

                          {/* FINANCIAL BREAKDOWN */}

                          <td className="px-5 py-3.5">

                            <p className="font-extrabold text-slate-900 text-sm">
                              {formatCurrency(
                                Number(
                                  plan.totalPlanAmount ||
                                    0
                                )
                              )}
                            </p>

                            <p className="text-xs text-amber-700 font-semibold mt-0.5">
                              Remaining:{' '}
                              {formatCurrency(
                                Number(
                                  plan.remainingAmount ||
                                    0
                                )
                              )}
                            </p>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-3.5 text-center">

                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-extrabold ${getPlanStatusClasses(
                                plan.status
                              )}`}
                            >
                              {plan.status}
                            </span>

                          </td>

                          {/* ACTION */}
                          <td className="px-5 py-3.5 text-right">
                            {(() => {
                              const s = String(plan.status || '').toLowerCase();
                              const canAction = s === 'pending' || s === 'plan ready for confirmation' || s === 'terms proposed' || s === 'awaiting customer';
                              if (canAction) {
                                return (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openPlanAction(
                                          plan,
                                          'approve'
                                        )
                                      }
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      {s === 'pending' ? 'Review & Propose' : 'Update Terms'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openPlanAction(
                                          plan,
                                          'reject'
                                        )
                                      }
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      Reject
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPlanAction(
                                        plan,
                                        'approve'
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                                    Review Plan
                                  </button>
                                </div>
                              );
                            })()}
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>
        </>
      )}

      {/* ======================================================
          PAYMENT PROOF MODAL
      ====================================================== */}

      <Modal
        open={!!proofTarget}
        onClose={() =>
          setProofTarget(null)
        }
        title="Payment Deposit Slip Proof"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">

            {proofTarget?.proofUrl ? (
              <a
                href={
                  proofTarget.proofUrl
                }
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Full Image
              </a>
            ) : (
              <span />
            )}

            <Button
              variant="outline"
              onClick={() =>
                setProofTarget(null)
              }
            >
              Close
            </Button>

          </div>
        }
      >

        {proofTarget && (
          <div className="space-y-4">

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 gap-3 text-sm">

              <div>
                <span className="text-xs text-slate-400 block font-semibold">
                  Slip ID
                </span>

                <span className="font-mono font-bold text-slate-900">
                  {proofTarget.id}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-semibold">
                  Deposit Amount
                </span>

                <span className="font-extrabold text-slate-900">
                  {formatCurrency(
                    proofTarget.amount
                  )}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-semibold">
                  Client Name
                </span>

                <span className="font-bold text-slate-900">
                  {
                    proofTarget.customerName
                  }
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-semibold">
                  Residence
                </span>

                <span className="font-bold text-slate-900 truncate block">
                  {
                    proofTarget.apartmentTitle
                  }
                </span>
              </div>

            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center min-h-[300px]">

              {proofTarget.proofUrl ? (
                <img
                  src={
                    proofTarget.proofUrl
                  }
                  alt="Bank Deposit Proof"
                  className="max-h-[420px] w-auto object-contain"
                />
              ) : (
                <div className="p-8 text-center text-slate-400">

                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-600" />

                  <p className="text-sm font-semibold">
                    No digital slip attachment provided
                  </p>

                </div>
              )}

            </div>

          </div>
        )}

      </Modal>

      {/* ======================================================
          PAYMENT VERIFY / REJECT MODAL
      ====================================================== */}

      <Modal
        open={!!actionTarget}
        onClose={() =>
          setActionTarget(null)
        }
        title={
          actionType === 'verify'
            ? 'Confirm Payment Verification'
            : 'Reject Payment Submission'
        }
        footer={
          <div className="flex items-center justify-end gap-3 w-full">

            <Button
              variant="outline"
              onClick={() =>
                setActionTarget(null)
              }
            >
              Cancel
            </Button>

            <Button
              onClick={confirmAction}
              className={
                actionType === 'verify'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-0 shadow-sm'
                  : 'bg-rose-600 hover:bg-rose-700 text-white font-bold border-0 shadow-sm'
              }
            >
              {actionType === 'verify'
                ? 'Confirm & Approve Deposit'
                : 'Confirm Rejection'}
            </Button>

          </div>
        }
      >

        {actionTarget && (
          <div className="space-y-4">

            <div
              className={`p-4 rounded-2xl border text-sm ${
                actionType ===
                'verify'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}
            >

              <div className="flex items-center gap-2 mb-1">

                {actionType ===
                'verify' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}

                <span className="font-extrabold">
                  {actionTarget.id}
                  {' — '}
                  {formatCurrency(
                    actionTarget.amount
                  )}
                </span>

              </div>

              <p className="text-xs opacity-80">
                Customer:{' '}
                <span className="font-bold">
                  {
                    actionTarget.customerName
                  }
                </span>{' '}
                (
                {
                  actionTarget.apartmentTitle
                }
                )
              </p>

            </div>

            <Textarea
              label={
                actionType ===
                'verify'
                  ? 'Audit Notes (Optional)'
                  : 'Reason for Rejection (Required)'
              }
              value={notes}
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
              placeholder={
                actionType ===
                'verify'
                  ? 'e.g. Verified with bank statement transaction ref #...'
                  : 'e.g. Unclear receipt snapshot / Transfer amount does not match...'
              }
              rows={3}
            />

          </div>
        )}

      </Modal>

      {/* ======================================================
          PAYMENT PLAN APPROVE / REJECT MODAL
      ====================================================== */}

      <Modal
        open={!!planActionTarget}
        onClose={() => {
          if (!planActionLoading) {
            setPlanActionTarget(null);
          }
        }}
        size="xl"
        title={
          planActionTarget ? (
            <div className="flex items-center gap-2.5">
              <span>
                {(() => {
                  const s = String(planActionTarget.status || '').toLowerCase();
                  if (s === 'approved' || s === 'completed') return 'Payment Plan Review (Accepted & Locked)';
                  if (planActionType === 'reject') return 'Reject Payment Plan';
                  if (s === 'pending') return 'Payment Plan Review & Approval';
                  return 'Update Payment Plan Terms';
                })()}
              </span>
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {planActionTarget.id?.startsWith('PLN-') ? planActionTarget.id : `PLN-${planActionTarget.id}`}
              </span>
            </div>
          ) : 'Payment Plan Review'
        }
        footer={
          planActionTarget && (() => {
            const s = String(planActionTarget.status || '').toLowerCase();
            const isAccepted = s === 'approved' || s === 'completed';

            if (isAccepted) {
              return (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Customer Accepted — Financial Terms Locked</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPlanActionTarget(null)}
                  >
                    Close
                  </Button>
                </div>
              );
            }

            if (planActionType === 'reject') {
              return (
                <div className="flex items-center justify-between w-full">
                  <Button
                    variant="outline"
                    disabled={planActionLoading}
                    onClick={() => setPlanActionType('approve')}
                  >
                    Back to Review
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      disabled={planActionLoading}
                      onClick={() => setPlanActionTarget(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={planActionLoading}
                      onClick={confirmPlanAction}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold border-0 shadow-sm"
                    >
                      {planActionLoading ? 'Processing...' : 'Confirm Rejection'}
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  disabled={planActionLoading}
                  onClick={() => setPlanActionType('reject')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject Plan</span>
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={planActionLoading}
                    onClick={() => setPlanActionTarget(null)}
                  >
                    Cancel / Close
                  </Button>
                  <Button
                    disabled={planActionLoading}
                    onClick={confirmPlanAction}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-0 shadow-sm flex items-center gap-1.5 px-4 py-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {planActionLoading
                        ? 'Submitting...'
                        : s === 'pending'
                        ? 'Approve Plan'
                        : 'Update Terms'}
                    </span>
                  </Button>
                </div>
              </div>
            );
          })()
        }
      >
        {planActionTarget && (() => {
          const s = String(planActionTarget.status || '').toLowerCase();
          const isAccepted = s === 'approved' || s === 'completed';
          const isPartPayment = String(planActionTarget.planType || '').toLowerCase().includes('part');
          const isInstallment = !isPartPayment;

          const aptPrice = Number(planActionTarget.apartmentPrice) || 0;
          const resFee = Number(planActionTarget.reservationFee) || 0;
          const rawPrincipal = Number(planActionTarget.remainingPrincipal);
          const principal = (rawPrincipal !== undefined && !isNaN(rawPrincipal) && rawPrincipal > 0)
            ? rawPrincipal
            : (aptPrice > 0 ? Math.max(0, aptPrice - resFee) : Number(planActionTarget.totalPlanAmount) || 0);

          const numPayments = Number(planActionTarget.numberOfPayments) || 1;
          const durationYears = numPayments / 12.0;

          const rate = isAccepted
            ? Number(planActionTarget.annualInterestRate || 0)
            : Math.max(0, Number(adminInterestRate) || 0);

          const addAmount = isAccepted
            ? Number(planActionTarget.additionalAmount || 0)
            : Math.max(0, Number(adminAdditionalAmount) || 0);

          const calcInterest = isAccepted
            ? Number(planActionTarget.interestAmount || 0)
            : (isInstallment ? Math.round(principal * (rate / 100) * durationYears * 100) / 100 : 0);

          const calcTotal = isAccepted
            ? Number(planActionTarget.totalPlanAmount || 0)
            : (isInstallment
                ? Math.round((principal + calcInterest) * 100) / 100
                : Math.round((principal + addAmount) * 100) / 100);

          const calcPeriodic = isAccepted
            ? Number(planActionTarget.paymentAmount || 0)
            : Math.round((calcTotal / numPayments) * 100) / 100;

          return (
            <div className="space-y-4 text-slate-800">
              {/* LOCK BANNER IF CUSTOMER ACCEPTED */}
              {isAccepted && (
                <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-3.5 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                    <Lock className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-amber-950 text-xs uppercase tracking-wide">
                      Financial Terms Locked & Immutable
                    </h5>
                    <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                      The customer has accepted the approved terms for this payment plan. Pursuant to platform financial regulations, interest rates, additional adjustments, installment amounts, and total payable values are permanently locked and cannot be altered.
                    </p>
                  </div>
                </div>
              )}

              {/* REJECTION SCREEN IF REJECT ACTION */}
              {planActionType === 'reject' && !isAccepted && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="font-bold text-rose-950 text-sm">
                        Rejecting Payment Plan Application ({planActionTarget.customerName})
                      </h5>
                      <p className="text-xs text-rose-800 mt-0.5">
                        Please specify the reason for rejection. This explanation will be included in the formal notification dispatched to the customer.
                      </p>
                    </div>
                  </div>

                  <Textarea
                    label="Reason for Rejection (Required)"
                    value={planNotes}
                    onChange={(e) => setPlanNotes(e.target.value)}
                    placeholder="e.g. Credit evaluation incomplete / Installment duration requested exceeds property policy guidelines..."
                    rows={3}
                  />
                </div>
              )}

              {/* SECTION A: Customer & Apartment Information */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <User className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    A. Customer & Apartment Information
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Customer Name</p>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5 truncate">
                      {planActionTarget.customerName}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Customer Email</p>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5 truncate" title={planActionTarget.customerEmail}>
                      {planActionTarget.customerEmail}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Apartment / Unit</p>
                    <p className="font-extrabold text-slate-900 text-xs mt-0.5 truncate">
                      {planActionTarget.apartmentNumber ? `Unit ${planActionTarget.apartmentNumber}` : planActionTarget.apartmentTitle}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Apartment / Project</p>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5 truncate">
                      {planActionTarget.buildingName || planActionTarget.apartmentTitle || 'Skyline Living'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Apartment Total Price</p>
                    <p className="font-extrabold text-slate-900 text-xs mt-0.5">
                      {formatCurrency(aptPrice)}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Reservation Date</p>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5">
                      {formatPlanDate(planActionTarget.reservationDate || planActionTarget.createdAt)}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 col-span-2 sm:col-span-1 lg:col-span-2">
                    <p className="text-[10px] uppercase font-bold text-emerald-700">Reservation Fee Already Paid</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-extrabold text-emerald-900 text-sm">
                        {formatCurrency(resFee)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Verified Paid
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: Requested Payment Plan */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers3 className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      B. Requested Payment Plan
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Request Date: {formatPlanDate(planActionTarget.createdAt)}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-extrabold ${getPlanStatusClasses(planActionTarget.status)}`}>
                      {planActionTarget.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Payment Plan Type</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 mt-1">
                      <Layers3 className="w-3 h-3" />
                      {planActionTarget.planType}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Requested Installments / Parts</p>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                      {planActionTarget.numberOfPayments} {isPartPayment ? 'Milestone Parts' : 'Installments'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <p className="text-[10px] uppercase font-bold text-amber-800">Current Remaining Balance</p>
                    <p className="font-extrabold text-amber-950 text-sm mt-0.5">
                      {formatCurrency(principal)}
                    </p>
                  </div>
                </div>

                {/* Customer's requested terms */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-slate-700">Customer's Requested Terms:</span>
                    <span>Requested First Due: {formatPlanDate(planActionTarget.startDate)}</span>
                  </div>
                  <p className="text-slate-600 italic">
                    {planActionTarget.customerNotes
                      ? `"${planActionTarget.customerNotes}"`
                      : 'Standard payment plan terms requested by customer.'}
                  </p>
                </div>
              </div>

              {/* SECTION C: Admin/Manager Approval Terms */}
              {planActionType === 'approve' && (
                <div className={`rounded-2xl border-2 p-4 space-y-4 shadow-xs ${
                  isInstallment ? 'border-blue-300 bg-blue-50/40' : 'border-indigo-300 bg-indigo-50/40'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <CalendarDays className={`w-4 h-4 ${isInstallment ? 'text-blue-700' : 'text-indigo-700'}`} />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                        C. Admin / Manager Approval Terms
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <Lock className="w-3 h-3 text-amber-700" />
                          Locked Terms
                        </span>
                      ) : (
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isInstallment ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          Values Approved / Added by Management
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Installment Plan Approval Terms */}
                  {isInstallment && (
                    <div className="space-y-3.5">
                      {/* Annual Interest Rate Input or Locked View */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-800">
                            Annual Interest Rate (%) {isAccepted ? '(Approved & Locked)' : <span className="text-rose-500">*</span>}
                          </label>
                          {isAccepted && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              <Lock className="w-3 h-3" /> Read-Only
                            </span>
                          )}
                        </div>

                        {isAccepted ? (
                          <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-base">{rate}%</span>
                            <span className="text-xs text-slate-500">Agreed annual interest rate</span>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={adminInterestRate}
                              onChange={(e) => setAdminInterestRate(e.target.value)}
                              className="w-full px-3 py-2 pr-8 text-base font-extrabold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              placeholder="10.0"
                            />
                            <span className="absolute right-3.5 top-2.5 text-sm font-bold text-slate-400 pointer-events-none">%</span>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500">
                          {isAccepted
                            ? 'This rate was accepted by the customer and cannot be modified.'
                            : 'Enter the annual interest rate to apply. All calculations update live below.'}
                        </p>
                      </div>

                      {/* Required Terms Breakdown */}
                      <div className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Approval Calculation Breakdown
                        </p>
                        <div className="space-y-1.5 text-slate-600">
                          <div className="flex justify-between">
                            <span>Principal / Remaining Balance after Reservation Fee:</span>
                            <span className="font-bold text-slate-900">{formatCurrency(principal)}</span>
                          </div>
                          <div className="flex justify-between text-blue-700">
                            <span>Annual Interest Rate (%):</span>
                            <span className="font-bold">{rate}%</span>
                          </div>
                          <div className="flex justify-between text-blue-700">
                            <span>Plan Tenor / Duration:</span>
                            <span className="font-bold">{numPayments} installments ({durationYears.toFixed(2)} years)</span>
                          </div>
                          <div className="flex justify-between bg-blue-50/80 p-2 rounded-lg font-bold text-blue-900">
                            <span>Interest Amount ({formatCurrency(principal)} × {rate}% × {durationYears.toFixed(2)} yrs):</span>
                            <span>+{formatCurrency(calcInterest)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900 text-sm">
                            <span>Final Payable Amount:</span>
                            <span className="text-amber-800 font-extrabold">{formatCurrency(calcTotal)}</span>
                          </div>
                          <div className="flex justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-lg font-bold text-emerald-950 text-sm">
                            <span>Amount per Installment ({formatCurrency(calcTotal)} ÷ {numPayments}):</span>
                            <span className="text-emerald-700 font-extrabold">{formatCurrency(calcPeriodic)} / mo</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Metric Summary Cards */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-blue-200 shadow-2xs">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Total Interest</p>
                          <p className="font-extrabold text-blue-900 text-xs mt-0.5">{formatCurrency(calcInterest)}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-blue-200 shadow-2xs">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Final Payable Amount</p>
                          <p className="font-extrabold text-slate-900 text-xs mt-0.5">{formatCurrency(calcTotal)}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                          <p className="text-[9px] uppercase font-bold text-emerald-800">Amount per Installment</p>
                          <p className="font-extrabold text-emerald-700 text-xs mt-0.5">{formatCurrency(calcPeriodic)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Part Payment Approval Terms */}
                  {isPartPayment && (
                    <div className="space-y-3.5">
                      {/* Additional Amount Input or Locked View */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-800">
                            Additional Amount / Interest Fee (Rs.) {isAccepted ? '(Approved & Locked)' : null}
                          </label>
                          {isAccepted && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              <Lock className="w-3 h-3" /> Read-Only
                            </span>
                          )}
                        </div>

                        {isAccepted ? (
                          <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-base">{formatCurrency(addAmount)}</span>
                            <span className="text-xs text-slate-500">Agreed additional adjustment</span>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={adminAdditionalAmount}
                              onChange={(e) => setAdminAdditionalAmount(e.target.value)}
                              className="w-full px-3 py-2 text-base font-extrabold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              placeholder="0.00"
                            />
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500">
                          {isAccepted
                            ? 'This adjustment was accepted by the customer and cannot be modified.'
                            : 'Added to the remaining balance before dividing into milestone parts.'}
                        </p>
                      </div>

                      {/* Required Part Payment Terms Breakdown */}
                      <div className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Approval Calculation Breakdown
                        </p>
                        <div className="space-y-1.5 text-slate-600">
                          <div className="flex justify-between">
                            <span>Remaining Balance:</span>
                            <span className="font-bold text-slate-900">{formatCurrency(principal)}</span>
                          </div>
                          <div className="flex justify-between text-indigo-700">
                            <span>Additional Amount / Interest Fee:</span>
                            <span className="font-bold">+{formatCurrency(addAmount)}</span>
                          </div>
                          <div className="flex justify-between text-indigo-700">
                            <span>Number of Parts:</span>
                            <span className="font-bold">{numPayments} milestone parts</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900 text-sm">
                            <span>Final Payable Amount:</span>
                            <span className="text-purple-900 font-extrabold">{formatCurrency(calcTotal)}</span>
                          </div>
                          <div className="flex justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-lg font-bold text-emerald-950 text-sm">
                            <span>Amount per Part ({formatCurrency(calcTotal)} ÷ {numPayments}):</span>
                            <span className="text-emerald-700 font-extrabold">{formatCurrency(calcPeriodic)} / part</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Metric Summary Cards */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-indigo-200 shadow-2xs">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Final Payable Amount</p>
                          <p className="font-extrabold text-slate-900 text-xs mt-0.5">{formatCurrency(calcTotal)}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                          <p className="text-[9px] uppercase font-bold text-emerald-800">Amount per Part</p>
                          <p className="font-extrabold text-emerald-700 text-xs mt-0.5">{formatCurrency(calcPeriodic)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes / Remarks */}
                  {!isAccepted ? (
                    <Textarea
                      label="Admin Remarks / Proposal Notes (Optional)"
                      value={planNotes}
                      onChange={(e) => setPlanNotes(e.target.value)}
                      placeholder="Add any specific approval notes or terms communicated to the customer..."
                      rows={2}
                    />
                  ) : planActionTarget.adminNotes ? (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700">Admin Remarks: </span>
                      <span className="text-slate-600">"{planActionTarget.adminNotes}"</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

    </div>
  );
}