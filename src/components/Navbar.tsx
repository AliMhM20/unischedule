import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutGrid, Plus, Printer, 
  HelpCircle, Layers, Moon, Sun,
  ArrowUpCircle, ChevronDown, Check,
  Pencil, Copy, Trash2, PlusCircle, Share2
} from 'lucide-react';
import { SchedulePlan } from '../types/schedule';
import { toPersianDigits } from '../utils/timeUtils';

interface NavbarProps {
  activeTab: 'grid' | 'help' | 'update';
  setActiveTab: (tab: 'grid' | 'help' | 'update') => void;
  onOpenAddModal: () => void;
  plans: SchedulePlan[];
  activePlanId: string;
  onSelectPlan: (planId: string) => void;
  onRequestCreatePlan: () => void;
  onRequestEditPlan: (plan: SchedulePlan) => void;
  onDuplicatePlan: (planId: string) => void;
  onDeletePlan: (planId: string) => void;
  onSharePlan?: (plan: SchedulePlan) => void;
  onPrint: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isPreviewMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  plans,
  activePlanId,
  onSelectPlan,
  onRequestCreatePlan,
  onRequestEditPlan,
  onDuplicatePlan,
  onDeletePlan,
  onSharePlan,
  onPrint,
  isDarkMode,
  toggleDarkMode,
  isPreviewMode = false,
}) => {
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [isMobilePlanDropdownOpen, setIsMobilePlanDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPlanDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobilePlanDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePlan = plans.find(p => p.id === activePlanId) || plans[0];

  const renderPlanList = (onItemClick: () => void) => (
    <div 
      className="bg-white dark:bg-[#1c1d21] rounded-2xl border border-slate-200 dark:border-[#2a2b30] shadow-2xl p-2 z-50 animate-in zoom-in-95 duration-150 space-y-1"
      dir="rtl"
    >
      <div className="px-3 py-2 border-b border-slate-100 dark:border-[#2a2b30] flex items-center justify-between">
        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
          سناریوهای انتخاب واحد ({toPersianDigits(plans.length)})
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1 p-1">
        {plans.map((p, idx) => {
          const isSelected = p.id === activePlanId;
          const isMain = idx === 0 || p.id === 'plan-1';

          return (
            <div
              key={p.id}
              onClick={() => {
                onSelectPlan(p.id);
                onItemClick();
              }}
              className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50 dark:bg-emerald-950/40 border border-indigo-200/80 dark:border-emerald-800/40 text-indigo-900 dark:text-emerald-300'
                  : 'hover:bg-slate-100 dark:hover:bg-[#25262c] text-slate-800 dark:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-start gap-2 min-w-0 flex-1 pr-1">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected ? 'text-indigo-600 dark:text-emerald-400' : 'text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block break-words whitespace-normal leading-snug">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                    {toPersianDigits(p.courses.length)} درس
                  </span>
                </div>
              </div>

              {/* Action buttons (Edit, Duplicate, Delete) */}
              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => {
                    onRequestEditPlan(p);
                    onItemClick();
                  }}
                  title="ویرایش نام سناریو"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={() => {
                    onSharePlan?.(p);
                    onItemClick();
                  }}
                  title="اشتراک‌گذاری این سناریو با لینک مستقیم"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                {/* Duplicate Button */}
                <button
                  type="button"
                  onClick={() => {
                    onDuplicatePlan(p.id);
                    onItemClick();
                  }}
                  title="تکثیر این سناریو (Duplicate)"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button (Only for non-main plans) */}
                {!isMain && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePlan(p.id);
                      onItemClick();
                    }}
                    title="حذف این سناریو"
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Plan Button */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#2a2b30]">
        <button
          type="button"
          onClick={() => {
            onRequestCreatePlan();
            onItemClick();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 dark:bg-emerald-950/30 hover:bg-indigo-100 dark:hover:bg-emerald-900/40 text-indigo-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-indigo-100 dark:border-emerald-800/40"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ ایجاد سناریوی جدید</span>
        </button>
      </div>

    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#131416]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#2a2b30] w-full shadow-2xs transition-colors duration-200 print:hidden">
      <div className="w-full px-3 xs:px-4 sm:px-6 h-15 flex items-center justify-between gap-1 xs:gap-2 sm:gap-4">
        
        {/* ZONE 1: BRAND TITLE */}
        <div className="flex items-center min-w-0 shrink">
          <span className="font-black text-[11px] min-[380px]:text-xs sm:text-sm md:text-base lg:text-lg tracking-tight text-slate-900 dark:text-slate-100 truncate">
            برنامه‌ریز انتخاب واحد دانشگاه
          </span>
        </div>

        {/* ZONE 2: NAV LINKS (Centered, visible on lg screens and up) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-[#1c1d21]/90 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'grid'
                ? 'bg-white dark:bg-[#2a2b30] text-indigo-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            جدول هفتگی کلاس‌ها
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'help'
                ? 'bg-white dark:bg-[#2a2b30] text-indigo-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            راهنما و قوانین تداخل
          </button>

          {typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron) && (
            <button
              type="button"
              onClick={() => setActiveTab('update')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'update'
                  ? 'bg-white dark:bg-[#2a2b30] text-indigo-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              به‌روزرسانی نرم‌افزار
            </button>
          )}
        </nav>

        {/* ZONE 3: ACTIONS (Plan selector, Theme, Print, Add Course) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Plan / Scenario Switcher Dropdown (Desktop & Tablet) */}
          {!isPreviewMode && (
            <div className="hidden sm:block relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsPlanDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1c1d21] dark:hover:bg-[#25262c] rounded-xl px-3 py-1.5 border border-slate-200 dark:border-[#2a2b30] text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs max-w-[240px] text-right"
                title="مدیریت و انتخاب سناریو"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-emerald-400 shrink-0" />
                <div className="flex flex-col min-w-0 text-right flex-1">
                  <span className="text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-slate-100 break-words whitespace-normal leading-tight">
                    {activePlan?.name || 'برنامه اصلی'}
                  </span>
                  <span className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {toPersianDigits(activePlan?.courses.length || 0)} درس ثبت شده
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isPlanDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu (Desktop) */}
              {isPlanDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 z-50">
                  {renderPlanList(() => setIsPlanDropdownOpen(false))}
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            title={isDarkMode ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-[#2a2b30] rounded-xl transition-all shrink-0 cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Share Link */}
          {!isPreviewMode && (
            <button
              type="button"
              onClick={() => onSharePlan?.(activePlan)}
              title="اشتراک‌گذاری این برنامه با لینک مستقیم"
              className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-emerald-400 hover:bg-indigo-50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-[#2a2b30] rounded-xl transition-all shrink-0 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {/* Print / Save */}
          <button
            type="button"
            onClick={onPrint}
            title="چاپ یا ذخیره PDF برنامه"
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-emerald-400 hover:bg-indigo-50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-[#2a2b30] rounded-xl transition-all shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Primary Action Button */}
          {!isPreviewMode && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">افزودن درس</span>
              <span className="xs:hidden">درس</span>
            </button>
          )}

        </div>

      </div>

      {/* Mobile Plan Dropdown Bar (Visible on screens < sm) */}
      {!isPreviewMode && (
        <div className="sm:hidden px-3 pb-2.5 relative" ref={mobileDropdownRef}>
          <button
            type="button"
            onClick={() => setIsMobilePlanDropdownOpen(prev => !prev)}
            className="w-full flex items-center justify-between bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1c1d21] dark:hover:bg-[#25262c] rounded-xl px-3 py-2 border border-slate-200 dark:border-[#2a2b30] text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs text-right"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-emerald-400 shrink-0" />
              <div className="flex flex-col min-w-0 text-right flex-1">
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 break-words whitespace-normal leading-tight">
                  {activePlan?.name || 'برنامه اصلی'}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {toPersianDigits(activePlan?.courses.length || 0)} درس ثبت شده • لمس برای مشاهده سایر سناریوها
                </span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 mr-1 ${isMobilePlanDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Mobile Dropdown Menu */}
          {isMobilePlanDropdownOpen && (
            <div className="absolute top-full left-3 right-3 mt-1.5 z-50">
              {renderPlanList(() => setIsMobilePlanDropdownOpen(false))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Nav Tab Bar for screens below lg breakpoint */}
      <div className="flex lg:hidden border-t border-slate-200 dark:border-[#2a2b30] bg-slate-50/90 dark:bg-[#131416]/90 px-2 sm:px-3 py-1.5 justify-center gap-1 sm:gap-1.5 transition-colors duration-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('grid')}
          className={`flex-1 flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold py-1.5 px-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'grid' 
              ? 'bg-white dark:bg-[#2a2b30] text-indigo-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-[#383a40]' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>جدول هفتگی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('help')}
          className={`flex-1 flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold py-1.5 px-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'help' 
              ? 'bg-white dark:bg-[#2a2b30] text-indigo-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-[#383a40]' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>راهنما</span>
        </button>

        {typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron) && (
          <button
            type="button"
            onClick={() => setActiveTab('update')}
            className={`flex-1 flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold py-1.5 px-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'update' 
                ? 'bg-white dark:bg-[#2a2b30] text-indigo-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-[#383a40]' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>به‌روزرسانی</span>
          </button>
        )}
      </div>

    </header>
  );
};
