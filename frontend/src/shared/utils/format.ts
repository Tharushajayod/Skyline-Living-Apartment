export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${Number(amount).toLocaleString('en-LK')}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function countdownTo(dateStr?: string | null): { text: string; expired: boolean; remainingSeconds: number } {
  if (!dateStr || !dateStr.trim()) return { text: 'Not started', expired: false, remainingSeconds: 0 };
  const target = new Date(dateStr).getTime();
  if (isNaN(target)) return { text: 'Invalid date', expired: true, remainingSeconds: 0 };
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return { text: 'Expired', expired: true, remainingSeconds: 0 };

  const remainingSeconds = Math.floor(diff / 1000);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return { text: `${days}d ${hours}h remaining`, expired: false, remainingSeconds };
  if (hours > 0) return { text: `${hours}h ${minutes}m remaining`, expired: false, remainingSeconds };
  return { text: `${minutes}m remaining`, expired: false, remainingSeconds };
}

export function initials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export * from './dateUtils';
export * from './errorHandler';
export * from './reservationTiming';

