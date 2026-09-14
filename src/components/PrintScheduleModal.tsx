import React, { useState, useEffect, useMemo } from 'react';
import { Course } from '../types/schedule';
import { PrintableScheduleDocument, PrintOptions } from './PrintableScheduleDocument';
import { 
  Printer, X, Eye, SlidersHorizontal, Check, 
  FileText, Sparkles, Layout, Palette, Calendar, 
  GraduationCap, User, Info, ZoomIn, ZoomOut, RotateCcw,
  BookOpen, Building2, Trash2, Star
} from 'lucide-react';
import { toPersianDigits } from '../utils/timeUtils';
import { getCatalogSources } from '../utils/catalogStorage';
import { parseUniversityHtml, SUPPORTED_UNIVERSITIES } from '../utils/parsers';
import backgroundGraphicsImg from '../../assets/Help Photos/print/background graphics.png';

const UNIVERSITY_PRESETS = [
  'دانشگاه شهید بهشتی',
  'دانشگاه صنعتی امیرکبیر',
  'دانشگاه صنعتی خواجه نصیر',
  'دانشگاه صنعتی اصفهان',
  'دانشگاه صنعتی نوشیروانی بابل',
];

interface PrintScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  planName: string;
  studentInfo?: {
    name?: string;
    id?: string;
    universityName?: string;
  } | null;
  onUpdateStudentInfo?: (info: { name?: string; id?: string; universityName?: string } | null) => void;
  defaultFridayVisible?: boolean;
}

