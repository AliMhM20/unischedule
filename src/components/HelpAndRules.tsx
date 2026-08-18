import React from 'react';
import { ShieldCheck, AlertTriangle, Calendar, Clock, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';
import { toPersianDigits } from '../utils/timeUtils';

export const HelpAndRules: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Intro Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-indigo-600">
          <HelpCircle className="w-5 h-5" />
          <h2 className="text-base font-extrabold text-slate-900">
            راهنمای استفاده و قوانین سامانه انتخاب واحد
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          این سامانه جهت سهولت دانشجویان در برنامه‌ریزی دروس ترم آینده، کنترل دقیق تداخل ساعات کلاسی و جلوگیری از همزمانی امتحانات پایان ترم طراحی شده است.
        </p>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Rule 1: Class Overlap */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-600">
            <Clock className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-800">قانون ۱: کنترل تداخل کلاسی هفتگی</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            هیچ دو کلاسی در یک روز مشخص نمی‌توانند ساعت‌های مشترک یا هم‌پوشانی داشته باشند. به عنوان مثال:
          </p>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 space-y-1">
            <div>❌ <strong>غیرمجاز:</strong> درس اول دوشنبه ۱۰:۰۰ تا ۱۲:۰۰ و درس دوم دوشنبه ۱۱:۰۰ تا ۱۳:۰۰</div>
            <div>✅ <strong>مجاز:</strong> درس اول دوشنبه ۱۰:۰۰ تا ۱۲:۰۰ و درس دوم دوشنبه ۱۲:۰۰ تا ۱۴:۰۰</div>
          </div>
        </div>

        {/* Rule 2: Exam Overlap */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-600">
            <Calendar className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-800">قانون ۲: کنترل تداخل امتحانات پایان ترم</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            امتحانات پایان ترم در یک روز و ساعت یکسان مجاز نیستند. سامانه تاریخ‌های شمسی و ساعت آزمون را بررسی کرده و در صورت همزمانی مانع از ثبت درس می‌شود.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
            <div>❌ <strong>غیرمجاز:</strong> دو امتحان در تاریخ ۱۴۰۴/۱۰/۱۸ ساعت ۰۸:۳۰ صبح</div>
            <div>✅ <strong>مجاز:</strong> یک امتحان ساعت ۰۸:۳۰ صبح و امتحان دوم ساعت ۱۴:۰۰ بعد از ظهر</div>
          </div>
        </div>

      </div>

      {/* UX Features & Tips */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          امکانات و نکات سرعت عمل در کار با سامانه
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="font-bold text-slate-800">🖱️ کلیک مستقیم روی جدول:</div>
            <div>با کلیک روی هر بازه زمانی خالی در جدول، فرم درس جدید با همان روز و ساعت باز می‌شود.</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="font-bold text-slate-800">🔀 سناریوها و پلان‌های موازی:</div>
            <div>از منوی بالای صفحه می‌توانید پلان B یا پلان C بسازید و اساتید مختلف را بدون حذف برنامه اصلی مقایسه کنید.</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="font-bold text-slate-800">💾 ذخیره خودکار:</div>
            <div>تمامی برنامه‌های شما در مرورگر ذخیره می‌ماند و با بستن صفحه یا رفرش پاک نخواهد شد.</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="font-bold text-slate-800">🖨️ چاپ و خروجی PDF:</div>
            <div>با زدن دکمه پرینتر در نوار بالا، جدول هفتگی آماده ذخیره به صورت فایل PDF یا تصویر برای اشتراک با دوستان می‌شود.</div>
          </div>

        </div>
      </div>

    </div>
  );
};
