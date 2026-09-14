import React from 'react';
import { Course, ClassSession, DayOfWeek } from '../types/schedule';
import { 
  toPersianDigits, 
  getDayFaName, 
  formatExamDate, 
  timeToMinutes, 
  getCourseTheme 
} from '../utils/timeUtils';
import { GraduationCap, Calendar, Clock, User, BookOpen } from 'lucide-react';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

export interface PrintOptions {
  orientation: 'landscape' | 'portrait';
  theme: 'color' | 'bw';
  showStudentInfo: boolean;
  showUniversity: boolean;
  showExamsTable: boolean;
  showFriday: boolean;
  density: 'standard' | 'compact';
  showStars: boolean;
}

interface PrintableScheduleDocumentProps {
  courses: Course[];
  planName: string;
  studentInfo?: {
    name?: string;
    id?: string;
    universityName?: string;
  } | null;
  options: PrintOptions;
  isPrintPreview?: boolean;
}

const DAYS_ORDER: { id: DayOfWeek; fa: string }[] = [
  { id: 'saturday', fa: 'شنبه' },
  { id: 'sunday', fa: 'یک‌شنبه' },
  { id: 'monday', fa: 'دوشنبه' },
  { id: 'tuesday', fa: 'سه‌شنبه' },
  { id: 'wednesday', fa: 'چهارشنبه' },
  { id: 'thursday', fa: 'پنج‌شنبه' },
  { id: 'friday', fa: 'جمعه' },
];

const START_HOUR = 7;
const END_HOUR = 19;
const START_MINUTES = START_HOUR * 60; // 420
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60 + 30; // 750
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

// Dynamic font size calculator for course names to fit comfortably without dropping below legible size (min 7.5px)
const getCourseNameFontSize = (name: string, durationMinutes: number, isCompact: boolean): string => {
  const len = (name || '').trim().length;

  if (durationMinutes <= 90) {
    if (len <= 12) return isCompact ? 'text-[9.5px]' : 'text-[10px]';
    if (len <= 20) return isCompact ? 'text-[8.5px]' : 'text-[9px]';
    if (len <= 28) return 'text-[8px]';
    return 'text-[7.5px]'; // Hard minimum legible limit
  }

  if (durationMinutes <= 135) {
    if (len <= 16) return isCompact ? 'text-[10px]' : 'text-[11px]';
    if (len <= 26) return isCompact ? 'text-[9px]' : 'text-[9.5px]';
    if (len <= 36) return isCompact ? 'text-[8px]' : 'text-[8.5px]';
    return 'text-[7.5px]'; // Hard minimum legible limit
  }

  // Duration > 135 mins
  if (len <= 22) return isCompact ? 'text-[10.5px]' : 'text-[11.5px]';
  if (len <= 34) return isCompact ? 'text-[9.5px]' : 'text-[10px]';
  return 'text-[8.5px]';
};

// Dynamic font size calculator for instructor names to fit comfortably without dropping below legible size (min 7px)
const getInstructorFontSize = (instructor: string, durationMinutes: number, isCompact: boolean): string => {
  const len = (instructor || '').trim().length;

  if (durationMinutes <= 90) {
    if (len <= 12) return isCompact ? 'text-[8px]' : 'text-[8.5px]';
    if (len <= 18) return isCompact ? 'text-[7.5px]' : 'text-[8px]';
    return 'text-[7px]'; // Hard minimum legible limit
  }

  if (durationMinutes <= 135) {
    if (len <= 15) return isCompact ? 'text-[8px]' : 'text-[9px]';
    if (len <= 24) return isCompact ? 'text-[7.5px]' : 'text-[8px]';
    return 'text-[7px]'; // Hard minimum legible limit
  }

  // Duration > 135 mins
  if (len <= 20) return isCompact ? 'text-[8.5px]' : 'text-[9px]';
  if (len <= 30) return isCompact ? 'text-[8px]' : 'text-[8.5px]';
  return 'text-[7px]';
};

