import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, RefreshCw, X } from 'lucide-react';

export interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmModalProps {
  config: ConfirmModalConfig | null;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ config, onClose }) => {
  useEffect(() => {
    if (!config?.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        config.onCancel?.();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, onClose]);

  if (!config || !config.isOpen) return null;

  const variant = config.variant || 'danger';

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40',
          icon: <AlertTriangle className="w-6 h-6" />,
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs',
        };
      case 'primary':
        return {
          iconBg: 'bg-indigo-100 dark:bg-emerald-950/60 text-indigo-600 dark:text-emerald-400 border border-indigo-200 dark:border-emerald-800/40',
          icon: <RefreshCw className="w-6 h-6" />,
          confirmBtn: 'bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black shadow-xs',
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40',
          icon: <Trash2 className="w-6 h-6" />,
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-70 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      dir="rtl"
      onClick={() => {
        config.onCancel?.();
        onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#18191d] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-[#2a2b30] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles.iconBg}`}>
            {styles.icon}
          </div>
          <button
            type="button"
            onClick={() => {
              config.onCancel?.();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2b30] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Message */}
        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {config.title}
          </h3>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
            {config.message}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            autoFocus
            onClick={() => {
              config.onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${styles.confirmBtn}`}
          >
            {config.confirmText || 'تأیید و ادامه'}
          </button>
          <button
            type="button"
            onClick={() => {
              config.onCancel?.();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#24262b] hover:bg-slate-200 dark:hover:bg-[#2f3238] transition-colors cursor-pointer active:scale-95"
          >
            {config.cancelText || 'انصراف'}
          </button>
        </div>
      </div>
    </div>
  );
};
