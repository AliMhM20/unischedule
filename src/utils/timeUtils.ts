import { ClassSession, Course, DayOfWeek, ExamInfo, ScheduleConflict } from '../types/schedule';

import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export const DAYS_CONFIG: { id: DayOfWeek; fa: string; faShort: string; en: string }[] = [
  { id: 'saturday', fa: 'شنبه', faShort: 'شن', en: 'Saturday' },
  { id: 'sunday', fa: 'یک‌شنبه', faShort: 'یک', en: 'Sunday' },
  { id: 'monday', fa: 'دوشنبه', faShort: 'دو', en: 'Monday' },
  { id: 'tuesday', fa: 'سه‌شنبه', faShort: 'سه', en: 'Tuesday' },
  { id: 'wednesday', fa: 'چهارشنبه', faShort: 'چهار', en: 'Wednesday' },
  { id: 'thursday', fa: 'پنج‌شنبه', faShort: 'پنج', en: 'Thursday' },
  { id: 'friday', fa: 'جمعه', faShort: 'جمعه', en: 'Friday' },
];

export const COLOR_PALETTE = [
  { id: 'blue', bg: 'bg-blue-500', text: 'text-white', lightBg: 'bg-blue-50 text-blue-700 border-blue-200', hex: '#3b82f6', label: 'آبی اقیانوسی' },
  { id: 'emerald', bg: 'bg-emerald-500', text: 'text-white', lightBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', hex: '#10b981', label: 'سبز زمردی' },
  { id: 'violet', bg: 'bg-violet-500', text: 'text-white', lightBg: 'bg-violet-50 text-violet-700 border-violet-200', hex: '#8b5cf6', label: 'بنفش سلطنتی' },
  { id: 'amber', bg: 'bg-amber-500', text: 'text-white', lightBg: 'bg-amber-50 text-amber-800 border-amber-200', hex: '#f59e0b', label: 'کهربایی' },
  { id: 'rose', bg: 'bg-rose-500', text: 'text-white', lightBg: 'bg-rose-50 text-rose-700 border-rose-200', hex: '#f43f5e', label: 'سرخ گلی' },
  { id: 'cyan', bg: 'bg-cyan-500', text: 'text-white', lightBg: 'bg-cyan-50 text-cyan-800 border-cyan-200', hex: '#06b6d4', label: 'فیروزه‌ای' },
  { id: 'indigo', bg: 'bg-indigo-500', text: 'text-white', lightBg: 'bg-indigo-50 text-indigo-700 border-indigo-200', hex: '#6366f1', label: 'نیلی' },
  { id: 'teal', bg: 'bg-teal-500', text: 'text-white', lightBg: 'bg-teal-50 text-teal-700 border-teal-200', hex: '#14b8a6', label: 'یشمی' },
  { id: 'orange', bg: 'bg-orange-500', text: 'text-white', lightBg: 'bg-orange-50 text-orange-800 border-orange-200', hex: '#f97316', label: 'نارنجی پرتقالی' },
  { id: 'pink', bg: 'bg-pink-500', text: 'text-white', lightBg: 'bg-pink-50 text-pink-700 border-pink-200', hex: '#ec4899', label: 'صورتی روشن' },
];

export const UNIVERSITY_TIME_PRESETS = [
  { label: '۰۸:۰۰ الی ۱۰:۰۰ (صبح اول)', start: '08:00', end: '10:00' },
  { label: '۱۰:۰۰ الی ۱۲:۰۰ (صبح دوم)', start: '10:00', end: '12:00' },
  { label: '۱۳:۳۰ الی ۱۵:۳۰ (عصر اول)', start: '13:30', end: '15:30' },
  { label: '۱۵:۳۰ الی ۱۷:۳۰ (عصر دوم)', start: '15:30', end: '17:30' },
  { label: '۱۷:۳۰ الی ۱۹:۳۰ (عصر سوم)', start: '17:30', end: '19:30' },
  { label: '۰۸:۰۰ الی ۰۹:۳۰', start: '08:00', end: '09:30' },
  { label: '۰۹:۳۰ الی ۱۱:۰۰', start: '09:30', end: '11:00' },
  { label: '۱۱:۰۰ الی ۱۲:۳۰', start: '11:00', end: '12:30' },
  { label: '۱۳:۰۰ الی ۱۴:۳۰', start: '13:00', end: '14:30' },
  { label: '۱۴:۳۰ الی ۱۶:۰۰', start: '14:30', end: '16:00' },
];

export const EXAM_TIME_PRESETS = [
  { label: '۰۸:۳۰ الی ۱۰:۳۰ (صبح)', start: '08:30', end: '10:30' },
  { label: '۱۰:۳۰ الی ۱۲:۳۰ (قبل از ظهر)', start: '10:30', end: '12:30' },
  { label: '۱۳:۳۰ الی ۱۵:۳۰ (بعد از ظهر)', start: '13:30', end: '15:30' },
  { label: '۱۶:۰۰ الی ۱۸:۰۰ (عصر)', start: '16:00', end: '18:00' },
];

// Convert "HH:mm" to total minutes from 00:00
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  return hours * 60 + minutes;
}

