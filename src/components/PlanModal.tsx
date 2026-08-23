import React, { useState, useEffect } from 'react';
import { X, Layers, AlertCircle } from 'lucide-react';
import { SchedulePlan } from '../types/schedule';
import { toPersianDigits } from '../utils/timeUtils';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  planToEdit?: SchedulePlan | null;
  isMainPlan?: boolean;
  defaultSuggestedName: string;
  onSave: (name: string) => void;
}

const MAX_NAME_LENGTH = 30;

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  mode,
  planToEdit,
  isMainPlan = false,
  defaultSuggestedName,
  onSave,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && planToEdit) {
        if (isMainPlan) {
          // If main plan, strip "برنامه اصلی" or "برنامه اصلی (...)"
          const match = planToEdit.name.match(/برنامه اصلی\s*\((.*?)\)/);
          setNameInput(match ? match[1] : (planToEdit.name === 'برنامه اصلی' ? '' : planToEdit.name.replace(/^برنامه اصلی\s*/, '')));
        } else {
          setNameInput(planToEdit.name);
        }
      } else {
        setNameInput(defaultSuggestedName);
      }
      setError(null);
    }
  }, [isOpen, mode, planToEdit, isMainPlan, defaultSuggestedName]);

  if (!isOpen) return null;

  const currentLength = nameInput.length;
  const isOverLimit = currentLength > MAX_NAME_LENGTH;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();

    if (!isMainPlan && !trimmed) {
      setError('لطفاً یک نام برای سناریو وارد کنید.');
      return;
    }

    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`نام سناریو نمی‌تواند بیشتر از ${toPersianDigits(MAX_NAME_LENGTH)} کاراکتر باشد.`);
      return;
    }

    let finalName = trimmed;
    if (isMainPlan) {
      finalName = trimmed ? `برنامه اصلی (${trimmed})` : 'برنامه اصلی';
    }

    onSave(finalName);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#131416] w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-[#2a2b30] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1c1d21] bg-slate-50/50 dark:bg-[#1c1d21]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-emerald-950/40 text-indigo-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-emerald-800/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                {mode === 'create' ? 'ایجاد سناریوی جدید' : (isMainPlan ? 'ویرایش نام برنامه اصلی' : 'ویرایش نام سناریو')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {mode === 'create' ? 'یک نام دلخواه برای مقایسه سناریوهای انتخاب واحد' : 'نام این سناریو را تغییر دهید'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c1d21] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {isMainPlan && (
            <div className="bg-indigo-50/70 dark:bg-emerald-950/30 p-3 rounded-2xl border border-indigo-100 dark:border-emerald-800/40 text-xs text-indigo-900 dark:text-emerald-300 font-medium leading-relaxed">
              💡 عبارت <strong>«برنامه اصلی»</strong> ثابت است؛ نام انتخابی شما درون پرانتز در کنار آن قرار می‌گیرد.
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isMainPlan ? 'عنوان تکمیلی برنامه اصلی (اختیاری):' : 'نام سناریو:'}
              </label>
              
              {/* Character Counter */}
              <span className={`text-[11px] font-bold ${
                isOverLimit 
                  ? 'text-rose-600 dark:text-rose-400' 
                  : currentLength >= 25 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-slate-400 dark:text-slate-500'
              }`}>
                {toPersianDigits(currentLength)} / {toPersianDigits(MAX_NAME_LENGTH)} کاراکتر
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                autoFocus
                maxLength={MAX_NAME_LENGTH + 5}
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={isMainPlan ? "مثال: پلن قطعی ترم ۶" : "مثال: سناریوی صبح‌ها"}
                className={`w-full h-11 bg-slate-50 dark:bg-[#0b0c0e] border rounded-xl px-3.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none transition-all ${
                  isOverLimit || error
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                    : 'border-slate-200 dark:border-[#2a2b30] focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500'
                }`}
              />
            </div>

            {/* Live Preview for Main Plan */}
            {isMainPlan && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                پیش‌نمایش: <span className="font-bold text-slate-700 dark:text-slate-300">
                  {nameInput.trim() ? `برنامه اصلی (${nameInput.trim()})` : 'برنامه اصلی'}
                </span>
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c1d21] rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isOverLimit || (!isMainPlan && !nameInput.trim())}
              className="px-5 py-2.5 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              {mode === 'create' ? 'ایجاد سناریو' : 'ذخیره تغییرات'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
