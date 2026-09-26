import React, { isValidElement, type ComponentType, type ReactNode } from 'react';
import { AlertTriangle, Inbox, SearchX } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode | ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'search' | 'inbox';
}

export default function EmptyState({ icon, title, description, action, variant = 'default' }: EmptyStateProps) {
  const defaultIcons = {
    default: <AlertTriangle className="w-12 h-12 text-navy-300" />,
    search: <SearchX className="w-12 h-12 text-navy-300" />,
    inbox: <Inbox className="w-12 h-12 text-navy-300" />,
  };

  const renderIcon = () => {
    if (!icon) return defaultIcons[variant];
    if (isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComponent = icon as ComponentType<{ className?: string }>;
      try {
        return <IconComponent className="w-12 h-12 text-navy-300" />;
      } catch {
        return defaultIcons[variant];
      }
    }
    return defaultIcons[variant];
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      <div className="mb-4 flex items-center justify-center w-20 h-20 rounded-full bg-navy-50">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-serif font-semibold text-navy-800 mb-2">{title}</h3>
      {description && <p className="text-sm text-navy-400 max-w-md mb-6">{description}</p>}
      {action}
    </div>
  );
}
