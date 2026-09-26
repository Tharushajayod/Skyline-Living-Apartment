import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  footer?: ReactNode;
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  '3xl': 'max-w-6xl',
};

export default function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-elevated w-full ${sizes[size]} max-h-[94vh] sm:max-h-[90vh] flex flex-col animate-scale-in overflow-hidden`}>
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-navy-100 shrink-0">
            <h2 className="text-lg sm:text-xl font-serif font-semibold text-navy-900 truncate pr-2">{title}</h2>
            <button onClick={onClose} className="text-navy-400 hover:text-navy-900 hover:bg-navy-50 rounded-lg p-1.5 transition-colors cursor-pointer shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto scrollbar-thin flex-1 min-h-0">{children}</div>
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-2xl flex items-center justify-end gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
