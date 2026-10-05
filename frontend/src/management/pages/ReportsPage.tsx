import { useState, useEffect, useMemo } from 'react';
import {
  Download, TrendingUp, Building2, Star,
  Shield, DollarSign, MapPin, RotateCcw, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import EmptyState from '@/shared/components/ui/EmptyState';
import BarChart, { DonutChart, LineChart } from '@/shared/components/ui/Charts';
import { Select } from '@/shared/components/ui/Form';
import { dashboardService } from '@/shared/services/managementService';
import { apartmentService } from '@/shared/services/apartmentService';
import { formatCurrency } from '@/shared/utils/format';
import type { ChartDataPoint, Apartment, ReportData, DistrictStat } from '@/shared/types';

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [range, setRange] = useState('6m');
  const [reportsData, setReportsData] = useState<ReportData | null>(() => dashboardService.getCachedReports());
  const [liveApartments, setLiveApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(!dashboardService.getCachedReports());

  const isAdmin = (user?.role as string)?.toLowerCase() === 'admin';

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    dashboardService.getReports(range)
      .then((data) => {
        if (!mounted) return;
        setReportsData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Reports fetch error:', err);
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [range]);

  useEffect(() => {
    let mounted = true;
    apartmentService.getAll({ includeSold: true })
      .then((apts) => {
        if (mounted && Array.isArray(apts)) {
          setLiveApartments(apts);
        }
      })
      .catch(() => { });

    return () => { mounted = false; };
  }, []);

  const grossInflow = Number(reportsData?.grossVerifiedInflow ?? reportsData?.totalPaidAmount ?? 0);
  const refundOutflow = Number(reportsData?.completedRefundOutflow ?? 0);
  const netRealizedCash = Number(reportsData?.netRealizedCash ?? (grossInflow - refundOutflow));
  const totalContractSales = Number(reportsData?.totalContractSales ?? reportsData?.totalRevenue ?? 0);
  const apartmentsSold = Number(reportsData?.apartmentsSold ?? 0);
  const avgSalePrice = Number(reportsData?.avgSalePrice ?? 0);
  const totalUnits = reportsData?.totalApartmentsListed ?? liveApartments.length;

  const monthlySales: ChartDataPoint[] = useMemo(() => {
    return reportsData?.monthlySales && reportsData.monthlySales.length > 0
      ? reportsData.monthlySales
      : [{ label: 'Current', value: 0 }];
  }, [reportsData]);

  const monthlyRevenueTrend: ChartDataPoint[] = useMemo(() => {
    if (reportsData?.monthlyCashflow && reportsData.monthlyCashflow.length > 0) {
      return reportsData.monthlyCashflow.map(m => ({
        label: m.label,
        value: Number(m.netCashflow ?? 0),
      }));
    }
    if (reportsData?.monthlyRevenue && reportsData.monthlyRevenue.length > 0) {
      return reportsData.monthlyRevenue;
    }
    return [
      { label: 'Current', value: netRealizedCash }
    ];
  }, [reportsData, netRealizedCash]);

  const aptStatus: ChartDataPoint[] = useMemo(() => {
    return reportsData?.statusDistribution ?? [
      { label: 'Available', value: 0 },
      { label: 'Reserved', value: 0 },
      { label: 'Sold', value: 0 },
    ];
  }, [reportsData]);

  const inquiryCategories: ChartDataPoint[] = useMemo(() => {
    return reportsData?.inquiryCategories ?? [
      { label: 'Pricing', value: 0 },
      { label: 'Availability', value: 0 },
      { label: 'Viewing', value: 0 },
      { label: 'Financing', value: 0 },
      { label: 'General', value: 0 },
    ];
  }, [reportsData]);

  const paymentTypes: ChartDataPoint[] = useMemo(() => {
    return reportsData?.paymentTypes ?? [
      { label: 'Reservation Fee', value: 0 },
      { label: 'Installment Payment', value: 0 },
      { label: 'Full Payment', value: 0 },
      { label: 'Part Payment', value: 0 },
    ];
  }, [reportsData]);

  const districtStats: DistrictStat[] = useMemo(() => {
    if (reportsData?.districtStats && reportsData.districtStats.length > 0) {
      return reportsData.districtStats;
    }
    return liveApartments.reduce((acc, apt) => {
      const dist = apt.district || apt.city || 'Colombo Central';
      const existing = acc.find(d => d.district === dist);
      if (existing) {
        existing.count++;
        existing.revenue += Number(apt.price) || 0;
      } else {
        acc.push({ district: dist, count: 1, revenue: Number(apt.price) || 0 });
      }
      return acc;
    }, [] as DistrictStat[])
      .sort((a, b) => b.revenue - a.revenue);
  }, [reportsData, liveApartments]);

  const handleExport = () => {
    if (!reportsData) {
      toast('No report data available to export', 'error');
      return;
    }

    const summarySection = [
      'EXECUTIVE FINANCIAL REPORT - SKYLINE LIVING',
      `Report Period: ${range.toUpperCase()}`,
      `Exported At: ${new Date().toISOString()}`,
      '',
      'Metric,Amount (LKR) / Count,Description',
      `Gross Verified Inflow,"${grossInflow}",Total verified incoming payments in period`,
      `Completed Customer Refunds,"${refundOutflow}",Actual customer refunds disbursed`,
      `Net Realized Cash,"${netRealizedCash}",Gross verified inflow less completed refunds`,
      `Total Contract Sales,"${totalContractSales}",Sum of finalized apartment sale deed prices`,
      `Apartments Sold,"${apartmentsSold}",Total property deeds executed`,
      `Average Sale Price,"${avgSalePrice}",Contract sales value per unit sold`,
      `Retained Fee Income,"${reportsData.retainedFeeIncome ?? 0}",Approved cancellation retention income`,
      '',
      'MONTHLY CASHFLOW & SALES LEDGER',
      'Month,Gross Inflow (LKR),Refund Outflow (LKR),Net Cashflow (LKR),Contract Sales (LKR),Units Sold',
    ];

    const monthlyRows = (reportsData.monthlyCashflow || []).map((m) => [
      `"${m.label}"`,
      m.grossInflow,
      m.refundOutflow,
      m.netCashflow,
      m.contractSales,
      m.salesCount,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [...summarySection, ...monthlyRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skyline_financial_report_${range}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Financial analytics report exported successfully (CSV format)', 'success');
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-24">
        <EmptyState
          icon={<Shield className="w-12 h-12 text-slate-300" />}
          title="Administrator Access Required"
          description="Business intelligence and deep reporting analytics are restricted to System Administrators only."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-12 w-full animate-pulse">
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-slate-200 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 w-full relative">

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Executive Business Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Holistic performance breakdown across sales volume, inventory turnover, and buyer geographic segments.
          </p>
        </div>

        {/* Filter Controls & Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
          <div className="w-full sm:w-44">
            <Select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              options={[
                { value: '3m', label: 'Last 3 Months' },
                { value: '6m', label: 'Last 6 Months' },
                { value: '1y', label: 'Last Year' },
                { value: 'all', label: 'All Time' },
              ]}
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - 6 Authoritative Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* 1. Gross Verified Inflow */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Inflow
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Gross Verified Inflow</p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {formatCurrency(grossInflow)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Total verified incoming payments</p>
          </div>
        </div>

        {/* 2. Completed Refunds */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Disbursed
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Completed Refunds</p>
            <h3 className="text-2xl font-extrabold text-rose-600 tracking-tight mt-0.5">
              {formatCurrency(refundOutflow)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Paid customer refund settlements</p>
          </div>
        </div>

        {/* 3. Net Realized Cash */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Net Cash
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Net Realized Cash</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-0.5">
              {formatCurrency(netRealizedCash)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Gross verified inflow less refunds</p>
          </div>
        </div>

        {/* 4. Total Contract Sales */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Sales Value
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Contract Sales</p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {formatCurrency(totalContractSales)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Finalized apartment sale deeds</p>
          </div>
        </div>

        {/* 5. Apartments Sold */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Units Sold
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Apartments Sold</p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {apartmentsSold} Units
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Executed deed contracts</p>
          </div>
        </div>

        {/* 6. Average Sale Price */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Avg Price
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Average Sale Price</p>
            <h3 className="text-2xl font-extrabold text-amber-600 tracking-tight mt-0.5">
              {formatCurrency(avgSalePrice)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Contract sales / units sold</p>
          </div>
        </div>

      </div>

      {/* Row 1: Sales Volume & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly Sales Volume */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Monthly Sales Volume</h3>
              <p className="text-xs text-slate-400">Number of executed deeds per month</p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
              {range.toUpperCase()} Window
            </span>
          </div>
          <div className="py-2">
            <BarChart data={monthlySales} height={230} color="bg-amber-500" />
          </div>
        </div>

        {/* Apartment Status Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Apartment Status Breakdown</h3>
              <p className="text-xs text-slate-400">Current portfolio allocation</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Real-time Inventory
            </span>
          </div>
          <div className="flex items-center justify-center py-2">
            <DonutChart data={aptStatus} size={200} />
          </div>
        </div>

      </div>

      {/* Row 2: Inquiry Categories & Payment Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Inquiry Categories */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Customer Inquiry Categories</h3>
              <p className="text-xs text-slate-400">Distribution of pre-sale inquiries by subject</p>
            </div>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
              Client Demand
            </span>
          </div>
          <div className="py-2">
            <BarChart data={inquiryCategories} height={230} color="bg-slate-900" />
          </div>
        </div>

        {/* Payment Type Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Payment Method & Type Share</h3>
              <p className="text-xs text-slate-400">Verified cashflow channels</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              Deposits Audit
            </span>
          </div>
          <div className="flex items-center justify-center py-2">
            <DonutChart data={paymentTypes} size={200} />
          </div>
        </div>

      </div>

      {/* Row 3: Revenue Trend & Top Performing Districts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue Trend Line */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Monthly Net Cashflow Trajectory</h3>
              <p className="text-xs text-slate-400">Aggregated net cash movement (inflows less completed refunds)</p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
              Net Cashflow
            </span>
          </div>
          <div className="py-2">
            <LineChart
              data={monthlyRevenueTrend}
              height={230}
              formatValue={(v) => formatCurrency(v)}
            />
          </div>
        </div>

        {/* Top Performing Districts */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Top Performing Districts</h3>
                <p className="text-xs text-slate-400">Inventory concentration and total asset value</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                Regional Yield
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-bold">District / Area</th>
                    <th className="pb-3 font-bold text-center">Listed Units</th>
                    <th className="pb-3 font-bold text-right">Aggregate Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {districtStats.map((d) => (
                    <tr key={d.district} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{d.district}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {d.count} {d.count === 1 ? 'Unit' : 'Units'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-extrabold text-slate-900">
                        {formatCurrency(d.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Aggregated across active & reserved developments</span>
            <span className="font-bold text-slate-700">Colombo Metropolitan Region</span>
          </div>
        </div>

      </div>

    </div>
  );
}