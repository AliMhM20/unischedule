import React from 'react';
import { Mail, Github, Send, Star, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 mb-6 w-full print:hidden">
      <div className="bg-slate-100/50 dark:bg-[#131416]/50 border border-slate-200 dark:border-[#2a2b30] rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-6 transition-colors duration-200">
        
        {/* Contact info and message */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
            <Code2 className="w-6 h-6" />
          </div>
          <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            جهت بهبود مستمر و ارتقای کیفیت این ابزار، صمیمانه پذیرای نظرات، پیشنهادات و گزارش مشکلات شما هستم.
            <br className="hidden md:block" />
            اگر این پروژه برایتان مفید واقع شد، با دادن ستاره در گیت‌هاب (<Star className="inline w-4 h-4 text-amber-500 fill-amber-500 mx-1 mb-1" />) از آن حمایت کنید.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 w-full">
          <a
            href="mailto:alimhm@aut.ac.ir"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1c1d21] border border-slate-200 dark:border-[#2a2b30] hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-all hover:shadow-sm"
          >
            <Mail className="w-4 h-4 text-rose-500" />
            <span dir="ltr">alimhm@aut.ac.ir</span>
          </a>
          
          <a
            href="https://t.me/alimhm_20"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1c1d21] border border-slate-200 dark:border-[#2a2b30] hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-all hover:shadow-sm"
          >
            <Send className="w-4 h-4 text-blue-500" />
            <span dir="ltr">@alimhm_20</span>
          </a>

          <a
            href="https://github.com/AliMhM20"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1c1d21] border border-slate-200 dark:border-[#2a2b30] hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-all hover:shadow-sm"
          >
            <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
            <span>پروفایل گیت‌هاب</span>
          </a>

          <a
            href="https://github.com/AliMhM20/UniSchedule"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs sm:text-sm font-bold transition-all hover:shadow-sm"
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span dir="ltr">UniSchedule Repository</span>
          </a>
        </div>

      </div>
    </footer>
  );
};