// Convert minutes to "HH:mm"
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Check if two time intervals overlap (strictly overlapping, touching endpoints like 10:00-12:00 and 12:00-14:00 do NOT overlap)
export function isTimeRangeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  // Overlap condition: max(startA, startB) < min(endA, endB)
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

// Persian number formatter
export function toPersianDigits(num: number | string): string {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
}

// Format exam date to include day of week (e.g. "شنبه ۱۴۰۵/۰۹/۲۱")
export function formatExamDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('/')) return toPersianDigits(dateStr);
  try {
    const dateObj = new DateObject({ date: dateStr, format: "YYYY/MM/DD", calendar: persian, locale: persian_fa });
    return toPersianDigits(dateObj.format("dddd YYYY/MM/DD"));
  } catch (e) {
    return toPersianDigits(dateStr);
  }
}

// Day name in Persian
export function getDayFaName(day: DayOfWeek): string {
  const found = DAYS_CONFIG.find((d) => d.id === day);
  return found ? found.fa : day;
}

// Check for Class Schedule Conflicts
export function findClassConflicts(
  candidateSessions: ClassSession[],
  existingCourses: Course[],
  excludeCourseId?: string
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (const session of candidateSessions) {
    for (const course of existingCourses) {
      if (excludeCourseId && course.id === excludeCourseId) {
        continue;
      }

      for (const existingSession of course.sessions) {
        if (session.day === existingSession.day) {
          if (isTimeRangeOverlapping(session.startTime, session.endTime, existingSession.startTime, existingSession.endTime)) {
            conflicts.push({
              type: 'class',
              existingCourse: course,
              conflictingSession: existingSession,
              incomingSession: session,
              reason: `تداخل کلاسی با درس «${course.name}» در روز ${getDayFaName(session.day)} (ساعت ${session.startTime} تا ${session.endTime} با ساعت ${existingSession.startTime} تا ${existingSession.endTime})`,
            });
          }
        }
      }
    }
  }

  return conflicts;
}

// Check for Final Exam Schedule Conflicts
export function findExamConflicts(
  candidateExam: ExamInfo,
  existingCourses: Course[],
  excludeCourseId?: string
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  if (!candidateExam || !candidateExam.date) {
    return conflicts;
  }

  for (const course of existingCourses) {
    if (excludeCourseId && course.id === excludeCourseId) {
      continue;
    }

    const existingExam = course.exam;
    if (existingExam && existingExam.date) {
      // Clean dates for comparison (normalize format)
      const cleanCandDate = candidateExam.date.trim();
      const cleanExistDate = existingExam.date.trim();

      if (cleanCandDate === cleanExistDate) {
        if (isTimeRangeOverlapping(candidateExam.startTime, candidateExam.endTime, existingExam.startTime, existingExam.endTime)) {
          conflicts.push({
            type: 'exam',
            existingCourse: course,
            reason: `تداخل امتحان پایان ترم با درس «${course.name}» در تاریخ ${candidateExam.date} (ساعت ${candidateExam.startTime} تا ${candidateExam.endTime} با ساعت ${existingExam.startTime} تا ${existingExam.endTime})`,
          });
        }
      }
    }
  }

  return conflicts;
}

export function getCourseTheme(colorId: string) {
  return COLOR_PALETTE.find((c) => c.id === colorId) || COLOR_PALETTE[0];
}

// Get all conflicts (class + exam)
export function validateCourse(
  candidate: { sessions: ClassSession[]; exam: ExamInfo },
  existingCourses: Course[],
  excludeCourseId?: string
): { hasConflict: boolean; conflicts: ScheduleConflict[] } {
  const classConflicts = findClassConflicts(candidate.sessions, existingCourses, excludeCourseId);
  const examConflicts = findExamConflicts(candidate.exam, existingCourses, excludeCourseId);
  const all = [...classConflicts, ...examConflicts];

  return {
    hasConflict: all.length > 0,
    conflicts: all,
  };
}
