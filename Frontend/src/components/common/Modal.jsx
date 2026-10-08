import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

/** Bottom-sheet style modal that matches the mobile cards. */
const Modal = ({ open, onClose, title, children, className, dark = false }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          'relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-[24px] sm:rounded-[24px] p-6 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]',
          dark ? 'bg-[#1E293B] text-white' : 'bg-white',
          className
        )}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between mb-4">
            <h2 className={clsx('text-[16px] font-bold', dark ? 'text-white' : 'text-text-primary')}>{title}</h2>
            {onClose && (
              <button onClick={onClose} className="p-1.5 rounded-full text-text-secondary hover:bg-black/5 active:scale-95" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
