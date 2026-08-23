import React from 'react';
import { Mail, Github, Send, Star, Code2, Sparkles, MessageCircle } from 'lucide-react';
import { LATEST_ANNOUNCEMENT } from '../data/announcementData';

interface FooterProps {
  onOpenAnnouncement?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAnnouncement }) => {
  return (
    <footer className="mt-12 mb-6 w-full print:hidden" dir="rtl">
      <div className="bg-slate-100/60 dark:bg-[#131416]/60 border border-slate-200 dark:border-[#2a2b30] rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-6 transition-colors duration-200">
        
        {/* Telegram Channel Callout Card with Animated Gradient */}
        <div className="w-full max-w-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 dark:from-blue-950/60 dark:via-indigo-950/60 dark:to-purple-950/60 animate-gradient border border-blue-200/80 dark:border-blue-800/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 text-right">
            <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Send className="w-5 h-5 -mr-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  کانال رسمی تلگرام UniSchedule
                </span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-black px-2 py-0.5 rounded-full">
                  اطلاع‌رسانی
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                برای آگاهی از انتشار نسخه‌های جدید، قابلیت‌های پیش‌رو و آموزش‌ها، در کانال تلگرام عضو شوید.
              </p>
            </div>
          </div>

          <a
            href="https://t.me/UniSchedule_aut"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span dir="ltr">@UniSchedule_aut</span>
          </a>
        </div>

        {/* Contact info and message */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-emerald-400 mb-2">
            <Code2 className="w-6 h-6" />
          </div>
          <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            جهت بهبود مستمر و ارتقای کیفیت این ابزار، صمیمانه پذیرای نظرات، پیشنهادات و گزارش مشکلات شما هستم.
            <br className="hidden md:block" />
            اگر این پروژه برایتان مفید واقع شد، با دادن ستاره در گیت‌هاب (<Star className="inline w-4 h-4 text-amber-500 fill-amber-500 mx-1 mb-1" />) از آن حمایت کنید.
          </p>
        </div>

        {/* Links & Actions */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 w-full">
          
          {/* Changelog / Release Notes Button */}
          {onOpenAnnouncement && (
            <button
              type="button"
              onClick={onOpenAnnouncement}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-emerald-950/40 border border-indigo-200 dark:border-emerald-800/50 hover:bg-indigo-100 dark:hover:bg-emerald-900/50 text-indigo-700 dark:text-emerald-300 rounded-xl text-xs sm:text-sm font-bold transition-all hover:shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>تغییرات آخرین نسخه ({LATEST_ANNOUNCEMENT.version})</span>
            </button>
          )}

          <a
            href="mailto:alimhm@aut.ac.ir"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1c1d21] border border-slate-200 dark:border-[#2a2b30] hover:border-indigo-300 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-all hover:shadow-xs"
          >
            <Mail className="w-4 h-4 text-rose-500" />
            <span dir="ltr">alimhm@aut.ac.ir</span>
          </a>
          
          <a
            href="https://t.me/alimhm_20"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1c1d21] border border-slate-200 dark:border-[#2a2b30] hover:border-indigo-300 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-all hover:shadow-xs"
          >
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <span dir="ltr">ارتباط مستقیم (@alimhm_20)</span>
          </a>

          <a
            href="https://github.com/AliMhM20"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1c1d21] border border-slate-200 dark:border-[#2a2b30] hover:border-indigo-300 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-all hover:shadow-xs"
          >
            <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
            <span>پروفایل گیت‌هاب</span>
          </a>

          <a
            href="https://github.com/AliMhM20/UniSchedule"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1c1d21] border border-slate-200 dark:border-[#2a2b30] hover:border-indigo-300 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-all hover:shadow-xs"
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span dir="ltr">UniSchedule Repository</span>
          </a>
        </div>

      </div>
    </footer>
  );
};