export const PrintableScheduleDocument: React.FC<PrintableScheduleDocumentProps> = ({
  courses,
  planName,
  studentInfo,
  options,
  isPrintPreview = false,
}) => {
  // Compute today's Persian date
  const todayPersian = new DateObject({ calendar: persian, locale: persian_fa }).format('YYYY/MM/DD');

  const hasFridayCourses = courses.some(c => (c.sessions || []).some(s => s.day === 'friday'));
  const isFridayIncluded = options.showFriday || hasFridayCourses;
  const activeDays = isFridayIncluded 
    ? DAYS_ORDER 
    : DAYS_ORDER.filter(d => d.id !== 'friday');

  const totalCredits = courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

  // Position calculation for sessions
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

  const isBW = options.theme === 'bw';
  const isCompact = options.density === 'compact';

  return (
    <div 
      className={`bg-white text-slate-900 font-['Vazirmatn',sans-serif] w-full print:p-0 print:m-0 print:select-text ${
        isPrintPreview ? 'p-6 sm:p-8 select-none' : 'p-6'
      }`}
      dir="rtl"
    >
      {/* 1. DOCUMENT OFFICIAL HEADER */}
      <header className={`border-b-2 pb-3 mb-4 flex items-start justify-between gap-4 ${
        isBW ? 'border-black' : 'border-slate-800'
      }`}>
        {/* Right Section: Title, University & Plan */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${
              isBW ? 'bg-black text-white' : 'bg-indigo-600 text-white'
            }`}>
              <Calendar className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              برنامه هفتگی انتخاب واحد
            </h1>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-600 pt-0.5 flex-wrap">
            {options.showUniversity && (studentInfo?.universityName) && (
              <span className="flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
                {studentInfo.universityName}
              </span>
            )}
            <span className="font-bold text-slate-700">
              برنامه: <strong className="font-black text-slate-900">«{planName}»</strong>
            </span>
          </div>
        </div>

        {/* Center Section: Student Name & ID (if enabled) */}
        {options.showStudentInfo && (studentInfo?.name || studentInfo?.id) && (
          <div className="text-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 shadow-2xs">
            {studentInfo?.name && (
              <div className="text-xs font-black text-slate-900 flex items-center justify-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{studentInfo.name}</span>
              </div>
            )}
            {studentInfo?.id && (
              <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                شماره دانشجویی: <span className="font-black text-slate-800">{toPersianDigits(studentInfo.id)}</span>
              </div>
            )}
          </div>
        )}

        {/* Left Section: Stats & Date */}
        <div className="text-left text-xs text-slate-600 space-y-1 shrink-0">
          <div className="flex items-center justify-end gap-2">
            <span className="bg-slate-100 px-2 py-0.5 rounded font-black text-slate-800 border border-slate-200">
              {toPersianDigits(courses.length)} درس
            </span>
            <span className="bg-slate-100 px-2 py-0.5 rounded font-black text-slate-800 border border-slate-200">
              {toPersianDigits(totalCredits)} واحد
            </span>
          </div>
          <div className="text-[10.5px] font-medium text-slate-500 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" />
            <span>تاریخ صدور: {toPersianDigits(todayPersian)}</span>
          </div>
        </div>
      </header>

      {/* 2. TIMETABLE GRID */}
      <section className={`border rounded-xl overflow-hidden mb-5 ${
        isBW ? 'border-black' : 'border-slate-300'
      }`}>
        {/* Hours Header Row */}
        <div className={`flex border-b text-[10.5px] font-black ${
          isBW ? 'border-black bg-slate-100 text-black' : 'border-slate-300 bg-slate-100 text-slate-800'
        }`}>
          {/* Days Column Blank Corner */}
          <div className={`w-14 sm:w-16 shrink-0 py-1.5 px-1 border-l ${
            isBW ? 'border-black' : 'border-slate-300'
          }`} />

          {/* Time axis (07:00 to 19:00) */}
          <div className="flex-1 relative h-7">
            {HOURS.map((hour) => {
              const hourMin = hour * 60;
              const rightPercent = ((hourMin - START_MINUTES) / TOTAL_MINUTES) * 100;
              const halfHourPercent = ((hourMin + 30 - START_MINUTES) / TOTAL_MINUTES) * 100;
              const timeString = `${hour.toString().padStart(2, '0')}:۰۰`;

              return (
                <React.Fragment key={hour}>
                  {/* Hour label */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap z-10"
                    style={{
                      right: `${rightPercent}%`,
                      transform: 'translate(50%, -50%)',
                    }}
                  >
                    <span className="font-extrabold text-[9.5px] text-slate-800 px-0.5 bg-slate-100/90 rounded">
                      {toPersianDigits(timeString)}
                    </span>
                  </div>

                  {/* 1-Hour Tick Line */}
                  <div
                    className={`absolute top-0 bottom-0 border-r pointer-events-none ${
                      isBW ? 'border-black' : 'border-slate-300'
                    }`}
                    style={{ right: `${rightPercent}%` }}
                  />

                  {/* 30-Minute Dashed Line */}
                  <div
                    className="absolute top-0 bottom-0 border-r border-dashed border-slate-300/80 pointer-events-none"
                    style={{ right: `${halfHourPercent}%` }}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Days Rows */}
        <div className={`divide-y ${isBW ? 'divide-black' : 'divide-slate-200'}`}>
          {activeDays.map((day) => {
            const daySessions: { course: Course; session: ClassSession }[] = [];
            courses.forEach((c) => {
              (c.sessions || []).forEach((s) => {
                if (s.day === day.id) {
                  daySessions.push({ course: c, session: s });
                }
              });
            });

            return (
              <div 
                key={day.id} 
                className={`flex transition-colors ${
                  isCompact ? 'min-h-[50px] sm:min-h-[58px]' : 'min-h-[64px] sm:min-h-[74px]'
                }`}
              >
                {/* Day Label Cell */}
                <div className={`w-14 sm:w-16 shrink-0 p-1 border-l bg-slate-50 flex flex-col justify-center items-center text-center ${
                  isBW ? 'border-black text-black' : 'border-slate-300 text-slate-800'
                }`}>
                  <span className="font-black text-xs">
                    {day.fa}
                  </span>
                  <span className="text-[9.5px] font-medium text-slate-500 mt-0.5">
                    {daySessions.length > 0 ? `${toPersianDigits(daySessions.length)} درس` : '—'}
                  </span>
                </div>

                {/* Day Timeline Strip */}
                <div className="flex-1 relative bg-white overflow-hidden">
                  {/* Background Grid Lines */}
                  {HOURS.map((hour) => {
                    const hourMin = hour * 60;
                    const rightPercent = ((hourMin - START_MINUTES) / TOTAL_MINUTES) * 100;
                    const halfHourPercent = ((hourMin + 30 - START_MINUTES) / TOTAL_MINUTES) * 100;

                    return (
                      <React.Fragment key={hour}>
                        <div
                          className={`absolute top-0 bottom-0 border-r pointer-events-none z-0 ${
                            isBW ? 'border-slate-200' : 'border-slate-200'
                          }`}
                          style={{ right: `${rightPercent}%` }}
                        />
                        <div
                          className="absolute top-0 bottom-0 border-r border-dashed border-slate-100 pointer-events-none z-0"
                          style={{ right: `${halfHourPercent}%` }}
                        />
                      </React.Fragment>
                    );
                  })}

                  {/* Course Cards */}
                  {daySessions.map(({ course, session }) => {
                    const theme = getCourseTheme(course.color);
                    const style = getSessionStyle(session);
                    const sessionStart = timeToMinutes(session.startTime);
                    const sessionEnd = timeToMinutes(session.endTime);
                    const durationMinutes = Math.max(15, sessionEnd - sessionStart);
                    const nameFontSize = getCourseNameFontSize(course.name, durationMinutes, isCompact);
                    const instructorFontSize = getInstructorFontSize(course.instructor || '', durationMinutes, isCompact);

                    return (
                      <div
                        key={`${course.id}-${session.id}`}
                        style={style}
                        className={`absolute inset-y-1 rounded-md p-1 sm:p-1.5 flex flex-col justify-between overflow-hidden z-10 ${
                          isBW
                            ? 'bg-white border-2 border-black text-black shadow-none'
                            : `${theme.lightBg} border shadow-2xs print:shadow-none`
                        }`}
                      >
                        {/* Course Name & Instructor */}
                        <div className="min-w-0 flex-1">
                          <span 
                            className={`font-bold leading-tight break-words line-clamp-2 block ${nameFontSize}`}
                            title={course.name}
                          >
                            {options.showStars && course.isStarred && (
                              <span className={`inline-block me-1 select-none ${isBW ? 'text-black' : 'text-amber-500'}`}>★</span>
                            )}
                            {course.name}
                          </span>

                          {/* Instructor */}
                          {course.instructor && course.instructor.trim() !== '' && (
                            <div 
                              className={`font-normal mt-0.5 leading-tight truncate ${
                                isBW ? 'text-black' : 'text-current'
                              } ${instructorFontSize}`}
                              title={course.instructor.trim()}
                            >
                              {course.instructor.trim()}
                            </div>
                          )}
                        </div>

                        {/* Class Timing (Hidden in compact mode as requested) */}
                        {!isCompact && (
                          <div 
                            dir="ltr"
                            className="text-[9px] font-medium tracking-tight text-center pt-0.5 border-t border-current/25 shrink-0 text-current"
                          >
                            {toPersianDigits(session.startTime)} - {toPersianDigits(session.endTime)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. COURSES & EXAMS TABLE (If enabled) */}
      {options.showExamsTable && courses.length > 0 && (
        <section className="mt-4 break-inside-avoid">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-300">
            <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-700" />
              <span>مشخصات دروس و برنامه امتحانات پایان‌ترم</span>
            </h2>
            <span className="text-[10px] font-bold text-slate-500">
              تعداد دروس ثبت‌شده: {toPersianDigits(courses.length)}
            </span>
          </div>

          <div className={`overflow-x-auto rounded-lg border ${
            isBW ? 'border-black' : 'border-slate-300'
          }`}>
            <table className="w-full text-right text-[10.5px] border-collapse">
              <thead>
                <tr className={`${isBW ? 'bg-slate-100 text-black border-b border-black' : 'bg-slate-100 text-slate-800 border-b border-slate-300'} font-black`}>
                  <th className="py-1.5 px-2 border-l border-current/20 w-8 text-center">#</th>
                  <th className="py-1.5 px-2.5 border-l border-current/20">کد درس</th>
                  <th className="py-1.5 px-3 border-l border-current/20">نام درس</th>
                  <th className="py-1.5 px-2 border-l border-current/20 text-center w-12">واحد</th>
                  <th className="py-1.5 px-3 border-l border-current/20">استاد</th>
                  <th className="py-1.5 px-3 border-l border-current/20">زمان تشکیل کلاس‌ها</th>
                  <th className="py-1.5 px-3">تاریخ و ساعت امتحان پایان‌ترم</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isBW ? 'divide-black' : 'divide-slate-200'}`}>
                {courses.map((course, idx) => {
                  // Format session times nicely: e.g. "شنبه، دوشنبه (۰۸:۰۰ - ۱۰:۰۰)"
                  const sessionsText = (course.sessions || [])
                    .map((s) => `${getDayFaName(s.day)} (${toPersianDigits(s.startTime)} تا ${toPersianDigits(s.endTime)})`)
                    .join(' | ') || '—';

                  // Format exam text
                  const examText = course.exam?.date 
                    ? `${formatExamDate(course.exam.date)} ${course.exam.startTime ? `(${toPersianDigits(course.exam.startTime)} تا ${toPersianDigits(course.exam.endTime || '')})` : ''}`
                    : 'بدون امتحان';

                  const isRowEven = idx % 2 === 1;

                  return (
                    <tr 
                      key={course.id} 
                      className={`${isRowEven ? 'bg-slate-50/60' : 'bg-white'}`}
                    >
                      <td className="py-1.5 px-2 border-l border-slate-200 text-center font-bold text-slate-600">
                        {toPersianDigits(idx + 1)}
                      </td>
                      <td className="py-1.5 px-2.5 border-l border-slate-200 font-bold text-slate-800 text-center">
                        {course.code ? (
                          <span dir="ltr" className="inline-block tracking-tight">
                            {toPersianDigits(course.code)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-1.5 px-3 border-l border-slate-200 font-bold text-slate-900">
                        {options.showStars && course.isStarred && (
                          <span className={`inline-block me-1 select-none ${isBW ? 'text-black' : 'text-amber-500'}`}>★</span>
                        )}
                        {course.name}
                      </td>
                      <td className="py-1.5 px-2 border-l border-slate-200 text-center font-bold text-slate-800">
                        {toPersianDigits(course.credits)}
                      </td>
                      <td className="py-1.5 px-3 border-l border-slate-200 font-medium text-slate-700">
                        {course.instructor || '—'}
                      </td>
                      <td className="py-1.5 px-3 border-l border-slate-200 font-medium text-slate-700">
                        {sessionsText}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-800">
                        {examText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. DOCUMENT FOOTER */}
      <footer className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-400">
        <span>سامانه مدیریت و انتخاب واحد دانشگاهی UniSchedule</span>
        <span>امکان بروز تغییرات در زمان‌بندی توسط دانشکده یا دانشگاه وجود دارد.</span>
      </footer>
    </div>
  );
};