export const PrintScheduleModal: React.FC<PrintScheduleModalProps> = ({
  isOpen,
  onClose,
  courses,
  planName,
  studentInfo,
  onUpdateStudentInfo,
  defaultFridayVisible = false,
}) => {
  const [customUniversityName, setCustomUniversityName] = useState<string>(studentInfo?.universityName || '');
  const [customStudentName, setCustomStudentName] = useState<string>(studentInfo?.name || '');
  const [customStudentId, setCustomStudentId] = useState<string>(studentInfo?.id || '');

  // Print options state with smart defaults
  const [options, setOptions] = useState<PrintOptions>({
    orientation: 'landscape',
    theme: 'color',
    showStudentInfo: Boolean(studentInfo?.name?.trim() || studentInfo?.id?.trim()),
    showUniversity: Boolean(studentInfo?.universityName?.trim()),
    showExamsTable: true,
    showFriday: defaultFridayVisible,
    density: 'standard',
    showStars: true,
  });

  // Sync state if studentInfo or modal open status changes
  useEffect(() => {
    if (isOpen) {
      const univ = studentInfo?.universityName || '';
      const sName = studentInfo?.name || '';
      const sId = studentInfo?.id || '';

      if (univ) setCustomUniversityName(univ);
      if (sName) setCustomStudentName(sName);
      if (sId) setCustomStudentId(sId);

      const hasStudent = Boolean((sName || customStudentName).trim() || (sId || customStudentId).trim());
      const hasUniv = Boolean((univ || customUniversityName).trim());

      setOptions(prev => ({
        ...prev,
        showStudentInfo: hasStudent ? true : prev.showStudentInfo,
        showUniversity: hasUniv ? true : prev.showUniversity,
      }));

      // If university or student info is not currently loaded in state, check stored catalog sources
      if (!univ && !sName) {
        getCatalogSources().then(sources => {
          for (const src of sources) {
            try {
              const parsed = parseUniversityHtml(src.rawHtml, src.universityId);
              if (parsed.studentName || parsed.studentId || parsed.universityName) {
                const recovered = {
                  name: parsed.studentName,
                  id: parsed.studentId,
                  universityName: parsed.universityName || SUPPORTED_UNIVERSITIES.find(u => u.id === src.universityId)?.name,
                  universityId: src.universityId,
                };
                onUpdateStudentInfo?.(recovered);
                setCustomUniversityName(recovered.universityName || '');
                setCustomStudentName(recovered.name || '');
                setCustomStudentId(recovered.id || '');
                setOptions(prev => ({
                  ...prev,
                  showStudentInfo: Boolean(recovered.name || recovered.id),
                  showUniversity: Boolean(recovered.universityName),
                }));
                break;
              }
            } catch (e) {
              console.warn('Could not parse stored catalog source', e);
            }
          }
        }).catch(console.error);
      }
    }
  }, [isOpen, studentInfo, onUpdateStudentInfo]);

  const effectiveStudentInfo = useMemo(() => {
    const trimmedUniv = customUniversityName.trim();
    const trimmedName = customStudentName.trim();
    const trimmedId = customStudentId.trim();

    if (!trimmedUniv && !trimmedName && !trimmedId) {
      return null;
    }

    return {
      universityName: trimmedUniv || undefined,
      name: trimmedName || undefined,
      id: trimmedId || undefined,
    };
  }, [customUniversityName, customStudentName, customStudentId]);

  const updateIdentity = (newUniv: string, newName: string, newId: string) => {
    setCustomUniversityName(newUniv);
    setCustomStudentName(newName);
    setCustomStudentId(newId);

    const trimmedUniv = newUniv.trim();
    const trimmedName = newName.trim();
    const trimmedId = newId.trim();

    const newInfo = (!trimmedUniv && !trimmedName && !trimmedId)
      ? null
      : {
          universityName: trimmedUniv || undefined,
          name: trimmedName || undefined,
          id: trimmedId || undefined,
        };

    onUpdateStudentInfo?.(newInfo);
  };

  const handleUniversityChange = (val: string) => {
    updateIdentity(val, customStudentName, customStudentId);
    if (val.trim() && !options.showUniversity) {
      setOptions(prev => ({ ...prev, showUniversity: true }));
    }
  };

  const handleStudentNameChange = (val: string) => {
    updateIdentity(customUniversityName, val, customStudentId);
    if ((val.trim() || customStudentId.trim()) && !options.showStudentInfo) {
      setOptions(prev => ({ ...prev, showStudentInfo: true }));
    }
  };

  const handleStudentIdChange = (val: string) => {
    updateIdentity(customUniversityName, customStudentName, val);
    if ((customStudentName.trim() || val.trim()) && !options.showStudentInfo) {
      setOptions(prev => ({ ...prev, showStudentInfo: true }));
    }
  };

  const handleClearIdentity = () => {
    updateIdentity('', '', '');
    setOptions(prev => ({
      ...prev,
      showStudentInfo: false,
      showUniversity: false,
    }));
  };

  // Preview zoom scale (50% to 125%)
  const [zoomScale, setZoomScale] = useState<number>(0.85);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Dynamic @page CSS rule based on selected orientation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: ${options.orientation};
              margin: 6mm;
            }
          `,
        }}
      />

      {/* Modal Backdrop & Container (Hidden during actual print) */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs transition-opacity print:hidden"
        dir="rtl"
      >
        <div className="bg-white dark:bg-[#131416] w-full h-full max-h-[96vh] max-w-7xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-[#2a2b30] animate-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#2a2b30] flex items-center justify-between gap-3 bg-white dark:bg-[#131416] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-emerald-950/40 text-indigo-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-emerald-800/30">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  پیش‌نمایش و تنظیمات چاپ برنامه
                  <span className="text-[10.5px] font-extrabold bg-indigo-50 dark:bg-emerald-950/50 text-indigo-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-emerald-800/40">
                    A4
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  تنظیمات سند چاپی را مشخص کرده و پیش‌نمایش خروجی را مشاهده کنید.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Primary Print Button in Header */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs sm:text-sm font-black transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ / ذخیره PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c1d21] rounded-xl transition-colors cursor-pointer"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Main Body (Split Layout: Settings on Right, Live Preview on Left) */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100 dark:bg-[#0b0c0e]">
            
            {/* RIGHT COLUMN: Settings Panel */}
            <div className="w-full lg:w-80 xl:w-96 p-4 sm:p-5 overflow-y-auto border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-[#2a2b30] bg-white dark:bg-[#18191d] space-y-5 shrink-0">
              
              {/* Option 1: Orientation */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-indigo-600 dark:text-emerald-400" />
                  <span>جهت برگه کاغذ (A4)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      options.orientation === 'landscape'
                        ? 'bg-indigo-50 dark:bg-emerald-950/40 border-indigo-400 dark:border-emerald-500 text-indigo-900 dark:text-emerald-200 shadow-2xs font-black'
                        : 'bg-slate-50 dark:bg-[#131416] border-slate-200 dark:border-[#2a2b30] text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#202125] font-bold text-xs'
                    }`}
                  >
                    <div className="text-xs">افقی (Landscape)</div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                      پیشنهادی برای جدول
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOptions(prev => ({ ...prev, orientation: 'portrait' }))}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      options.orientation === 'portrait'
                        ? 'bg-indigo-50 dark:bg-emerald-950/40 border-indigo-400 dark:border-emerald-500 text-indigo-900 dark:text-emerald-200 shadow-2xs font-black'
                        : 'bg-slate-50 dark:bg-[#131416] border-slate-200 dark:border-[#2a2b30] text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#202125] font-bold text-xs'
                    }`}
                  >
                    <div className="text-xs">عمودی (Portrait)</div>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      چیدمان ستونی
                    </span>
                  </button>
                </div>
              </div>

              {/* Option 2: Print Theme */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-emerald-400" />
                  <span>تم و حالت رنگ چاپ</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOptions(prev => ({ ...prev, theme: 'color' }))}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      options.theme === 'color'
                        ? 'bg-indigo-50 dark:bg-emerald-950/40 border-indigo-400 dark:border-emerald-500 text-indigo-900 dark:text-emerald-200 shadow-2xs font-black'
                        : 'bg-slate-50 dark:bg-[#131416] border-slate-200 dark:border-[#2a2b30] text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#202125] font-bold text-xs'
                    }`}
                  >
                    <div className="text-xs flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-pink-500" />
                      <span>رنگی مدرن</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      رنگ تفکیکی دروس
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOptions(prev => ({ ...prev, theme: 'bw' }))}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      options.theme === 'bw'
                        ? 'bg-indigo-50 dark:bg-emerald-950/40 border-indigo-400 dark:border-emerald-500 text-indigo-900 dark:text-emerald-200 shadow-2xs font-black'
                        : 'bg-slate-50 dark:bg-[#131416] border-slate-200 dark:border-[#2a2b30] text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#202125] font-bold text-xs'
                    }`}
                  >
                    <div className="text-xs flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-900 border border-slate-400" />
                      <span>سیاه‌وسفید اداری</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      کم‌مصرف (جوهر پرینتر)
                    </span>
                  </button>
                </div>
              </div>

              {/* Option 3: Header & Student Identity (Always available for both catalog & manual users) */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#2a2b30]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-emerald-400" />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      اطلاعات سربرگ و هویت دانشجو
                    </span>
                  </div>
                  {Boolean(customUniversityName || customStudentName || customStudentId) && (
                    <button
                      type="button"
                      onClick={handleClearIdentity}
                      className="text-[10px] text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title="پاک کردن تمام مشخصات"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>پاک کردن</span>
                    </button>
                  )}
                </div>

                {/* University Name Input & Presets */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#131416] border border-slate-200 dark:border-[#2a2b30]">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>نام دانشگاه</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">
                      <span>نمایش</span>
                      <input
                        type="checkbox"
                        checked={options.showUniversity}
                        onChange={(e) => setOptions(prev => ({ ...prev, showUniversity: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded text-indigo-600 dark:text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={customUniversityName}
                    onChange={(e) => handleUniversityChange(e.target.value)}
                    placeholder="مثال: دانشگاه صنعتی امیرکبیر"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2a2b30] bg-white dark:bg-[#1c1d21] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-emerald-500 transition-colors"
                  />
                  {/* University Quick Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {UNIVERSITY_PRESETS.map(univ => (
                      <button
                        key={univ}
                        type="button"
                        onClick={() => handleUniversityChange(univ)}
                        className={`text-[9.5px] px-2 py-0.5 rounded-md transition-colors cursor-pointer border ${
                          customUniversityName === univ
                            ? 'bg-indigo-100 dark:bg-emerald-950 border-indigo-300 dark:border-emerald-600 text-indigo-800 dark:text-emerald-200 font-bold'
                            : 'bg-white dark:bg-[#18191d] border-slate-200 dark:border-[#2a2b30] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#22242a]'
                        }`}
                      >
                        {univ.replace(/^دانشگاه\s+/, '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Student Info Inputs */}
                <div className="space-y-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#131416] border border-slate-200 dark:border-[#2a2b30]">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>مشخصات دانشجو</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">
                      <span>نمایش</span>
                      <input
                        type="checkbox"
                        checked={options.showStudentInfo}
                        onChange={(e) => setOptions(prev => ({ ...prev, showStudentInfo: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded text-indigo-600 dark:text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={customStudentName}
                        onChange={(e) => handleStudentNameChange(e.target.value)}
                        placeholder="نام و نام خانوادگی (اختیاری)"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2a2b30] bg-white dark:bg-[#1c1d21] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={customStudentId}
                        onChange={(e) => handleStudentIdChange(e.target.value)}
                        placeholder="شماره دانشجویی (اختیاری)"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2a2b30] bg-white dark:bg-[#1c1d21] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 4: Extra Sections */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-[#2a2b30]">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  بخش‌های تکمیلی سند
                </span>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#131416] border border-slate-200 dark:border-[#2a2b30] cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>جدول مشخصات دروس و امتحانات</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.showExamsTable}
                    onChange={(e) => setOptions(prev => ({ ...prev, showExamsTable: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 dark:text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#131416] border border-slate-200 dark:border-[#2a2b30] cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>نمایش ستون روز جمعه</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.showFriday}
                    onChange={(e) => setOptions(prev => ({ ...prev, showFriday: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 dark:text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#131416] border border-slate-200 dark:border-[#2a2b30] cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>نمایش علامت دروس ستاره‌دار (★)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.showStars}
                    onChange={(e) => setOptions(prev => ({ ...prev, showStars: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 dark:text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#131416] border border-slate-200 dark:border-[#2a2b30] cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                    <span>حالت فشرده (Compact)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.density === 'compact'}
                    onChange={(e) => setOptions(prev => ({ ...prev, density: e.target.checked ? 'compact' : 'standard' }))}
                    className="w-4 h-4 rounded text-indigo-600 dark:text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>

              {/* Print Tips Note */}
              <div className="bg-indigo-50/70 dark:bg-emerald-950/30 border border-indigo-100 dark:border-emerald-800/40 p-3 rounded-xl text-[11px] text-indigo-900 dark:text-emerald-300 leading-relaxed space-y-2">
                <div className="font-black flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-emerald-400 shrink-0" />
                  <span>نکته مهم قبل از چاپ:</span>
                </div>
                <p>
                  در کادر پرینت مرورگر، جهت کاغذ (Layout) را روی <strong>{options.orientation === 'landscape' ? 'Landscape (افقی)' : 'Portrait (عمودی)'}</strong> بگذارید و حتماً تیک <strong>"Background graphics"</strong> را روشن کنید (اگر این گزینه را نمی‌بینید، روی دکمه <strong>More settings</strong> بزنید).
                </p>
                <div className="rounded-lg overflow-hidden border border-indigo-200/80 dark:border-emerald-700/50 shadow-2xs mt-2 bg-white">
                  <img 
                    src={backgroundGraphicsImg} 
                    alt="راهنمای فعال‌سازی Background graphics در تنظیمات پرینت" 
                    className="w-full h-auto object-contain block"
                  />
                </div>
              </div>

            </div>

            {/* LEFT COLUMN: Live Preview Paper */}
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Zoom Controls Bar */}
              <div className="px-4 py-2 border-b border-slate-200 dark:border-[#2a2b30] bg-white/70 dark:bg-[#131416]/70 backdrop-blur-xs flex items-center justify-between gap-3 text-xs shrink-0">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Eye className="w-4 h-4 text-indigo-600 dark:text-emerald-400" />
                  <span>پیش‌نمایش زنده سند</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.1))}
                    className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="کوچک‌نمایی"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-black text-slate-700 dark:text-slate-300 min-w-12 text-center text-[11px]">
                    {toPersianDigits(Math.round(zoomScale * 100))}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.min(1.3, prev + 0.1))}
                    className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="بزرگ‌نمایی"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomScale(0.85)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="بازنشانی اندازه"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Scrollable Paper Canvas */}
              <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-start justify-center">
                <div 
                  style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
                  className={`transition-transform duration-150 shadow-2xl rounded-xl overflow-hidden bg-white border border-slate-300 ${
                    options.orientation === 'landscape'
                      ? 'w-[1050px] min-w-[1050px]'
                      : 'w-[750px] min-w-[750px]'
                  }`}
                >
                  <PrintableScheduleDocument
                    courses={courses}
                    planName={planName}
                    studentInfo={effectiveStudentInfo}
                    options={options}
                    isPrintPreview={true}
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t border-slate-200 dark:border-[#2a2b30] bg-white dark:bg-[#131416] flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              خروجی باکیفیت و رزولوشن استاندارد برای چاپگر یا فایل PDF آماده می‌شود.
            </span>
            <div className="flex items-center gap-2 mr-auto sm:mr-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c1d21] rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>شروع چاپ (Print)</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* DEDICATED PRINT DOM CONTAINER: Invisible on screen, Visible ONLY during window.print() */}
      <div className="hidden print:block bg-white w-full m-0 p-0">
        <PrintableScheduleDocument
          courses={courses}
          planName={planName}
          studentInfo={effectiveStudentInfo}
          options={options}
          isPrintPreview={false}
        />
      </div>
    </>
  );
};
