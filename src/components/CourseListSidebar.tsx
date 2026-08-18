import React, { useState } from 'react';
import { Course } from '../types/schedule';
import { 
  BookOpen, Plus, Trash2, Edit, Clock, 
  User, Calendar, Search
} from 'lucide-react';
import { toPersianDigits, getDayFaName, getCourseTheme, formatExamDate } from '../utils/timeUtils';

interface CourseListSidebarProps {
  courses: Course[];
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onClearAll: () => void;
}

export const CourseListSidebar: React.FC<CourseListSidebarProps> = ({
  courses,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Total credits calculation
  const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);

  // Filtered courses by search term
  const filteredCourses = courses.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      (c.instructor && c.instructor.toLowerCase().includes(term)) ||
      (c.code && c.code.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-white dark:bg-[#1c1d21] rounded-2xl border border-indigo-200 dark:border-[#00B87C]/50 p-4 sm:p-5 shadow-xs flex flex-col gap-4 w-full transition-colors duration-200">
      
      {/* Top Header Row: Total Credits */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#2a2b30]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">مجموع واحدهای انتخابی:</span>
          <span className="text-xl font-black text-indigo-700 dark:text-emerald-400">
            {toPersianDigits(totalCredits)} <span className="text-xs font-normal">واحد</span>
          </span>
        </div>
      </div>

      {/* Action and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-emerald-500 shrink-0" />
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
            فهرست دروس انتخاب‌شده ({toPersianDigits(courses.length)})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box if courses exist */}
          {courses.length > 2 && (
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجوی درس، استاد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-[#1c1d21] border border-slate-200 dark:border-[#383a40] text-slate-800 dark:text-slate-200 rounded-xl pr-8 pl-3 py-1.5 focus:outline-none focus:border-indigo-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          )}

          <button
            type="button"
            onClick={onAddCourse}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>درس جدید</span>
          </button>
        </div>
      </div>

      {/* Course List Items: Responsive Multi-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 max-h-[380px] overflow-y-auto pr-0.5">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full text-center py-8 px-4 text-xs text-slate-500 dark:text-slate-400 space-y-2 bg-slate-50/60 dark:bg-[#1c1d21]/50 rounded-xl border border-dashed border-slate-200 dark:border-[#383a40]">
            {courses.length === 0 ? (
              <>
                <p className="font-bold text-slate-600 dark:text-slate-300">هنوز درسی به این برنامه اضافه نشده است.</p>
                <p className="text-slate-400 dark:text-slate-500">
                  برای شروع می‌توانید روی دکمه «درس جدید» بالا یا مستقیماً روی ساعت‌های جدول زمانی کلیک کنید.
                </p>
              </>
            ) : (
              <p>درسی با عبارت جستجوی وارد شده یافت نشد.</p>
            )}
          </div>
        ) : (
          filteredCourses.map((course) => {
            const theme = getCourseTheme(course.color);
            return (
              <div
                key={course.id}
                className="group relative p-3 rounded-xl border border-indigo-200 dark:border-[#00B87C]/50 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all bg-white dark:bg-[#1c1d21] flex flex-col justify-between gap-2"
              >
                {/* Top Row: Color indicator, Name, Credits */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${theme.bg} shrink-0`} />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate" title={course.name}>
                        {course.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                      {toPersianDigits(course.credits)} واحد
                    </span>
                  </div>

                  {/* Instructor */}
                  {course.instructor && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
                      <User className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate">{course.instructor}</span>
                    </div>
                  )}

                  {/* Sessions list */}
                  <div className="text-[10.5px] text-slate-600 dark:text-slate-400 space-y-0.5 pt-1.5 mt-1 border-t border-slate-100 dark:border-[#2a2b30]/50">
                    {course.sessions.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">
                          {getDayFaName(s.day)} {toPersianDigits(s.startTime)} تا {toPersianDigits(s.endTime)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Exam Date */}
                  {course.exam?.date && (
                    <div className="text-[10px] text-indigo-700 dark:text-emerald-300 bg-indigo-50/70 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded mt-1.5 flex items-center gap-1 font-medium truncate">
                      <Calendar className="w-2.5 h-2.5 text-indigo-500 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">امتحان: {formatExamDate(course.exam.date)} (ساعت {toPersianDigits(course.exam.startTime)})</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100 dark:border-[#2a2b30]/50">
                  <button
                    type="button"
                    onClick={() => onEditCourse(course)}
                    className="p-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-indigo-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors"
                    title="ویرایش درس"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`آیا از حذف درس «${course.name}» اطمینان دارید؟`)) {
                        onDeleteCourse(course.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors"
                    title="حذف درس"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Footer Controls: Clear All if courses exist */}
      {courses.length > 0 && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              if (confirm('آیا از پاک کردن تمامی دروس این برنامه اطمینان دارید؟')) {
                onClearAll();
              }
            }}
            className="text-rose-600 hover:text-rose-800 font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            پاکسازی تمام دروس
          </button>
        </div>
      )}

    </div>
  );
};
