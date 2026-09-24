import React, { isValidElement, type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: ReactNode | ComponentType<{ className?: string }>;
  accent?: 'primary' | 'navy' | 'gold' | 'success' | 'warning' | 'error';
  to?: string;
}

const accents = {
  primary: 'bg-primary-50 text-primary-600',
  navy: 'bg-navy-50 text-navy-600',
  gold: 'bg-gold-50 text-gold-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
};

export default function KPICard({ label, value, change, icon, accent = 'primary', to }: KPICardProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComponent = icon as ComponentType<{ className?: string }>;
      try {
        return <IconComponent className="w-6 h-6" />;
      } catch {
        return null;
      }
    }
    return null;
  };

  const content = (
    <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-300 p-4 sm:p-6 h-full group">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${accents[accent]}`}>
          {renderIcon()}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs sm:text-sm font-medium ${change >= 0 ? 'text-success-600' : 'text-error-600'}`}>
            {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-serif font-bold text-navy-900 mb-1 truncate" title={String(value)}>{value}</p>
        <p className="text-xs sm:text-sm text-navy-400 truncate">{label}</p>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{content}</Link>;
  }
  return content;
}
