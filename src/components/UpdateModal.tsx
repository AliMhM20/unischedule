import React from 'react';
import { 
  X, RefreshCw, WifiOff, CheckCircle2, 
  Download, AlertTriangle, Sparkles, ExternalLink 
} from 'lucide-react';
import { UpdateInfo } from '../utils/updateChecker';
import { toPersianDigits } from '../utils/timeUtils';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  onCheckAgain: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  isChecking,
  onCheckAgain,
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!updateInfo?.downloadUrl) return;
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(updateInfo.downloadUrl);
    } else {
      window.open(updateInfo.downloadUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-[#2e3036] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#2a2b30] bg-slate-50/50 dark:bg-[#151619]/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-emerald-950/40 text-indigo-600 dark:text-emerald-400 border border-indigo-100 dark:border-emerald-800/40">
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </div>
            <h3 className="font-bold text-sm sm:text-base">بررسی به‌روزرسانی برنامه</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#25272c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* State 1: Checking */}
          {isChecking && (
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 dark:bg-emerald-950/30 text-indigo-600 dark:text-emerald-400">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
              <h4 className="font-bold text-sm">در حال ارتباط با سرور...</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                بررسی وضعیت شبکه و استعلام آخرین نسخه منتشر شده از گیت‌هاب
              </p>
            </div>
          )}

          {/* State 2: No Internet */}
          {!isChecking && updateInfo?.status === 'no_internet' && (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400">
                <WifiOff className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">ارتباط با اینترنت برقرار نیست</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                برای بررسی نسخه جدید، اتصال دستگاه به اینترنت ضروری است. لطفاً وضعیت اینترنت را چک کنید.
              </p>
              <div className="mt-3 flex gap-2 w-full">
                <button
                  type="button"
                  onClick={onCheckAgain}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  تلاش مجدد
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-slate-100 dark:bg-[#25272c] hover:bg-slate-200 dark:hover:bg-[#2f3238] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </div>
          )}

          {/* State 3: Up to Date */}
          {!isChecking && updateInfo?.status === 'up_to_date' && (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">برنامه شما به‌روز است!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                شما هم‌اکنون از آخرین نسخه رسمی برنامه (نسخه {toPersianDigits(updateInfo.currentVersion)}) استفاده می‌کنید و نیاز به آپدیت ندارید.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full py-2.5 px-4 bg-slate-100 dark:bg-[#25272c] hover:bg-slate-200 dark:hover:bg-[#2f3238] text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          )}

          {/* State 4: Update Available */}
          {!isChecking && updateInfo?.status === 'update_available' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-emerald-950/30 border border-indigo-100 dark:border-emerald-800/30">
                <div className="p-2.5 rounded-xl bg-indigo-600 dark:bg-[#00B87C] text-white dark:text-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    نسخه جدید {toPersianDigits(updateInfo.latestVersion || '')} منتشر شد!
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    نسخه فعلی شما: {toPersianDigits(updateInfo.currentVersion)}
                    {updateInfo.publishedAt && ` • تاریخ: ${updateInfo.publishedAt}`}
                  </p>
                </div>
              </div>

              {/* Release Notes */}
              {updateInfo.releaseNotes && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تغییرات این نسخه:</span>
                  <div className="p-3 bg-slate-50 dark:bg-[#151619] rounded-xl border border-slate-200 dark:border-[#2a2b30] text-xs text-slate-600 dark:text-slate-300 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                    {updateInfo.releaseNotes}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  دریافت و دانلود نسخه جدید
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-slate-100 dark:bg-[#25272c] hover:bg-slate-200 dark:hover:bg-[#2f3238] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  بعداً
                </button>
              </div>
            </div>
          )}

          {/* State 5: Error */}
          {!isChecking && updateInfo?.status === 'error' && (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">خطا در بررسی به‌روزرسانی</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                {updateInfo.errorMessage || 'امکان دریافت اطلاعات از سرور وجود ندارد.'}
              </p>
              <div className="mt-3 flex gap-2 w-full">
                <button
                  type="button"
                  onClick={onCheckAgain}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  تلاش دوباره
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-slate-100 dark:bg-[#25272c] hover:bg-slate-200 dark:hover:bg-[#2f3238] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
