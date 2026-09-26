import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-success-600" />,
  error: <XCircle className="w-5 h-5 text-error-600" />,
  info: <Info className="w-5 h-5 text-primary-600" />,
  warning: <AlertCircle className="w-5 h-5 text-warning-600" />,
};

const borders = {
  success: 'border-l-success-500',
  error: 'border-l-error-500',
  info: 'border-l-primary-500',
  warning: 'border-l-warning-500',
};

import { getFriendlyErrorMessage } from '@/shared/utils/errorHandler';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const cleanMessage = type === 'error' ? getFriendlyErrorMessage(message) : (message || '');
    setToasts(prev => [...prev, { id, type, message: cleanMessage }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start gap-3 bg-white rounded-xl shadow-elevated border border-navy-100 border-l-4 ${borders[t.type]} px-4 py-3.5 animate-slide-in-right`}
          >
            {icons[t.type]}
            <p className="text-sm text-navy-800 flex-1 leading-snug">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-navy-300 hover:text-navy-700 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
