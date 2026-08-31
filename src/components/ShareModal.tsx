import React, { useState, useMemo } from 'react';
import { SchedulePlan } from '../types/schedule';
import { getShareUrl } from '../utils/shareUtils';
import { toPersianDigits } from '../utils/timeUtils';
import { Share2, Copy, Check, X, Link, FileText, Sparkles } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  plan: SchedulePlan;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  plan,
  onClose,
}) => {
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate share URL dynamically based on options
  const shareUrl = useMemo(() => {
    if (!isOpen || !plan) return '';
    return getShareUrl(plan, includeNotes);
  }, [isOpen, plan, includeNotes]);

  if (!isOpen || !plan) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers or non-HTTPS
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const totalUnits = (plan.courses || []).reduce((acc, c) => acc + (Number(c.credits) || 0), 0);
  const coursesCount = (plan.courses || []).length;
  const coursesWithNotesCount = (plan.courses || []).filter(c => c.notes && c.notes.trim().length > 0).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in print:hidden"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#18191d] rounded-3xl border border-slate-200 dark:border-[#2a2b30] shadow-2xl max-w-md w-full p-6 space-y-5 transition-colors duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2a2b30] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-emerald-950/40 flex items-center justify-center text-indigo-600 dark:text-emerald-400 border border-indigo-200 dark:border-emerald-800/50 shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>اشتراک‌گذاری برنامه</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-emerald-400 bg-indigo-50 dark:bg-emerald-950/60 border border-indigo-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  <span>لینک مستقیم</span>
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                برنامه: <strong className="text-slate-800 dark:text-slate-200">{plan.name}</strong> ({toPersianDigits(coursesCount)} درس - {toPersianDigits(totalUnits)} واحد)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2b30] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 space-y-2">
          <p>
            با کپی کردن این لینک، دوستان شما می‌توانند بدون نیاز به ثبت‌نام یا لاگین، برنامه هفتگی و زمان امتحانات شما را در مرورگر خود مشاهده کنند یا با یک کلیک به برنامه‌های خود اضافه نمایند.
          </p>
        </div>

        {/* Link Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5 text-indigo-500 dark:text-emerald-400" />
            <span>لینک اختصاصی برنامه:</span>
          </label>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#131416] p-2 rounded-2xl border border-slate-200 dark:border-[#2a2b30]">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full bg-transparent text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none px-2 select-all overflow-hidden text-ellipsis direction-ltr text-left"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-[#00B87C] dark:hover:bg-[#00d18d] text-white dark:text-black'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی لینک</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="pt-1">
          <div
            onClick={() => setIncludeNotes(!includeNotes)}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
              includeNotes
                ? 'bg-indigo-50/90 dark:bg-emerald-950/40 border-indigo-300 dark:border-emerald-600/70 text-indigo-950 dark:text-emerald-200 ring-1 ring-indigo-500/20 dark:ring-emerald-500/20 shadow-xs'
                : 'bg-slate-50 dark:bg-[#131416] border-slate-200 dark:border-[#2a2b30] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c1d21]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                includeNotes
                  ? 'bg-indigo-600 dark:bg-[#00B87C] text-white dark:text-black'
                  : 'bg-slate-200 dark:bg-[#25262c] text-slate-500 dark:text-slate-400'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-right">
                <span className="text-xs font-bold block">اشتراک یادداشت‌های اختصاصی دروس</span>
                <span className="text-[10px] opacity-80 block mt-0.5">
                  {coursesWithNotesCount > 0
                    ? `${toPersianDigits(coursesWithNotesCount)} درس دارای یادداشت هستند`
                    : 'دروسی با یادداشت اختصاصی در این برنامه ثبت نشده است'}
                </span>
              </div>
            </div>

            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 mr-2 ${
              includeNotes
                ? 'bg-indigo-600 dark:bg-[#00B87C] border-indigo-600 dark:border-[#00B87C] text-white dark:text-black shadow-2xs'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#18191d]'
            }`}>
              {includeNotes && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-[#2a2b30]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2a2b30] rounded-xl transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
