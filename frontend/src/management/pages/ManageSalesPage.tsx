import { useMemo, useState, useEffect } from 'react';
import {
  Eye,
  Download,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  CalendarDays,
  Search,
  Building2,
  CheckCircle2,
  Receipt,
  User,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import Badge from '@/shared/components/ui/Badge';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Select, Input } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { salesService, dashboardService } from '@/shared/services/managementService';
import { reservationService } from '@/shared/services/reservationService';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import type { Sale, ReportData, ReservationRefund } from '@/shared/types';
import SaleDetailsModal from '../components/SaleDetailsModal';
import ReservationDetailsModal from '../components/ReservationDetailsModal';

export default function ManageSalesPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'sales' | 'retained'>('sales');
  const [list, setList] = useState<Sale[]>(() => salesService.getCached() || []);
  const [refundList, setRefundList] = useState<ReservationRefund[]>([]);
  const [reportsData, setReportsData] = useState<ReportData | null>(() => dashboardService.getCachedReports());
  const [loading, setLoading] = useState(!salesService.getCached());
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'price-desc' | 'price-asc'>('date-desc');
  
  // Modals state
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [selectedResDetailsId, setSelectedResDetailsId] = useState<string | null>(null);

  const fetchData = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const [salesData, repData, refundsData] = await Promise.all([
        salesService.getAll(),
        dashboardService.getReports().catch(() => null),
        reservationService.getAllRefunds().catch(() => []),
      ]);
      setList(Array.isArray(salesData) ? salesData : []);
      if (repData) setReportsData(repData);
      setRefundList(Array.isArray(refundsData) ? refundsData : []);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load financial & sales records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(!salesService.getCached());
  }, []);

  // Summary KPIs for Sales
  const kpis = useMemo(() => {
    const count = list.length;
    const totalRevenue = list.reduce((sum, s) => sum + (Number(s.finalPrice) || 0), 0);
    const avgPrice = count > 0 ? totalRevenue / count : 0;
    
    // Current month filter
    const nowPrefix = new Date().toISOString().substring(0, 7);
    const thisMonthSales = list.filter((s) => s.saleDate && s.saleDate.startsWith(nowPrefix));
    const thisMonthRevenue = thisMonthSales.reduce((sum, s) => sum + (Number(s.finalPrice) || 0), 0);

    // Retained Income KPIs
    const totalRetainedIncome = refundList.reduce((sum, r) => sum + (Number(r.companyRetainedAmount) || 0), 0);
    const totalCustomerRefunds = refundList.reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0);

    return {
      count,
      totalRevenue,
      avgPrice,
      thisMonthCount: thisMonthSales.length,
      thisMonthRevenue,
      totalRetainedIncome,
      totalCustomerRefunds,
      refundCount: refundList.length,
    };
  }, [list, refundList]);

  // Filtering & Sorting for Property Sales
  const filteredSales = useMemo(() => {
    let result = list.filter((s) => {
      const matchesDate = !dateFilter || (s.saleDate && s.saleDate.startsWith(dateFilter));
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (s.id && s.id.toLowerCase().includes(q)) ||
        (s.apartmentTitle && s.apartmentTitle.toLowerCase().includes(q)) ||
        (s.apartmentId && s.apartmentId.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerEmail && s.customerEmail.toLowerCase().includes(q)) ||
        (s.reservationId && s.reservationId.toLowerCase().includes(q)) ||
        (s.staffName && s.staffName.toLowerCase().includes(q));

      return matchesDate && matchesSearch;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'date-desc') return (b.saleDate || '').localeCompare(a.saleDate || '');
      if (sortBy === 'date-asc') return (a.saleDate || '').localeCompare(b.saleDate || '');
      if (sortBy === 'price-desc') return (Number(b.finalPrice) || 0) - (Number(a.finalPrice) || 0);
      if (sortBy === 'price-asc') return (Number(a.finalPrice) || 0) - (Number(b.finalPrice) || 0);
      return 0;
    });

    return result;
  }, [list, dateFilter, search, sortBy]);

  // Filtering for Retained Reservation Fees
  const filteredRefunds = useMemo(() => {
    return refundList.filter((r) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (r.id && r.id.toLowerCase().includes(q)) ||
        (r.reservationId && r.reservationId.toLowerCase().includes(q)) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.customerEmail && r.customerEmail.toLowerCase().includes(q)) ||
        (r.apartmentTitle && r.apartmentTitle.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q))
      );
    });
  }, [refundList, search]);

  function handleExport() {
    if (activeTab === 'sales') {
      if (filteredSales.length === 0) {
        toast('No sales data available to export', 'error');
        return;
      }
      const headers = ['Sale ID', 'Apartment Title', 'Unit ID', 'Customer Name', 'Customer Email', 'Final Price', 'Sale Date', 'Staff', 'Reservation Ref'];
      const rows = filteredSales.map((s) => [
        s.id,
        `"${(s.apartmentTitle || '').replace(/"/g, '""')}"`,
        s.apartmentId || '',
        `"${(s.customerName || '').replace(/"/g, '""')}"`,
        s.customerEmail || '',
        s.finalPrice,
        s.saleDate || '',
        `"${(s.staffName || '').replace(/"/g, '""')}"`,
        s.reservationId || '',
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `skyline_sales_ledger_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Sales ledger exported successfully (CSV format)', 'success');
    } else {
      if (filteredRefunds.length === 0) {
        toast('No retained fee records to export', 'error');
        return;
      }
      const headers = ['Refund Record ID', 'Reservation ID', 'Residence Unit', 'Customer', 'Original Fee', 'Customer Refund', 'Company Retained Income', 'Record Type', 'Reason', 'Processed By', 'Date'];
      const rows = filteredRefunds.map((r) => [
        r.id,
        r.reservationId,
        `"${(r.apartmentTitle || '').replace(/"/g, '""')}"`,
        `"${(r.customerName || '').replace(/"/g, '""')}"`,
        r.originalFee,
        r.refundAmount,
        r.companyRetainedAmount,
        'RESERVATION_FEE_RETAINED',
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        `"${(r.processedBy || '').replace(/"/g, '""')}"`,
        r.createdAt || '',
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `skyline_retained_fees_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Retained fees ledger exported successfully', 'success');
    }
  }

  // Dynamic Date Filter Options
  const dateOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Dates' }];
    const uniqueMonths = new Set<string>();
    list.forEach((s) => {
      if (s.saleDate && s.saleDate.length >= 7) {
        uniqueMonths.add(s.saleDate.substring(0, 7));
      }
    });

    Array.from(uniqueMonths)
      .sort((a, b) => b.localeCompare(a))
      .forEach((m) => {
        const [year, month] = m.split('-');
        const dateObj = new Date(Number(year), Number(month) - 1, 1);
        const label = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        options.push({ value: m, label });
      });

    return options;
  }, [list]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Skyline Financial & Records Ledger
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {activeTab === 'sales' ? `${kpis.count} Closed Deeds` : `${kpis.refundCount} Fee Settlements`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sales & Financial Records
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Audit verified property sales and retained reservation fee income transactions.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export {activeTab === 'sales' ? 'Sales CSV' : 'Retained Fees CSV'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center p-1 bg-slate-200/70 rounded-2xl w-full sm:w-fit border border-slate-300/60">
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`px-5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'sales'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>Completed Apartment Sales</span>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
            {kpis.count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('retained')}
          className={`px-5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'retained'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4 text-purple-600" />
          <span>Retained Reservation Fees & Refunds</span>
          <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
            {kpis.refundCount}
          </span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      {activeTab === 'sales' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Volume
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Sales</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">{kpis.count}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Completed title deeds</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Gross Revenue
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Sales Revenue</p>
              <h3 className="text-2xl font-extrabold text-amber-600 tracking-tight mt-0.5">
                {formatCurrency(kpis.totalRevenue)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">All verified sales combined</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                Average
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Average Sale Price</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {formatCurrency(kpis.avgPrice)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Per completed unit</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                This Month
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Sales This Month</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {formatCurrency(kpis.thisMonthRevenue)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">{kpis.thisMonthCount} sale(s) closed this month</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                Retained Income
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Retained Fee Income</p>
              <h3 className="text-2xl font-extrabold text-purple-900 tracking-tight mt-0.5">
                {formatCurrency(kpis.totalRetainedIncome)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Company retained cancellation & expiry fees</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                Refunds
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Refunded to Customers</p>
              <h3 className="text-2xl font-extrabold text-emerald-700 tracking-tight mt-0.5">
                {formatCurrency(kpis.totalCustomerRefunds)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Settled return of deposits</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_25px_rgba(15,23,42,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                Ledger
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Fee Settlements</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {kpis.refundCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Audited financial records</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder={
              activeTab === 'sales'
                ? 'Search by Sale ID, unit, buyer, or ref...'
                : 'Search refund ID, customer, unit, or reason...'
            }
            icon={<Search className="w-4 h-4 text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {activeTab === 'sales' && (
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <div className="w-full sm:w-44">
              <Select
                options={dateOptions}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'date-desc', label: 'Date: Newest First' },
                  { value: 'date-asc', label: 'Date: Oldest First' },
                  { value: 'price-desc', label: 'Price: High to Low' },
                  { value: 'price-asc', label: 'Price: Low to High' },
                ]}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              />
            </div>
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
              {filteredSales.length} {filteredSales.length === 1 ? 'sale' : 'sales'} found
            </span>
          </div>
        )}
      </div>

      {/* Main Content Table */}
      {activeTab === 'sales' ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-sm space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-medium">Loading completed sales records...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                variant="inbox"
                title="No sales records found"
                description={
                  search || dateFilter
                    ? 'No completed sales match your current search or filter criteria.'
                    : 'Completed apartment sales automatically recorded upon full payment verification will appear here.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-5 py-3.5">Sale & Deed Reference</th>
                    <th className="px-5 py-3.5">Residence Unit</th>
                    <th className="px-5 py-3.5">Buyer Profile</th>
                    <th className="px-5 py-3.5">Final Sale Price</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSaleId(s.id)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    >
                      {/* 1. Sale & Deed Reference */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 group-hover:bg-amber-100 group-hover:text-amber-900 group-hover:border-amber-200 px-2.5 py-1 rounded-md border border-slate-200 transition-colors">
                            #{s.id}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            SALE
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-slate-400" />
                          {formatDate(s.saleDate)}
                        </p>
                      </td>

                      {/* 2. Residence Unit */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 text-sm truncate max-w-[200px]">{s.apartmentTitle}</p>
                            {s.apartmentId && (
                              <span className="font-mono text-[11px] text-slate-400">{s.apartmentId}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Customer / Buyer */}
                      <td className="px-5 py-3.5">
                        <p className="font-extrabold text-slate-900 text-sm">{s.customerName}</p>
                        {s.customerEmail && (
                          <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">{s.customerEmail}</p>
                        )}
                      </td>

                      {/* 4. Final Sale Price */}
                      <td className="px-5 py-3.5">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {formatCurrency(s.finalPrice)}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Recorded Deed Price</p>
                      </td>

                      {/* 5. Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSaleId(s.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                          title="View Full Sale & Financial Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Retained Reservation Fees & Refunds Table */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-sm space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-medium">Loading retained fees & refunds ledger...</p>
            </div>
          ) : filteredRefunds.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                variant="inbox"
                title="No retained fee records found"
                description="Financial transactions for reservation cancellations and retained fees will appear here once settled."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-5 py-3.5">Settlement Ref</th>
                    <th className="px-5 py-3.5">Customer & Residence</th>
                    <th className="px-5 py-3.5">Financial Breakdown</th>
                    <th className="px-5 py-3.5">Status & Reason</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRefunds.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedResDetailsId(r.reservationId)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    >
                      {/* 1. Settlement Ref */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            #{r.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Hold: #{r.reservationId}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(r.createdAt)}
                        </p>
                      </td>

                      {/* 2. Customer & Residence */}
                      <td className="px-5 py-3.5">
                        <p className="font-extrabold text-slate-900 text-sm">
                          {r.customerName}
                        </p>
                        <p className="text-xs text-amber-700 font-semibold flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          {r.apartmentTitle || 'Apartment'}
                        </p>
                      </td>

                      {/* 3. Fee Breakdown */}
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-extrabold text-slate-900">
                          Total Fee: {formatCurrency(r.originalFee)}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] flex-wrap">
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Refund: {formatCurrency(r.refundAmount)}
                          </span>
                          <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                            Retained: {formatCurrency(r.companyRetainedAmount)}
                          </span>
                        </div>
                      </td>

                      {/* 4. Status & Reason */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-purple-50 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-md">
                          <Receipt className="w-3 h-3 text-purple-700" />
                          RETAINED
                        </span>
                        {r.reason && (
                          <p className="text-[11px] text-slate-500 mt-1 italic truncate max-w-[180px]">
                            "{r.reason}"
                          </p>
                        )}
                      </td>

                      {/* 5. Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResDetailsId(r.reservationId);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Hold Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sale Details Modal */}
      <SaleDetailsModal
        open={!!selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
        saleId={selectedSaleId}
      />

      {/* Reservation Details Modal */}
      <ReservationDetailsModal
        open={!!selectedResDetailsId}
        onClose={() => setSelectedResDetailsId(null)}
        reservationId={selectedResDetailsId}
      />
    </div>
  );
}