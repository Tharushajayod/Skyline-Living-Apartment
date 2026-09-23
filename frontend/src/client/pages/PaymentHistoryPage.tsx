import { useState, useEffect } from 'react';
import { Download, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import type { Payment } from '@/shared/types';
import { paymentService } from '@/shared/services/paymentService';
import { payments as mockPayments } from '@/shared/mockData';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import { Select } from '@/shared/components/ui/Form';
import EmptyState from '@/shared/components/ui/EmptyState';
import KPICard from '@/shared/components/ui/KPICard';
import { formatCurrency, formatDate } from '@/shared/utils/format';

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let isMounted = true;
    paymentService.getAll()
      .then(data => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setPayments(data);
        } else {
          setPayments(mockPayments.filter(p => p.customerName === user?.name));
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setPayments(mockPayments.filter(p => p.customerName === user?.name));
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [user]);

  const filtered = payments.filter(p =>
    (!typeFilter || p.type === typeFilter) &&
    (!statusFilter || p.status === statusFilter)
  );

  const totalPaid = payments.filter(p => p.status === 'Verified').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const totalRejected = payments.filter(p => p.status === 'Rejected').reduce((s, p) => s + p.amount, 0);

  const handleDownload = (pay: Payment) => {
    toast(`Receipt for ${pay.type} downloaded`, 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy-900">Payment History</h1>
        <p className="text-navy-400 mt-1">Complete record of all your transactions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard label="Total Paid" value={formatCurrency(totalPaid)} icon={<CheckCircle2 className="w-6 h-6" />} accent="success" />
        <KPICard label="Pending" value={formatCurrency(totalPending)} icon={<Clock className="w-6 h-6" />} accent="warning" />
        <KPICard label="Rejected" value={formatCurrency(totalRejected)} icon={<XCircle className="w-6 h-6" />} accent="error" />
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} placeholder="All Types" options={[
            { value: 'Reservation Fee', label: 'Reservation Fee' },
            { value: 'Installment', label: 'Installment' },
            { value: 'Full Payment', label: 'Full Payment' },
          ]} className="flex-1" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="All Statuses" options={[
            { value: 'Verified', label: 'Verified' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Rejected', label: 'Rejected' },
          ]} className="flex-1" />
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState variant="inbox" title="No payments found" description="No transactions match your current filters." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-navy-400 border-b border-navy-100">
                  <th className="pb-3 pr-4 font-medium">Payment ID</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Apartment</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {filtered.map(pay => (
                  <tr key={pay.id} className="hover:bg-navy-50/30 transition-colors">
                    <td className="py-3.5 pr-4 font-mono text-xs text-navy-500">{pay.id}</td>
                    <td className="py-3.5 pr-4 font-medium text-navy-800">{pay.type}</td>
                    <td className="py-3.5 pr-4 font-serif font-bold text-navy-900">{formatCurrency(pay.amount)}</td>
                    <td className="py-3.5 pr-4 text-navy-600">{pay.apartmentTitle}</td>
                    <td className="py-3.5 pr-4 text-navy-400">{formatDate(pay.uploadedAt)}</td>
                    <td className="py-3.5 pr-4"><Badge variant={statusToVariant(pay.status)} dot size="sm">{pay.status}</Badge></td>
                    <td className="py-3.5 text-right">
                      {pay.status === 'Verified' ? (
                        <Button size="sm" variant="ghost" onClick={() => handleDownload(pay)} icon={<Download className="w-3.5 h-3.5" />}>Download</Button>
                      ) : <span className="text-xs text-navy-300">N/A</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
