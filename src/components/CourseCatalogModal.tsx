import React, { useState, useMemo, useRef } from 'react';
import { Course } from '../types/schedule';
import { X, Upload, FileText, Search, Filter, BookOpen, AlertCircle, CheckCircle2, User, Trash2 } from 'lucide-react';
import { parseBehestanHtml } from '../utils/htmlCourseParser';
import { validateCourse, toPersianDigits, getDayFaName, formatExamDate, getCourseTheme } from '../utils/timeUtils';

interface CourseCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCourse: (course: Course) => void;
  onRemoveCourse: (courseId: string) => void;
  existingCourses: Course[];
  catalogCourses: Course[];
  setCatalogCourses: (courses: Course[]) => void;
  studentInfo: { name?: string; id?: string } | null;
  setStudentInfo: (info: { name?: string; id?: string } | null) => void;
}

export const CourseCatalogModal: React.FC<CourseCatalogModalProps> = ({
  isOpen,
  onClose,
  onAddCourse,
  onRemoveCourse,
  existingCourses,
  catalogCourses,
  setCatalogCourses,
  studentInfo,
  setStudentInfo
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [htmlInput, setHtmlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [examFilter, setExamFilter] = useState<'all' | 'has_exam' | 'no_exam'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessHtml = (htmlContent: string) => {
    try {
      const { courses, studentName, studentId } = parseBehestanHtml(htmlContent);
      if (courses.length === 0) {
        setError('هیچ درسی در فایل یافت نشد. مطمئن شوید که فایل "نمایش جدولی" گزارش ۲۱۲ را به درستی ذخیره کرده‌اید.');
        return;
      }
      setCatalogCourses(courses);
      setStudentInfo({ name: studentName, id: studentId });
      setError(null);
    } catch (err) {
      setError('خطا در پردازش فایل. لطفاً فایل معتبری انتخاب کنید.');
      console.error(err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleProcessHtml(content);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setCatalogCourses([]);
    setStudentInfo(null);
    setHtmlInput('');
    setError(null);
  };

  const filteredCourses = useMemo(() => {
    return catalogCourses.filter(course => {
      const matchesSearch = 
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (course.code && course.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (course.instructor && course.instructor.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesDay = selectedDay === 'all' || course.sessions.some(s => s.day === selectedDay);
      
      const matchesExam = examFilter === 'all' || 
        (examFilter === 'has_exam' && course.exam) || 
        (examFilter === 'no_exam' && !course.exam);

      return matchesSearch && matchesDay && matchesExam;
    });
  }, [catalogCourses, searchQuery, selectedDay, examFilter]);

  const hasCatalog = catalogCourses.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm transition-opacity" dir="rtl">
      <div className="bg-white dark:bg-[#131416] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-6xl lg:max-w-7xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-[#2a2b30]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-[#1c1d21] bg-white dark:bg-[#131416] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                بانک دروس ارائه شده
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] px-1.5 py-0.5 rounded-md leading-none font-bold">BETA</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">وارد کردن دروس از پرتال بهستان (گزارش ۲۱۲)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c1d21] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0b0c0e]">
          
          {!hasCatalog ? (
            /* ================= STATE 1: UPLOAD & IMPORT ================= */
            <div className="p-6 sm:p-10 max-w-2xl mx-auto space-y-8">
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">دروس خود را خودکار وارد کنید</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  فایل HTML گزارش ۲۱۲ (نمایش جدولی) را از پرتال آموزشی دریافت کرده و در اینجا بارگذاری کنید.
                </p>
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-sm font-bold flex items-start gap-2 border border-rose-100 dark:border-rose-900/30">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {/* Method 1: File Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-purple-200 dark:border-purple-900/30 rounded-3xl bg-white dark:bg-[#131416] hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors group"
                >
                  <input 
                    type="file" 
                    accept=".html,.htm" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">انتخاب فایل HTML</span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs mt-2">فایل ذخیره شده با پسوند html. را انتخاب کنید</span>
                </button>

                {/* Method 2: Paste Code */}
                <div className="bg-white dark:bg-[#131416] p-4 rounded-3xl border border-slate-200 dark:border-[#2a2b30]">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 px-1">یا کد HTML را در اینجا پیست کنید:</p>
                  <textarea
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    placeholder="<html dir='rtl'>...</html>"
                    className="w-full h-32 bg-slate-50 dark:bg-[#0b0c0e] border border-slate-200 dark:border-[#2a2b30] rounded-xl p-3 text-left text-xs font-mono text-slate-600 dark:text-slate-400 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 focus:ring-1 focus:ring-purple-400 dark:focus:ring-purple-500 transition-all resize-none mb-3"
                    dir="ltr"
                  />
                  <button
                    onClick={() => handleProcessHtml(htmlInput)}
                    disabled={!htmlInput.trim()}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    پردازش کد وارد شده
                  </button>
                </div>
              </div>

              {/* Guide */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 text-sm">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  راهنمای دریافت فایل:
                </h4>
                <ol className="list-decimal list-inside text-blue-700 dark:text-blue-400 space-y-1.5 leading-relaxed text-xs sm:text-sm">
                  <li>وارد پرتال آموزشی بهستان شوید.</li>
                  <li>به منوی <strong>گزارش‌های آموزشی</strong> &gt; <strong>گزارش ۲۱۲ (لیست دروس ارائه شده)</strong> بروید.</li>
                  <li>پس از جستجوی دروس مورد نظر، روی دکمه <strong>نمایش جدولی</strong> کلیک کنید تا جدول دروس باز شود.</li>
                  <li>در صفحه باز شده، کلیدهای <code>Ctrl + S</code> را بزنید تا صفحه ذخیره شود.</li>
                  <li>در پنجره ذخیره، فرمت <strong>Webpage, Complete</strong> یا <strong>HTML Only</strong> را انتخاب و فایل را ذخیره کنید.</li>
                  <li>آن فایل را در این قسمت بارگذاری کنید.</li>
                </ol>
              </div>

            </div>
          ) : (
            /* ================= STATE 2: BROWSE & QUICK ADD ================= */
            <div className="flex flex-col h-full">
              
              {/* Sticky Top Bar (Filters & Info) */}
              <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#131416]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#2a2b30] p-4 space-y-4">
                
                {/* User Info & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 px-3 py-1.5 rounded-xl">
                      <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <div className="text-xs text-purple-800 dark:text-purple-300">
                        {studentInfo?.name ? <span className="font-bold">{studentInfo.name}</span> : <span>دانشجوی ناشناس</span>}
                        {studentInfo?.id && <span className="mr-1 opacity-75">({toPersianDigits(studentInfo.id)})</span>}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {toPersianDigits(catalogCourses.length)} درس یافت شد
                    </div>
                  </div>
                  
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#1c1d21] hover:bg-slate-200 dark:hover:bg-[#2a2b30] rounded-xl transition-colors shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    تغییر فایل
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجوی درس، کد، استاد..."
                      className="block w-full rounded-xl border-slate-200 dark:border-[#2a2b30] bg-slate-50 dark:bg-[#0b0c0e] pr-10 text-sm focus:border-purple-500 focus:ring-purple-500 dark:text-white"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative min-w-[120px]">
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="block w-full rounded-xl border-slate-200 dark:border-[#2a2b30] bg-slate-50 dark:bg-[#0b0c0e] text-sm focus:border-purple-500 focus:ring-purple-500 dark:text-white"
                      >
                        <option value="all">همه روزها</option>
                        <option value="saturday">شنبه</option>
                        <option value="sunday">یک‌شنبه</option>
                        <option value="monday">دوشنبه</option>
                        <option value="tuesday">سه‌شنبه</option>
                        <option value="wednesday">چهارشنبه</option>
                        <option value="thursday">پنج‌شنبه</option>
                        <option value="friday">جمعه</option>
                      </select>
                    </div>
                    <div className="relative min-w-[140px]">
                      <select
                        value={examFilter}
                        onChange={(e) => setExamFilter(e.target.value as any)}
                        className="block w-full rounded-xl border-slate-200 dark:border-[#2a2b30] bg-slate-50 dark:bg-[#0b0c0e] text-sm focus:border-purple-500 focus:ring-purple-500 dark:text-white"
                      >
                        <option value="all">وضعیت امتحان</option>
                        <option value="has_exam">دارای امتحان</option>
                        <option value="no_exam">بدون امتحان</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* Course Grid */}
              <div className="p-4 sm:p-6 h-full">
                {filteredCourses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
                    <Search className="w-10 h-10 mb-3 opacity-50" />
                    <p className="font-bold">هیچ درسی با این فیلترها یافت نشد.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredCourses.map(course => {
                      const isAdded = existingCourses.some(c => c.id === course.id);
                      const { hasConflict, conflicts } = isAdded ? { hasConflict: false, conflicts: [] } : validateCourse(course, existingCourses);
                      const theme = getCourseTheme(course.color);

                      return (
                        <div key={course.id} className={`flex flex-col bg-white dark:bg-[#131416] rounded-2xl border ${isAdded ? 'border-emerald-500 dark:border-emerald-500 shadow-sm ring-1 ring-emerald-500/20' : 'border-slate-200 dark:border-[#2a2b30] shadow-sm'} overflow-hidden transition-all hover:shadow-md`}>
                          
                          <div className="p-4 sm:p-5 flex-1 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 line-clamp-2">
                                  {course.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-md font-bold ${theme.lightBg} flex items-center gap-1`}>
                                    <span>کد:</span>
                                    <span dir="ltr" className="inline-block">{toPersianDigits(course.code || '')}</span>
                                  </span>
                                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1c1d21] px-2 py-0.5 rounded-md">
                                    {toPersianDigits(course.credits)} واحد
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              {course.instructor && (
                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                  <User className="w-3.5 h-3.5 opacity-70" />
                                  <span>{course.instructor}</span>
                                </div>
                              )}
                              
                              {/* Sessions */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {course.sessions.map((s, idx) => (
                                  <span key={idx} className="bg-slate-100 dark:bg-[#1c1d21] text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md text-[10px] font-bold">
                                    {getDayFaName(s.day)} {toPersianDigits(s.startTime)} - {toPersianDigits(s.endTime)}
                                  </span>
                                ))}
                              </div>

                              {/* Exam */}
                              <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-[#2a2b30]">
                                {course.exam ? (
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <span className="font-bold">امتحان:</span>
                                    {formatExamDate(course.exam.date)} ساعت {toPersianDigits(course.exam.startTime)}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                    بدون تاریخ امتحان
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Footer Actions & Conflicts */}
                          <div className={`p-3 border-t ${isAdded ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : hasConflict ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30' : 'bg-slate-50 dark:bg-[#1c1d21]/50 border-slate-100 dark:border-[#2a2b30]'}`}>
                            
                            {hasConflict && !isAdded && (
                              <div className="mb-3 text-[11px] text-rose-600 dark:text-rose-400 font-bold space-y-1">
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>تداخل دارد:</span>
                                </div>
                                <ul className="list-disc list-inside pr-4 space-y-1 opacity-90 mt-1">
                                  {conflicts.map((c, i) => <li key={i} className="text-xs leading-relaxed" title={c.reason}>{c.reason}</li>)}
                                </ul>
                              </div>
                            )}

                            <div className="flex items-center justify-end">
                              {isAdded ? (
                                <button
                                  onClick={() => onRemoveCourse(course.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  حذف از برنامه
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (hasConflict) {
                                      if (window.confirm('این درس با برنامه فعلی شما تداخل دارد. آیا می‌خواهید دروس تداخل‌دار حذف و این درس جایگزین شود؟')) {
                                        // Remove all conflicting courses first
                                        const conflictingIds = Array.from(new Set(conflicts.map(c => c.existingCourse.id)));
                                        conflictingIds.forEach(id => onRemoveCourse(id));
                                        
                                        // Then add the new course
                                        onAddCourse(course);
                                      }
                                    } else {
                                      onAddCourse(course);
                                    }
                                  }}
                                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 ${
                                    hasConflict 
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                                      : 'bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black'
                                  }`}
                                >
                                  {hasConflict ? 'افزودن به جای درس دارای تداخل' : '+ افزودن به برنامه'}
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};
