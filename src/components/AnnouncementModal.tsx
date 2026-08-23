import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, Send, CheckSquare, Square, 
  Layers, BookOpen, Calendar, ArrowLeft, X
} from 'lucide-react';
import { LATEST_ANNOUNCEMENT } from '../data/announcementData';

interface AnnouncementModalProps {
  isOpen: boolean;
  isDismissed: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  isDismissed,
  onClose,
}) => {
  // Sync checkbox with the current localStorage state
  const [dontShowAgain, setDontShowAgain] = useState(isDismissed);

  useEffect(() => {
    if (isOpen) {
      setDontShowAgain(isDismissed);
    }
  }, [isOpen, isDismissed]);

  if (!isOpen) return null;

  const data = LATEST_ANNOUNCEMENT;

  const handleConfirm = () => {
    onClose(dontShowAgain);
  };

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
      dir="rtl"
    >
      <div className="bg-white dark:bg-[#131416] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-[#2a2b30] animate-in zoom-in-95 duration-200">
        
        {/* Header with vibrant Animated Gradient banner */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-[#007048] dark:via-[#009e63] dark:to-[#004d31] animate-gradient text-white p-6 sm:p-7 shrink-0 overflow-hidden">
          {/* Subtle background glow circle */}
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>نسخه {data.version}</span>
                </span>

                {data.badge && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shadow-xs">
                    {data.badge}
                  </span>
                )}

                <span className="text-white/80 text-xs font-medium">
                  {data.date}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug">
                {data.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-slate-50 dark:bg-[#0b0c0e]">
          
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {data.description}
          </p>

          {/* Categories */}
          <div className="space-y-4">
            {data.categories.map((cat, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-[#131416] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#2a2b30] shadow-2xs space-y-3"
              >
                <div className="flex items-center gap-2 text-indigo-600 dark:text-emerald-400">
                  {idx === 0 ? <BookOpen className="w-4 h-4" /> : idx === 1 ? <Layers className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {cat.title}
                  </h3>
                </div>

                <ul className="space-y-2 pr-1">
                  {cat.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Telegram Channel Callout (with Animated Gradient) */}
          {data.telegramChannel && (
            <div className="bg-gradient-to-r from-blue-500/15 via-indigo-500/20 to-purple-500/15 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 animate-gradient border border-blue-200/80 dark:border-blue-800/60 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-2xs">
              <div className="flex items-center gap-3.5 text-right">
                <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Send className="w-5 h-5 -mr-0.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-blue-950 dark:text-blue-200">
                    کانال رسمی تلگرام UniSchedule
                  </h4>
                  <p className="text-[11px] sm:text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                    برای باخبر شدن از جدیدترین آپدیت‌ها و اخبار سامانه عضو شوید.
                  </p>
                </div>
              </div>

              <a
                href={data.telegramChannel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>عضویت در کانال</span>
              </a>
            </div>
          )}

        </div>

        {/* Footer with High-Visibility Checkbox and Confirm Button */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#131416] border-t border-slate-200 dark:border-[#2a2b30] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          
          {/* Prominent & Eye-Catching Checkbox */}
          <button
            type="button"
            onClick={() => setDontShowAgain(prev => !prev)}
            className={`flex items-center gap-3 p-3 sm:px-4 sm:py-2.5 rounded-2xl border transition-all cursor-pointer select-none ${
              dontShowAgain
                ? 'bg-indigo-50 dark:bg-emerald-950/50 border-indigo-300 dark:border-emerald-700 text-indigo-950 dark:text-emerald-200 ring-2 ring-indigo-500/20 dark:ring-emerald-500/20 shadow-xs'
                : 'bg-slate-100/90 dark:bg-[#1c1d21] border-slate-200 dark:border-[#2a2b30] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-200/60'
            }`}
          >
            {dontShowAgain ? (
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Square className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-black leading-snug">
              این پیام را دیگر برای این نسخه نشان نده
            </span>
          </button>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-3 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs sm:text-sm font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>متوجه شدم و ورود به برنامه</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

        </div>

      </div>
    </div>
  );
};
