import React, { useState } from 'react';
import { Course, DayOfWeek, ClassSession } from '../types/schedule';
import { 
  Plus, Calendar, Clock, User, AlertTriangle, 
  Trash2, Edit, X, Info 
} from 'lucide-react';
import { toPersianDigits, getDayFaName, getCourseTheme, formatExamDate } from '../utils/timeUtils';

interface TimetableGridProps {
  courses: Course[];
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddCourseAtSlot: (day: DayOfWeek, startTime: string, endTime: string) => void;
  showFriday: boolean;
  onToggleFriday: () => void;
}

const DAYS_STANDARD: { id: DayOfWeek; fa: string }[] = [
  { id: 'saturday', fa: 'شنبه' },
  { id: 'sunday', fa: 'یک‌شنبه' },
  { id: 'monday', fa: 'دوشنبه' },
  { id: 'tuesday', fa: 'سه‌شنبه' },
  { id: 'wednesday', fa: 'چهارشنبه' },
  { id: 'thursday', fa: 'پنج‌شنبه' },
];

const FRIDAY_DAY: { id: DayOfWeek; fa: string } = { id: 'friday', fa: 'جمعه' };

// Working timeline range: 07:00 to 19:30 (12.5 hours total)
const START_HOUR = 7;
const END_HOUR = 19;
const START_MINUTES = START_HOUR * 60; // 420
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60 + 30; // 750

