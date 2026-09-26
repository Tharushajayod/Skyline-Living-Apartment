import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-success-50 text-success-700 border-success-100',
  warning: 'bg-warning-50 text-warning-700 border-warning-100',
  error: 'bg-error-50 text-error-700 border-error-100',
  info: 'bg-primary-50 text-primary-700 border-primary-100',
  neutral: 'bg-navy-50 text-navy-600 border-navy-100',
  gold: 'bg-gold-50 text-gold-700 border-gold-100',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-primary-500',
  neutral: 'bg-navy-400',
  gold: 'bg-gold-500',
};

export default function Badge({ variant = 'neutral', children, dot, size = 'md', className = '' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${variants[variant]} ${sizeClasses} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

export function statusToVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    Available: 'success',
    Active: 'success',
    Approved: 'success',
    Verified: 'success',
    Confirmed: 'success',
    Published: 'success',
    Completed: 'success',
    Resolved: 'success',

    Pending: 'warning',
    Reserved: 'warning',
    'In Progress': 'warning',
    Rescheduled: 'warning',
    Expired: 'warning',

    Sold: 'error',
    Cancelled: 'error',
    Rejected: 'error',
    'No-show': 'error',
    Hidden: 'error',
    Inactive: 'error',

    Featured: 'gold',
    High: 'error',
    Medium: 'warning',
    Low: 'neutral',
  };
  return map[status] || 'neutral';
}
