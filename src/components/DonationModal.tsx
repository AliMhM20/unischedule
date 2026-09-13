import React, { useState, useEffect } from 'react';
import { Coffee, Heart, Sparkles, ExternalLink, X, CheckSquare, Square } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  isDismissed?: boolean;
  onClose: (dontShowAgain?: boolean) => void;
  showDontShowAgainOption?: boolean;
}

const REYMIT_URL = 'https://reymit.ir/unischedule';

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  isDismissed = false,
  onClose,
  showDontShowAgainOption = true,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(isDismissed);

  useEffect(() => {
    if (isOpen) {
      setDontShowAgain(isDismissed);
    }
  }, [isOpen, isDismissed]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose(dontShowAgain);
  };

  const handleGoToReymit = () => {
    // When user chooses to donate, suppress future auto-popups
    onClose(true);
  };

  return (
    <div
      className="fixed inset-0 z-55 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 print:hidden"
      dir="rtl"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[#18191d] rounded-3xl border border-slate-200 dark:border-[#2a2b30] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 sm:space-y-5 transition-colors duration-200 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-orange-500/15 dark:bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Bar: Icon badge, Title & Close 'X' Button */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  یه فنجون قهوه مهمونم کن!
                </h3>
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/50 px-2.5 py-0.5 rounded-full mt-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                <span>حمایت از توسعه UniSchedule</span>
              </span>
            </div>
          </div>

          {/* Close 'X' button */}
          <button
            type="button"
            onClick={handleClose}
            title="بستن پنجره"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2b30] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Humorous & Friendly Copy Card */}
        <div className="relative z-10 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-800/40 rounded-2xl p-4 text-right space-y-2.5">
          <p className="text-sm font-black text-amber-950 dark:text-amber-200 leading-relaxed">
            خوشگل بلا، یعنی می‌خوای بگی استفاده از <span className="text-amber-600 dark:text-amber-400 font-black">یونی‌اسکجول</span> رو دوست داشتی و کلی به کارت اومد، ولی نمی‌خوای یه فنجون قهوه مهمونم کنی؟ 😄
          </p>
          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
            اگه شیک نوتلا باشه که چه بهتر! 🥤🍫 (((:
          </p>
        </div>

        {/* Sincere Informational Subtext */}
        <div className="relative z-10 text-xs leading-relaxed text-slate-600 dark:text-slate-400 space-y-2 text-right">
          <p>
            یونی‌اسکجول یک پروژه دانشجویی رایگان و متن‌باز (Open Source) است. دونیت و حمایت مالی شما، هرچند کوچک، به من کلی انرژی میده که به توسعه این برنامه ادامه بدم و یه خستگی به در کنم ❤️.
          </p>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>🔒</span>
            <span>پرداخت امن و مطمئن از طریق درگاه شتاب رِیمیت (Reymit)</span>
          </div>
        </div>

        {/* "Don't show again" Checkbox Option */}
        {showDontShowAgainOption && (
          <button
            type="button"
            onClick={() => setDontShowAgain((prev) => !prev)}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none text-right ${
              dontShowAgain
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500/20'
                : 'bg-slate-50 dark:bg-[#131416] border-slate-200 dark:border-[#2a2b30] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c1d21]'
            }`}
          >
            {dontShowAgain ? (
              <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            )}
            <span className="text-[11.5px] sm:text-xs font-bold">
              این اعلان را دیگر به صورت خودکار نشان نده
            </span>
          </button>
        )}

        {/* Action Buttons */}
        <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center gap-2.5 border-t border-slate-100 dark:border-[#2a2b30]">
          {/* External Donate Link */}
          <a
            href={REYMIT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleGoToReymit}
            className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-center whitespace-nowrap"
          >
            <Coffee className="w-4 h-4" />
            <span>ورود به درگاه دونیت رِیمیت</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          {/* Cancel / Maybe later */}
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#25262c] rounded-2xl transition-colors cursor-pointer text-center"
          >
            فعلاً نه، شاید بعداً 🥀
          </button>
        </div>
      </div>
    </div>
  );
};
