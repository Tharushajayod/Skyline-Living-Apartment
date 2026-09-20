import React, { forwardRef, isValidElement, type ComponentType, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

const baseInput = 'w-full bg-white border border-navy-200 rounded-lg px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-navy-50 disabled:text-navy-400';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode | ComponentType<{ className?: string }>;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    const renderIcon = () => {
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
      <div className="w-full">
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-navy-700 mb-1.5">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">{renderIcon()}</div>}
          <input
            ref={ref}
            id={inputId}
            className={`${baseInput} ${icon ? 'pl-10' : ''} ${error ? 'border-error-400 focus:border-error-500 focus:ring-error-100' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="w-full">
        {label && <label htmlFor={selectId} className="block text-sm font-medium text-navy-700 mb-1.5">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`${baseInput} appearance-none pr-10 ${error ? 'border-error-400' : ''} ${className}`}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div className="w-full">
        {label && <label htmlFor={textareaId} className="block text-sm font-medium text-navy-700 mb-1.5">{label}</label>}
        <textarea
          ref={ref}
          id={textareaId}
          className={`${baseInput} resize-y min-h-[100px] ${error ? 'border-error-400' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
