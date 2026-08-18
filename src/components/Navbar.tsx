import React from 'react';
import { 
  Calendar, LayoutGrid, Plus, Printer, 
  HelpCircle, Layers, Moon, Sun 
} from 'lucide-react';
import { SchedulePlan } from '../types/schedule';
import { toPersianDigits } from '../utils/timeUtils';

interface NavbarProps {
  activeTab: 'grid' | 'help';
  setActiveTab: (tab: 'grid' | 'help') => void;
  onOpenAddModal: () => void;
  plans: SchedulePlan[];
  activePlanId: string;
  onSelectPlan: (planId: string) => void;
  onAddPlan: () => void;
  onPrint: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  plans,
  activePlanId,
  onSelectPlan,
  onAddPlan,
  onPrint,
  isDarkMode,
  toggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#131416]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#2a2b30] w-full shadow-2xs transition-colors duration-200">
      <div className="w-full px-6 h-15 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* ZONE 1: BRAND TITLE (Never wraps, scales smoothly) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-black text-sm sm:text-base md:text-lg tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            برنامه‌ریز انتخاب واحد دانشگاه
          </span>
        </div>

        {/* ZONE 2: NAV LINKS (Centered, visible on lg screens and up) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-[#1c1d21]/90 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'help'
                ? 'bg-white dark:bg-[#2a2b30] text-indigo-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            راهنما و قوانین تداخل
          </button>
        </nav>

        {/* ZONE 3: ACTIONS (Plan selector, Print, Add Course) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Plan / Scenario Switcher */}
          <div className="relative flex items-center bg-slate-100 dark:bg-[#1c1d21] rounded-xl p-0.5 border border-slate-200 dark:border-[#2a2b30] max-w-[125px] xs:max-w-[155px] sm:max-w-[210px]">
            <span className="hidden xs:flex text-[11px] font-bold text-slate-500 dark:text-slate-400 pr-2 pl-1 items-center gap-1 shrink-0">
              <Layers className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              سناریو:
            </span>
            <select
              value={activePlanId}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  onAddPlan();
                } else {
                  onSelectPlan(e.target.value);
                }
              }}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 px-1 py-1 focus:outline-none cursor-pointer truncate w-full"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-[#1c1d21] dark:text-slate-200">
                  {p.name} ({toPersianDigits(p.courses.length)} درس)
                </option>
              ))}
              <option value="__add_new__" className="dark:bg-[#1c1d21] dark:text-[#00B87C]">+ سناریوی جدید</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            title={isDarkMode ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-[#2a2b30] rounded-xl transition-all shrink-0"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Print / Save */}
          <button
            type="button"
            onClick={onPrint}
            title="چاپ یا ذخیره PDF برنامه"
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-emerald-400 hover:bg-indigo-50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-[#2a2b30] rounded-xl transition-all shrink-0"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">افزودن درس</span>
            <span className="xs:hidden">درس</span>
          </button>

        </div>

      </div>

      {/* Sub-Nav Tab Bar for screens below lg breakpoint */}
      <div className="flex lg:hidden border-t border-slate-200 dark:border-[#2a2b30] bg-slate-50/90 dark:bg-[#131416]/90 px-3 py-1.5 justify-center gap-1.5 transition-colors duration-200">
        <button
          type="button"
          onClick={() => setActiveTab('grid')}
          className={`flex-1 flex items-center justify-center gap-1 text-xs font-bold py-1.5 px-2 rounded-lg transition-all ${
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
          className={`flex-1 flex items-center justify-center gap-1 text-xs font-bold py-1.5 px-2 rounded-lg transition-all ${
            activeTab === 'help' 
              ? 'bg-white dark:bg-[#2a2b30] text-indigo-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-[#383a40]' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>راهنما</span>
        </button>
      </div>

    </header>
  );
};
