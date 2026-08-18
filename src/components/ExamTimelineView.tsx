import React, { useMemo } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Edit } from 'lucide-react';
import { Course } from '../types/schedule';
import { COLOR_PALETTE, toPersianDigits, findExamConflicts } from '../utils/timeUtils';

interface ExamTimelineViewProps {
  courses: Course[];
  onEditCourse: (course: Course) => void;
  onOpenAddModal: () => void;
}

export const ExamTimelineView: React.FC<ExamTimelineViewProps> = ({
  courses,
  onEditCourse,
  onOpenAddModal,
}) => {
  // Sort courses by exam date and start time
  const sortedExams = useMemo(() => {
    return [...courses].sort((a, b) => {
      const dateA = a.exam?.date || '9999/99/99';
      const dateB = b.exam?.date || '9999/99/99';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return (a.exam?.startTime || '00:00').localeCompare(b.exam?.startTime || '00:00');
    });
  }, [courses]);

  // Check for any exam conflicts across the entire course list
  const examConflicts = useMemo(() => {
    const list: { courseA: Course; courseB: Course; date: string; time: string }[] = [];
    for (let i = 0; i < courses.length; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        const c1 = courses[i];
        const c2 = courses[j];
        if (c1.exam?.date && c2.exam?.date && c1.exam.date === c2.exam.date) {
          const conflicts = findExamConflicts(c1.exam, [c2]);
          if (conflicts.length > 0) {
            list.push({
              courseA: c1,
              courseB: c2,
              date: c1.exam.date,
              time: `${c1.exam.startTime} تا ${c1.exam.endTime}`,
            });
          }
        }
      }
    }
    return list;
  }, [courses]);

  const getCourseTheme = (colorId: string) => {
    return COLOR_PALETTE.find((c) => c.id === colorId) || COLOR_PALETTE[0];
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-extrabold text-slate-800">
              تقویم و برنامه زمان‌بندی امتحانات پایان ترم
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            امتحانات بر اساس تاریخ و ساعت برگزاری مرتب شده‌اند تا بتوانید فرجه‌های مطالعاتی را برنامه‌ریزی کنید.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {examConflicts.length > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{toPersianDigits(examConflicts.length)} تداخل امتحانی یافت شد!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>امتحانات بدون هم‌پوشانی و تداخل زمانی</span>
            </div>
          )}
        </div>
      </div>

      {/* Conflict Alert if any */}
      {examConflicts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 space-y-2">
          <div className="font-bold text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            هشدار تداخل امتحانات:
          </div>
          <div className="space-y-1.5 text-xs">
            {examConflicts.map((c, idx) => (
              <div key={idx} className="bg-white/80 p-2.5 rounded-xl border border-rose-200 flex items-center justify-between">
                <span>
                  امتحان درس <strong>«{c.courseA.name}»</strong> با درس <strong>«{c.courseB.name}»</strong> در تاریخ {toPersianDigits(c.date)} همزمانی دارد.
                </span>
                <button
                  type="button"
                  onClick={() => onEditCourse(c.courseA)}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700"
                >
                  ویرایش تاریخ
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedExams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-slate-800">هیچ درسی برای نمایش امتحانات ثبت نشده است</h3>
            <p className="text-xs text-slate-500">
              با افزودن دروس خود به برنامه، تقویم امتحانات به صورت خودکار ایجاد و کنترل تداخل انجام می‌شود.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            + افزودن اولین درس
          </button>
        </div>
      ) : (
        /* Exam Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedExams.map((course, index) => {
            const theme = getCourseTheme(course.color);
            const exam = course.exam;
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between p-5 space-y-4"
              >
                {/* Top Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">
                      {toPersianDigits(index + 1)}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">
                        {course.name}
                      </h3>
                      {course.instructor && (
                        <span className="text-xs text-slate-500">
                          استاد: {course.instructor}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${theme.bg} ${theme.text}`}>
                    {toPersianDigits(course.credits)} واحد
                  </span>
                </div>

                {/* Exam Date & Time Box */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      تاریخ برگزاری:
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {toPersianDigits(exam?.date || 'مشخص نشده')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      ساعت آزمون:
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {toPersianDigits(`${exam?.startTime || '--:--'} الی ${exam?.endTime || '--:--'}`)}
                    </span>
                  </div>

                  {exam?.notes && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      یادداشت: {exam.notes}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onEditCourse(course)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    ویرایش زمان امتحان
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
