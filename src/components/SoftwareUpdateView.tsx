import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, WifiOff, CheckCircle2, Download, 
  AlertTriangle, Sparkles, ExternalLink, Zap, 
  Power, HardDriveDownload, ShieldCheck, Send, Globe,
  Cpu, ArrowUpCircle
} from 'lucide-react';
import { UpdateInfo, checkForAppUpdates, CURRENT_APP_VERSION } from '../utils/updateChecker';
import { toPersianDigits } from '../utils/timeUtils';

const GITHUB_API_URL = 'https://api.github.com/repos/AliMhM20/unischedule/releases/latest';
const TELEGRAM_SUPPORT_URL = 'https://t.me/alimhm_20';

export const SoftwareUpdateView: React.FC = () => {
  const [currentVersion, setCurrentVersion] = useState<string>(CURRENT_APP_VERSION);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
  } | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Initialize version and auto-check on view mount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (window.electronAPI?.getVersion) {
        try {
          const ver = await window.electronAPI.getVersion();
          if (isMounted && ver) {
            setCurrentVersion(ver);
          }
        } catch (e) {
          // fallback to CURRENT_APP_VERSION
        }
      }
      runUpdateCheck();
    }

    init();

    // Subscribe to Electron AutoUpdater events
    if (window.electronAPI) {
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
        isMounted = false;
        unbindProgress?.();
        unbindDownloaded?.();
        unbindError?.();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const runUpdateCheck = async () => {
    setIsChecking(true);
    setDownloadError(null);
    try {
      const ver = (await window.electronAPI?.getVersion?.()) || currentVersion;
      const info = await checkForAppUpdates(ver);
      setUpdateInfo(info);
    } catch (e) {
      setUpdateInfo({
        status: 'error',
        currentVersion,
        errorMessage: 'خطا در برقراری ارتباط با سرور به‌روزرسانی.',
      });
    } finally {
      setIsChecking(false);
    }
  };

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
      if (window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(updateInfo.downloadUrl);
      } else {
        window.open(updateInfo.downloadUrl, '_blank');
      }
    }
  };

  const handleQuitAndInstall = () => {
    if (window.electronAPI?.quitAndInstall) {
      window.electronAPI.quitAndInstall();
    }
  };

  const openUrl = (url: string) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
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
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-[#1c1d21] border border-slate-200 dark:border-[#2a2b30] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-emerald-950/40 text-indigo-600 dark:text-emerald-400 flex items-center justify-center border border-indigo-100 dark:border-emerald-800/40 shrink-0">
            <ArrowUpCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              مرکز به‌روزرسانی نرم‌افزار
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              بررسی سلامت نسخه، دریافت خودکار تغییرات جدید و هماهنگ‌سازی پایگاه داده
            </p>
          </div>
        </div>

        {/* Version Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#131416] border border-slate-200 dark:border-[#2a2b30] rounded-2xl shrink-0">
          <Cpu className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            نسخه فعلی: <span className="font-mono text-indigo-600 dark:text-emerald-400">{toPersianDigits(currentVersion)}</span>
          </span>
        </div>
      </div>

      {/* Main Status Container */}
      <div className="bg-white dark:bg-[#1c1d21] border border-slate-200 dark:border-[#2a2b30] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 transition-colors">
        
        {/* STATE 1: CHECKING */}
        {isChecking && (
          <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-emerald-950/30 text-indigo-600 dark:text-emerald-400">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">در حال بررسی نسخه جدید...</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                استعلام وضعیت مخزن و آخرین بسته‌های منتشر شده از سرور
              </p>
            </div>
          </div>
        )}

        {/* STATE 2: UP TO DATE */}
        {!isChecking && updateInfo?.status === 'up_to_date' && (
          <div className="flex flex-col items-center justify-center text-center py-10 gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100">
                برنامه شما کاملاً به‌روز است!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                شما در حال حاضر از آخرین نگارش رسمی نرم‌افزار UniSchedule (نسخه {toPersianDigits(currentVersion)}) استفاده می‌کنید و نیازی به دریافت به‌روزرسانی ندارید.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={runUpdateCheck}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-[#131416] hover:bg-slate-200 dark:hover:bg-[#25272c] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#2a2b30] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                بررسی مجدد
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: UPDATE AVAILABLE */}
        {!isChecking && updateInfo?.status === 'update_available' && (
          <div className="space-y-6">
            
            {/* Download Complete: Ready to Restart */}
            {isDownloaded ? (
              <div className="flex flex-col items-center text-center py-6 gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                    به‌روزرسانی با موفقیت دریافت شد!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    فایل‌های نسخه جدید آماده اعمال هستند. با زدن دکمه زیر، برنامه در عرض چند ثانیه ری‌استارت شده و با نسخه جدید باز می‌شود (اطلاعات و دروس شما کاملاً محفوظ می‌ماند).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleQuitAndInstall}
                  className="mt-2 flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95"
                >
                  <Power className="w-5 h-5" />
                  آپدیت و راه‌اندازی مجدد برنامه
                </button>
              </div>
            ) : isDownloading ? (
              /* Downloading Progress Bar View */
              <div className="py-6 space-y-4 max-w-xl mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HardDriveDownload className="w-5 h-5 text-indigo-600 dark:text-emerald-400 animate-pulse" />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      در حال دریافت فایل‌های به‌روزرسانی...
                    </span>
                  </div>
                  <span className="font-black text-sm text-indigo-600 dark:text-emerald-400 font-mono">
                    {toPersianDigits(Math.round(downloadProgress?.percent || 0))}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3.5 bg-slate-100 dark:bg-[#131416] rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-[#2a2b30]">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress?.percent || 0}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span>
                    حجم منتقل‌شده: {formatBytes(downloadProgress?.transferred || 0)} از {formatBytes(downloadProgress?.total || 0)}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    {formatSpeed(downloadProgress?.bytesPerSecond || 0)}
                  </span>
                </div>

                {downloadError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2 mt-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{downloadError}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Update Available Overview Card */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-50 dark:bg-emerald-950/30 border border-indigo-100 dark:border-emerald-800/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 dark:bg-[#00B87C] text-white dark:text-black flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                        نسخه جدید {toPersianDigits(updateInfo.latestVersion || '')} منتشر شد!
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        نسخه فعلی شما: {toPersianDigits(updateInfo.currentVersion)}
                        {updateInfo.publishedAt && ` • تاریخ انتشار: ${updateInfo.publishedAt}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartDownload}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs sm:text-sm font-black transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    دریافت و نصب خودکار
                  </button>
                </div>

                {/* Release Notes */}
                {updateInfo.releaseNotes && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      تغییرات و امکانات این نسخه:
                    </span>
                    <div className="p-4 bg-slate-50 dark:bg-[#131416] rounded-2xl border border-slate-200 dark:border-[#2a2b30] text-xs text-slate-600 dark:text-slate-300 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                      {updateInfo.releaseNotes}
                    </div>
                  </div>
                )}

                {downloadError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{downloadError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STATE 4: NO INTERNET / NETWORK ERROR */}
        {!isChecking && (updateInfo?.status === 'no_internet' || updateInfo?.status === 'error') && (
          <div className="py-4 space-y-6">
            
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                <WifiOff className="w-8 h-8" />
              </div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100">
                عدم برقراری ارتباط با سرور به‌روزرسانی
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                برای بررسی و دریافت به‌روزرسانی، اتصال به اینترنت لازم است. لطفاً وضعیت شبکه خود را بررسی کنید.
              </p>
            </div>

            {/* Polite & Professional Diagnostic Box */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#131416] border border-slate-200 dark:border-[#2a2b30] rounded-2xl space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-right">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>گزارش خطای اتصال امن:</span>
              </div>
              <p>
                درخواست امنیتی <span className="font-mono text-indigo-600 dark:text-indigo-400">HTTPS</span> به نشانی زیر با خطا مواجه شد:
              </p>
              <div className="p-2.5 bg-white dark:bg-[#1c1d21] border border-slate-200 dark:border-[#2a2b30] rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all text-left" dir="ltr">
                {GITHUB_API_URL}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                می‌توانید این نشانی را مستقیماً در مرورگر اینترنت خود باز کرده و وضعیت دسترسی را بررسی نمایید. در صورتی که این آدرس در مرورگر شما بدون اشکال باز می‌شود ولی داخل نرم‌افزار خطا دریافت می‌کنید، صمیمانه خواهشمندیم موضوع را از طریق تلگرام با پشتیبانی در میان بگذارید تا راهنمایی لازم خدمتتان ارائه شود.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={runUpdateCheck}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                تلاش مجدد
              </button>

              <button
                type="button"
                onClick={() => openUrl(GITHUB_API_URL)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#131416] border border-slate-200 dark:border-[#2a2b30] hover:bg-slate-50 dark:hover:bg-[#25272c] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                بررسی پیوند در مرورگر
              </button>

              <button
                type="button"
                onClick={() => openUrl(TELEGRAM_SUPPORT_URL)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                پشتیبانی تلگرام (<span dir="ltr">@alimhm_20</span>)
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Safety & Persistence Info Box */}
      <div className="p-4 bg-slate-100/60 dark:bg-[#131416]/60 border border-slate-200 dark:border-[#2a2b30] rounded-2xl flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
        <span>
          تمام اطلاعات انتخاب واحد، سناریوها و بانک دروس شما در فضایی ایزوله ذخیره شده و فرآیند به‌روزرسانی هیچ تغییری در داده‌های شما ایجاد نمی‌کند.
        </span>
      </div>

    </div>
  );
};
