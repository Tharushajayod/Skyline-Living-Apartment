import React, { forwardRef, isValidElement, type ButtonHTMLAttributes, type ComponentType, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode | ComponentType<{ className?: string }>;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-600 font-bold shadow-sm shadow-amber-500/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-300 font-semibold disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 bg-white font-semibold disabled:text-slate-400 disabled:border-slate-200',
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium disabled:text-slate-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm font-semibold disabled:bg-rose-300',
  gold: 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 font-bold shadow-md shadow-amber-500/20 disabled:opacity-50',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-lg',
  md: 'h-11 px-6 text-sm rounded-lg',
  lg: 'h-13 px-8 text-base rounded-xl py-3.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => {
    const renderIcon = () => {
      if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
      if (!icon) return null;
      if (isValidElement(icon)) return icon;
      if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
        const IconComponent = icon as ComponentType<{ className?: string }>;
        try {
          return <IconComponent className="w-4 h-4" />;
        } catch {
          return null;
        }
      }
      return null;
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-smooth disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {renderIcon()}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