// Hours list: 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  courses,
  onEditCourse,
  onDeleteCourse,
  onAddCourseAtSlot,
  showFriday,
  onToggleFriday,
}) => {
  const [selectedCourseCard, setSelectedCourseCard] = useState<{ course: Course; session: ClassSession } | null>(null);

  const displayedDays = showFriday ? [...DAYS_STANDARD, FRIDAY_DAY] : DAYS_STANDARD;

  // Convert time "HH:mm" to minutes from 00:00
  const timeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Compute CSS position (% from right in RTL) and width (%)
  const getSessionStyle = (session: ClassSession) => {
    const sessionStart = timeToMinutes(session.startTime);
    const sessionEnd = timeToMinutes(session.endTime);

    const clampedStart = Math.max(START_MINUTES, sessionStart);
    const clampedEnd = Math.min(START_MINUTES + TOTAL_MINUTES, sessionEnd);
    const duration = Math.max(15, clampedEnd - clampedStart);

    const rightPercent = ((clampedStart - START_MINUTES) / TOTAL_MINUTES) * 100;
    const widthPercent = (duration / TOTAL_MINUTES) * 100;

    return {
      right: `${rightPercent}%`,
      width: `${widthPercent}%`,
    };
  };

  // Find overlapping course sessions
  const conflictsMap = new Map<string, boolean>();
  courses.forEach((c1) => {
    c1.sessions.forEach((s1) => {
      courses.forEach((c2) => {
        if (c1.id === c2.id) return;
        c2.sessions.forEach((s2) => {
          if (s1.day === s2.day) {
            const start1 = timeToMinutes(s1.startTime);
            const end1 = timeToMinutes(s1.endTime);
            const start2 = timeToMinutes(s2.startTime);
            const end2 = timeToMinutes(s2.endTime);

            // Overlap condition
            if (start1 < end2 && end1 > start2) {
              conflictsMap.set(`${c1.id}-${s1.id}`, true);
              conflictsMap.set(`${c2.id}-${s2.id}`, true);
            }
          }
        });
      });
    });
  });

  return (
    <div className="w-full bg-white dark:bg-[#1c1d21] rounded-2xl border border-indigo-200 dark:border-[#00B87C]/50 overflow-hidden shadow-xs transition-colors duration-200">
      
      {/* Grid Top Header: Title & Quick controls */}
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200 dark:border-[#2a2b30] bg-white dark:bg-[#1c1d21] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-emerald-500 animate-pulse" />
          <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
            برنامه هفتگی کلاس‌ها
          </h2>
          <span className="text-[11px] font-bold text-indigo-700 dark:text-emerald-400 bg-indigo-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-emerald-800/50">
            {toPersianDigits(courses.length)} درس
          </span>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={onToggleFriday}
            className={`text-xs px-2.5 sm:px-3.5 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
              showFriday
                ? 'bg-indigo-50 dark:bg-emerald-900/30 text-indigo-700 dark:text-emerald-400 border-indigo-300 dark:border-emerald-500/50 shadow-xs'
                : 'bg-slate-50 dark:bg-[#1c1d21] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#383a40] hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {showFriday ? '✓ روز جمعه فعال' : '+ افزودن روز جمعه'}
          </button>
        </div>
      </div>

      {/* Main Full-Width Responsive Timetable (No horizontal scroll needed) */}
      <div className="w-full select-none bg-slate-50/20 dark:bg-[#1c1d21]/20">
        
        {/* Top Time Header (Horizontal Axis) */}
        <div className="flex border-b border-slate-200 dark:border-[#2a2b30] bg-slate-100/95 dark:bg-[#1c1d21]/95 text-xs font-bold text-slate-700 sticky top-0 z-10">
          
          {/* Days Column Header */}
          <div className="w-16 sm:w-20 md:w-24 shrink-0 py-2.5 sm:py-3 px-1 text-center border-l border-slate-200 dark:border-[#2a2b30] flex items-center justify-center text-slate-700 dark:text-slate-400 font-black bg-slate-100 dark:bg-[#1c1d21] text-[11px] sm:text-xs">
            
          </div>

          {/* Time Slots Header (07:00 to 19:00) */}
          <div className="flex-1 relative h-9 sm:h-11">
            {HOURS.map((hour, index) => {
              const hourMin = hour * 60;
              const rightPercent = ((hourMin - START_MINUTES) / TOTAL_MINUTES) * 100;
              const halfHourPercent = ((hourMin + 30 - START_MINUTES) / TOTAL_MINUTES) * 100;
              const fullTimeString = `${hour.toString().padStart(2, '0')}:۰۰`;
              const shortTimeString = `${hour.toString().padStart(2, '0')}`;

              // Position alignment for edge safety
              let transformClass = 'translate(50%, -50%)';

              return (
                <React.Fragment key={hour}>
                  {/* 1-Hour Step Label: Responsive (Full format on sm+, short on mobile) */}
                  <div
                    className="absolute top-1/2 pointer-events-none z-10 whitespace-nowrap"
                    style={{
                      right: `${rightPercent}%`,
                      transform: transformClass,
                    }}
                  >
                    <span className="hidden sm:inline font-bold text-[10.5px] text-slate-800 dark:text-slate-300 bg-slate-100/95 dark:bg-slate-800/95 px-1 py-0.5 rounded shadow-2xs">
                      {toPersianDigits(fullTimeString)}
                    </span>
                    <span className="sm:hidden font-bold text-[9px] text-slate-800 dark:text-slate-300 bg-slate-100/95 dark:bg-slate-800/95 px-0.5 py-0.2 rounded shadow-2xs">
                      {toPersianDigits(shortTimeString)}
                    </span>
                  </div>

                  {/* 1-Hour Solid Tick Line in Header */}
                  <div
                    className="absolute top-0 bottom-0 border-r border-slate-300 dark:border-[#383a40] sm:border-r-2 pointer-events-none"
                    style={{ right: `${rightPercent}%` }}
                  />

                  {/* Half-Hour Dashed Tick Line in Header (No text above) */}
                  <div
                    className="absolute top-0 bottom-0 border-r border-dashed border-slate-300/80 dark:border-[#383a40]/80 pointer-events-none"
                    style={{ right: `${halfHourPercent}%` }}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Days Rows (Vertical Axis) */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {displayedDays.map((day) => {
            // Sessions for this specific day
            const daySessions: { course: Course; session: ClassSession }[] = [];
            courses.forEach((c) => {
              c.sessions.forEach((s) => {
                if (s.day === day.id) {
                  daySessions.push({ course: c, session: s });
                }
              });
            });

            return (
              <div key={day.id} className="flex min-h-[48px] sm:min-h-[64px] md:min-h-[80px] lg:min-h-[96px] group/row transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                
                {/* Day Label (Right sticky column) */}
                <div className="w-16 sm:w-20 md:w-24 shrink-0 p-1.5 sm:p-2 border-l border-slate-200 dark:border-[#2a2b30] bg-slate-50/80 dark:bg-[#1c1d21]/80 flex flex-col justify-center items-center text-center">
                  <span className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    {day.fa}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {daySessions.length > 0
                      ? `${toPersianDigits(daySessions.length)} درس`
                      : '—'}
                  </span>
                </div>

                {/* Day Timeline Strip (100% fluid) */}
                <div
                  className="flex-1 relative cursor-crosshair bg-white dark:bg-[#131416] overflow-hidden"
                  onClick={(e) => {
                    // Click on empty space to add course at this exact slot
                    if ((e.target as HTMLElement).closest('.course-card-item')) {
                      return;
                    }
                    const rect = e.currentTarget.getBoundingClientRect();
                    // In RTL, 07:00 is on the right
                    const clickXFromRight = rect.right - e.clientX;
                    const percent = Math.max(0, Math.min(1, clickXFromRight / rect.width));
                    const clickedMinutes = START_MINUTES + percent * TOTAL_MINUTES;

                    // Snap to nearest 15 mins
                    const snappedMin = Math.floor(clickedMinutes / 15) * 15;
                    const startH = Math.floor(snappedMin / 60);
                    const startM = snappedMin % 60;
                    const endH = Math.floor((snappedMin + 120) / 60);
                    const endM = (snappedMin + 120) % 60;

                    const startTimeStr = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
                    const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

                    onAddCourseAtSlot(day.id, startTimeStr, endTimeStr);
                  }}
                >
                  {/* Vertical Guidelines for Hours & Half-Hours */}
                  {HOURS.map((hour, index) => {
                    const hourMin = hour * 60;
                    const rightPercent = ((hourMin - START_MINUTES) / TOTAL_MINUTES) * 100;
                    const halfHourPercent = ((hourMin + 30 - START_MINUTES) / TOTAL_MINUTES) * 100;

                    return (
                      <React.Fragment key={hour}>
                        {/* Solid Distinct 1-Hour Grid Line */}
                        <div
                          className="absolute top-0 bottom-0 border-r border-slate-200 dark:border-[#2a2b30] sm:border-r-2 pointer-events-none z-0"
                          style={{ right: `${rightPercent}%` }}
                        />

                        {/* Faint Dashed 30-Minute Grid Line */}
                        <div
                          className="absolute top-0 bottom-0 border-r border-dashed border-slate-200/80 dark:border-[#2a2b30]/80 pointer-events-none z-0"
                          style={{ right: `${halfHourPercent}%` }}
                        />
                      </React.Fragment>
                    );
                  })}

                  {/* Render Course Session Cards */}
                  {daySessions.map(({ course, session }) => {
                    const theme = getCourseTheme(course.color);
                    const style = getSessionStyle(session);
                    const isConflicted = conflictsMap.has(`${course.id}-${session.id}`);

                    return (
                      <div
                        key={`${course.id}-${session.id}`}
                        style={style}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourseCard({ course, session });
                        }}
                        className={`course-card-item absolute inset-y-1 sm:inset-y-1.5 rounded-lg sm:rounded-xl p-1.5 sm:p-2 transition-all shadow-2xs hover:shadow-md cursor-pointer border flex flex-col justify-between overflow-hidden group/card z-10 ${
                          isConflicted
                            ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-300'
                            : theme.lightBg
                        }`}
                      >
                        {/* Course Name & Credits */}
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-black text-[10.5px] sm:text-xs leading-tight line-clamp-1">
                              {course.name}
                            </span>
                            <span className={`text-[9px] sm:text-[10px] font-black px-1 py-0.2 rounded shrink-0 ${theme.bg} ${theme.text}`}>
                              {toPersianDigits(course.credits)}و
                            </span>
                          </div>

                          {/* Instructor (visible when available) */}
                          {course.instructor && course.instructor.trim() !== '' && (
                            <div className="flex items-center gap-0.5 text-[9px] sm:text-[9.5px] font-medium opacity-90 mt-0.5 truncate">
                              <User className="w-2.5 h-2.5 shrink-0 opacity-70" />
                              <span className="truncate">{course.instructor.trim()}</span>
                            </div>
                          )}
                        </div>

                        {/* Conflict warning badge */}
                        {isConflicted && (
                          <div className="bg-rose-500 text-white text-[9px] px-1 py-0.2 rounded flex items-center gap-0.5 font-bold my-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                            <span>تداخل!</span>
                          </div>
                        )}

                        {/* Time & Exam indicator */}
                        <div className="mt-0.5 pt-0.5 border-t border-current/10 flex items-center justify-between text-[9px] sm:text-[10px] font-bold">
                          <span className="opacity-90 truncate text-right">
                            {toPersianDigits(session.endTime)} - {toPersianDigits(session.startTime)}
                          </span>
                          {course.exam?.date && (
                            <span className="hidden sm:inline-flex text-[8.5px] px-1 py-0.2 rounded bg-black/10 items-center gap-0.5 font-medium shrink-0">
                              <Calendar className="w-2 h-2" />
                              امتحان
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Floating Modal for Course Card Quick View / Actions */}
      {selectedCourseCard && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in print:hidden"
          onClick={() => setSelectedCourseCard(null)}
        >
          <div 
            className="bg-white dark:bg-[#1c1d21] rounded-2xl border border-slate-200 dark:border-[#2a2b30] shadow-xl max-w-sm w-full p-5 space-y-4 transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-emerald-500">مشخصات درس</span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedCourseCard.course.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCourseCard(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#1c1d21]/80 p-3 rounded-xl border border-slate-100 dark:border-[#2a2b30]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">تعداد واحد:</span>
                <span className="font-bold">{toPersianDigits(selectedCourseCard.course.credits)} واحد</span>
              </div>
              {selectedCourseCard.course.code && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">کد درس:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100" dir="ltr">
                    {toPersianDigits(selectedCourseCard.course.code)}
                  </span>
                </div>
              )}
              {selectedCourseCard.course.instructor && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">استاد:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedCourseCard.course.instructor}</span>
                </div>
              )}
              {selectedCourseCard.course.faculty && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">دانشکده:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedCourseCard.course.faculty}</span>
                </div>
              )}
              {selectedCourseCard.course.gender && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">جنسیت اعضای شرکت‌کننده:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedCourseCard.course.gender === 'mixed'
                      ? 'مختلط'
                      : selectedCourseCard.course.gender === 'men'
                      ? 'آقایان'
                      : 'بانوان'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">زمان این جلسه:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {getDayFaName(selectedCourseCard.session.day)} {toPersianDigits(selectedCourseCard.session.startTime)} تا {toPersianDigits(selectedCourseCard.session.endTime)}
                </span>
              </div>
              {selectedCourseCard.course.exam?.date && (
                <div className="flex items-center justify-between text-indigo-700 dark:text-emerald-400 font-bold pt-1 border-t border-slate-200 dark:border-[#383a40]/50">
                  <span>تاریخ آزمون پایان ترم:</span>
                  <span>
                    {formatExamDate(selectedCourseCard.course.exam.date)} (ساعت {toPersianDigits(selectedCourseCard.course.exam.startTime)})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#2a2b30]">
              <button
                type="button"
                onClick={() => {
                  const c = selectedCourseCard.course;
                  setSelectedCourseCard(null);
                  onDeleteCourse(c.id);
                }}
                className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف درس
              </button>

              <button
                type="button"
                onClick={() => {
                  const c = selectedCourseCard.course;
                  setSelectedCourseCard(null);
                  onEditCourse(c);
                }}
                className="px-4 py-2 text-xs font-bold text-white dark:text-black bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] rounded-xl transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                ویرایش کامل
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
