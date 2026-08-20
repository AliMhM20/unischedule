import React, { useState, useEffect } from 'react';
import { 
  X, RefreshCw, WifiOff, CheckCircle2, 
  Download, AlertTriangle, Sparkles, ExternalLink,
  Zap, Power, HardDriveDownload
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
  } | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Subscribe to Electron AutoUpdater events
  useEffect(() => {
    if (!isOpen) {
      setIsDownloading(false);
      setIsDownloaded(false);
      setDownloadProgress(null);
      setDownloadError(null);
      return;
    }

    if (!window.electronAPI) return;

    const unbindProgress = window.electronAPI.onDownloadProgress((prog) => {
      setIsDownloading(true);
      setDownloadProgress(prog);
    });

    const unbindDownloaded = window.electronAPI.onUpdateDownloaded(() => {
      setIsDownloading(false);
      setIsDownloaded(true);
    });

    const unbindError = window.electronAPI.onUpdateError((err) => {
      setIsDownloading(false);
      setDownloadError(err || 'خطا در فرآیند دانلود خودکار');
    });

    return () => {
      unbindProgress?.();
      unbindDownloaded?.();
      unbindError?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartDownload = async () => {
    setDownloadError(null);
    if (window.electronAPI?.startDownloadUpdate) {
      setIsDownloading(true);
      const res = await window.electronAPI.startDownloadUpdate();
      if (!res.success) {
        setIsDownloading(false);
        setDownloadError(res.error || 'امکان شروع دانلود خودکار وجود ندارد.');
      }
    } else if (updateInfo?.downloadUrl) {
      window.open(updateInfo.downloadUrl, '_blank');
    }
  };

  const handleQuitAndInstall = () => {
    if (window.electronAPI?.quitAndInstall) {
      window.electronAPI.quitAndInstall();
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '۰ مگابایت';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${toPersianDigits(mb.toFixed(1))} مگابایت`;
    const kb = bytes / 1024;
    return `${toPersianDigits(kb.toFixed(0))} کیلوبایت`;
  };

  const formatSpeed = (bps: number): string => {
    if (!bps || bps <= 0) return '۰ مگابایت/ثانیه';
    const mbps = bps / (1024 * 1024);
    if (mbps >= 0.1) return `${toPersianDigits(mbps.toFixed(2))} مگابایت/ثانیه`;
    const kbps = bps / 1024;
    return `${toPersianDigits(kbps.toFixed(0))} کیلوبایت/ثانیه`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-[#2e3036] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#2a2b30] bg-slate-50/50 dark:bg-[#151619]/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-emerald-950/40 text-indigo-600 dark:text-emerald-400 border border-indigo-100 dark:border-emerald-800/40">
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </div>
            <h3 className="font-bold text-sm sm:text-base">به‌روزرسانی نرم‌افزار</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#25272c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* State 1: Checking */}
          {isChecking && (
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 dark:bg-emerald-950/30 text-indigo-600 dark:text-emerald-400">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
              <h4 className="font-bold text-sm">در حال بررسی نسخه جدید...</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                استعلام آخرین تغییرات از سرور گیت‌هاب
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
                برای بررسی و دریافت آپدیت تفاضلی، اتصال به اینترنت لازم است. لطفاً وضعیت شبکه خود را بررسی کنید.
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

          {/* State 3: Up to Date (Or Local Version is Newer) */}
          {!isChecking && updateInfo?.status === 'up_to_date' && (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">برنامه شما کاملاً به‌روز است!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                نسخه فعلی شما ({toPersianDigits(updateInfo.currentVersion)}) آخرین نسخه منتشر شده است و نیازی به به‌روزرسانی ندارید.
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

          {/* State 4: Update Available & Download Flow */}
          {!isChecking && updateInfo?.status === 'update_available' && (
            <div className="flex flex-col gap-4">
              
              {/* Ready to Install State */}
              {isDownloaded ? (
                <div className="flex flex-col items-center text-center py-2 gap-3">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 animate-bounce">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    آپدیت تفاضلی با موفقیت دانلود شد!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    فایل‌های جدید آماده اعمال هستند. با زدن دکمه زیر، برنامه در عرض چند ثانیه ری‌استارت شده و با نسخه جدید باز می‌شود (اطلاعات و دروس شما دست‌نخورده باقی می‌ماند).
                  </p>

                  <button
                    type="button"
                    onClick={handleQuitAndInstall}
                    className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Power className="w-4 h-4" />
                    آپدیت و راه‌اندازی مجدد برنامه
                  </button>
                </div>
              ) : isDownloading ? (
                /* Downloading Progress State */
                <div className="flex flex-col gap-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDriveDownload className="w-4 h-4 text-indigo-600 dark:text-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold">در حال دانلود آپدیت تفاضلی...</span>
                    </div>
                    <span className="text-xs font-black text-indigo-600 dark:text-emerald-400">
                      {toPersianDigits(Math.round(downloadProgress?.percent || 0))}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-slate-100 dark:bg-[#25272c] rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-[#383a40]">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${downloadProgress?.percent || 0}%` }}
                    />
                  </div>

                  {/* Stats: Transferred / Total & Speed */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span>
                      {formatBytes(downloadProgress?.transferred || 0)} از {formatBytes(downloadProgress?.total || 0)}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Zap className="w-3 h-3 text-amber-500" />
                      {formatSpeed(downloadProgress?.bytesPerSecond || 0)}
                    </span>
                  </div>

                  {downloadError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{downloadError}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Update Available Overview State */
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-emerald-950/30 border border-indigo-100 dark:border-emerald-800/30">
                    <div className="p-2.5 rounded-xl bg-indigo-600 dark:bg-[#00B87C] text-white dark:text-black shrink-0">
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
                      <div className="p-3 bg-slate-50 dark:bg-[#151619] rounded-xl border border-slate-200 dark:border-[#2a2b30] text-xs text-slate-600 dark:text-slate-300 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                        {updateInfo.releaseNotes}
                      </div>
                    </div>
                  )}

                  {downloadError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{downloadError}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleStartDownload}
                      className="flex-1 py-2.5 px-4 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      دانلود خودکار (کم‌حجم)
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-2.5 px-4 bg-slate-100 dark:bg-[#25272c] hover:bg-slate-200 dark:hover:bg-[#2f3238] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      بعداً
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* State 5: General Error */}
          {!isChecking && updateInfo?.status === 'error' && (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">خطا در دریافت وضعیت نسخه</h4>
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
