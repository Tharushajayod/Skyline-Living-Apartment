import { useEffect, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'gold';
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-sm p-6 animate-scale-in">
        <div className="flex items-start gap-4">
          <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-error-50' : variant === 'gold' ? 'bg-gold-50' : 'bg-primary-50'}`}>
            <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-error-600' : variant === 'gold' ? 'text-gold-600' : 'text-primary-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-serif font-semibold text-navy-900 mb-1">{title}</h3>
            <p className="text-sm text-navy-500 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={variant === 'danger' ? 'danger' : variant === 'gold' ? 'gold' : 'primary'} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
