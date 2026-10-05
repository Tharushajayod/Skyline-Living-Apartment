import { useEffect, useRef, useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';

interface SignOutConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export default function SignOutConfirmModal({
  open,
  onClose,
  onConfirm,
  triggerRef,
}: SignOutConfirmModalProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Save previous active element for focus restoration if triggerRef not provided
    const previousActiveElement = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    // Shift initial focus to the secondary Cancel button to prevent accidental Enter -> Sign Out
    const timer = setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isSigningOut) {
          e.preventDefault();
          onClose();
        }
      } else if (e.key === 'Tab') {
        // Simple focus trap within dialog
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);

      // Restore focus to trigger button or previously active element
      if (triggerRef?.current) {
        triggerRef.current.focus();
      } else if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [open, onClose, isSigningOut, triggerRef]);

  if (!open) return null;

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error('Logout error:', err);
      setIsSigningOut(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-dialog-title"
      aria-describedby="signout-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isSigningOut) onClose();
        }}
      />

      {/* Compact Centered Modal Window */}
      <div
        ref={dialogRef}
        className="relative bg-white rounded-3xl shadow-xl border border-slate-200/90 w-full max-w-sm p-6 animate-in zoom-in-95 duration-150 overflow-hidden"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="signout-dialog-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Sign out?
            </h3>
            <p id="signout-dialog-desc" className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to sign out of your Skyline Living account?
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-2">
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={isSigningOut}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSigningOut}
            onClick={handleSignOut}
            className="px-4.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shadow-rose-600/25"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
