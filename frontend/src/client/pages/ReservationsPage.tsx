import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Clock, MapPin, AlertCircle, Calendar } from 'lucide-react';
import type { Reservation } from '@/shared/types';
import { reservationService } from '@/shared/services/reservationService';
import { useAuth } from '@/shared/contexts/AuthContext';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Tabs from '@/shared/components/ui/Tabs';
import EmptyState from '@/shared/components/ui/EmptyState';
import { formatCurrency, formatDate, countdownTo } from '@/shared/utils/format';

export default function ReservationsPage() {
  const { user } = useAuth();
  const [rsvs, setRsvs] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!user?.email) {
      setLoading(false);
      return;
    }
    reservationService.getByCustomer(user.email)
      .then(data => {
        if (mounted) {
          setRsvs(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load reservations:', err);
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [user]);

  const renderCard = (rsv: Reservation) => {
    const countdown = countdownTo(rsv.expiresAt);
    const showCountdown = rsv.status === 'Pending' || rsv.status === 'Confirmed';
    return (
      <div key={rsv.id} className="bg-white rounded-xl shadow-card p-5 animate-fade-in">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <Link to={`/apartments/${rsv.apartmentId}`} className="font-serif font-semibold text-navy-900 hover:text-primary-600 transition-colors">{rsv.apartmentTitle}</Link>
            <p className="text-xs text-navy-400 mt-0.5">Reservation #{rsv.id}</p>
          </div>
          <Badge variant={statusToVariant(rsv.status)} dot>{rsv.status}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-navy-50">
          <div>
            <p className="text-xs text-navy-400 mb-0.5">Reservation Fee</p>
            <p className="text-lg font-serif font-bold text-navy-900">{formatCurrency(rsv.reservationFee)}</p>
          </div>
          <div>
            <p className="text-xs text-navy-400 mb-0.5">Created</p>
            <p className="text-sm font-medium text-navy-700">{formatDate(rsv.createdAt)}</p>
          </div>
        </div>
        {showCountdown && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${countdown.expired ? 'text-error-600' : 'text-warning-600'}`}>
            <Clock className="w-4 h-4" />
            <span className="font-medium">{countdown.text}</span>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          {rsv.status === 'Pending' && (
            <Link to="/payments" state={{ autoPayReservationId: rsv.id }}>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0">
                Pay 10% Deposit
              </Button>
            </Link>
          )}
          <Link to="/payments"><Button size="sm" variant="outline">View Payments</Button></Link>
          <Link to={`/apartments/${rsv.apartmentId}`}><Button size="sm" variant="ghost">View Apartment</Button></Link>
        </div>
      </div>
    );
  };

  const renderList = (statuses: string[]) => {
    const filtered = rsvs.filter(r => statuses.includes(r.status));
    if (loading) return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}</div>;
    if (filtered.length === 0) return <EmptyState variant="inbox" title="No reservations" description="You don't have any reservations in this category." action={<Link to="/apartments"><Button size="sm">Browse Apartments</Button></Link>} />;
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{filtered.map(renderCard)}</div>;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy-900">My Reservations</h1>
        <p className="text-navy-400 mt-1">Track your apartment reservations and their status</p>
      </div>
      <div className="bg-white rounded-2xl shadow-card p-6">
        <Tabs tabs={[
          { label: 'Active', content: renderList(['Pending', 'Confirmed']), badge: rsvs.filter(r => ['Pending', 'Confirmed'].includes(r.status)).length },
          { label: 'Expired & Cancelled', content: renderList(['Expired', 'Cancelled']), badge: rsvs.filter(r => ['Expired', 'Cancelled'].includes(r.status)).length },
        ]} />
      </div>
    </div>
  );
}
