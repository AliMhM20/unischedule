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
  { id: 'blue', bg: 'bg-blue-500', text: 'text-white', lightBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700', hex: '#3b82f6', label: 'آبی اقیانوسی' },
  { id: 'emerald', bg: 'bg-emerald-500', text: 'text-white', lightBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700', hex: '#10b981', label: 'سبز زمردی' },
  { id: 'violet', bg: 'bg-violet-500', text: 'text-white', lightBg: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900 dark:text-violet-300 dark:border-violet-700', hex: '#8b5cf6', label: 'بنفش سلطنتی' },
  { id: 'amber', bg: 'bg-amber-500', text: 'text-white', lightBg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700', hex: '#f59e0b', label: 'کهربایی' },
  { id: 'rose', bg: 'bg-rose-500', text: 'text-white', lightBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900 dark:text-rose-300 dark:border-rose-700', hex: '#f43f5e', label: 'سرخ گلی' },
  { id: 'cyan', bg: 'bg-cyan-500', text: 'text-white', lightBg: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700', hex: '#06b6d4', label: 'فیروزه‌ای' },
  { id: 'indigo', bg: 'bg-indigo-500', text: 'text-white', lightBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700', hex: '#6366f1', label: 'نیلی' },
  { id: 'teal', bg: 'bg-teal-500', text: 'text-white', lightBg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700', hex: '#14b8a6', label: 'یشمی' },
  { id: 'orange', bg: 'bg-orange-500', text: 'text-white', lightBg: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700', hex: '#f97316', label: 'نارنجی پرتقالی' },
  { id: 'pink', bg: 'bg-pink-500', text: 'text-white', lightBg: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900 dark:text-pink-300 dark:border-pink-700', hex: '#ec4899', label: 'صورتی روشن' },
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
  candidate: { sessions: ClassSession[]; exam?: ExamInfo },
  existingCourses: Course[],
  excludeCourseId?: string
): { hasConflict: boolean; conflicts: ScheduleConflict[] } {
  const classConflicts = findClassConflicts(candidate.sessions, existingCourses, excludeCourseId);
  const examConflicts = candidate.exam ? findExamConflicts(candidate.exam, existingCourses, excludeCourseId) : [];
  const all = [...classConflicts, ...examConflicts];

  return {
    hasConflict: all.length > 0,
    conflicts: all,
  };
}

/**
 * Normalizes Persian/Arabic characters, digits, ZWNJ, and whitespace for comparison
 */
export function normalizePersianComparison(str?: string): string {
  if (!str) return '';
  return str
    .trim()
    // Remove ZWNJ, directional marks, and invisible formatting characters
    .replace(/[\u200c\u200b\u200e\u200f\ufeff]/g, '')
    // Persian/Arabic character unifications
    .replace(/[\u064a\u0649]/g, 'ی') // ي, ى -> ی
    .replace(/[\u0643]/g, 'ک')       // ك -> ک
    .replace(/[\u0629]/g, 'ه')       // ة -> ه
    .replace(/[\u0622\u0623\u0625]/g, 'ا') // آ, أ, إ -> ا
    // Persian/Arabic digits to English digits
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584))
    // Replace multiple spaces and punctuation like underscores/dashes with single space
    .replace(/[\s_—\-]+/g, ' ')
    .toLowerCase();
}

/**
 * Normalizes course code (e.g. "2220116_21", "2220116-21", "۲۲۲۰۱۱۶_۲۱")
 */
export function normalizeCourseCode(code?: string): string {
  if (!code) return '';
  return code
    .trim()
    // Persian/Arabic digits to English
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584))
    // Normalize dashes and underscores
    .replace(/[\s\-_]+/g, '_')
    .toLowerCase();
}

/**
 * Generates an order-independent signature of class sessions
 */
export function getSessionsNormalizedSignature(sessions?: ClassSession[]): string {
  if (!sessions || sessions.length === 0) return '';
  return sessions
    .map((s) => {
      const day = (s.day || '').toLowerCase().trim();
      const start = (s.startTime || '').padStart(5, '0');
      const end = (s.endTime || '').padStart(5, '0');
      return `${day}:${start}-${end}`;
    })
    .sort()
    .join('|');
}

/**
 * Checks whether a course from the catalog and an existing plan course are identical
 */
export function isSameCourse(courseA?: Course | null, courseB?: Course | null): boolean {
  if (!courseA || !courseB) return false;

  // 1. Direct ID match
  if (courseA.id && courseB.id && courseA.id === courseB.id) {
    return true;
  }

  // 2. Normalized sessions comparison
  const s1 = getSessionsNormalizedSignature(courseA.sessions);
  const s2 = getSessionsNormalizedSignature(courseB.sessions);

  // Both must match on session times
  if (s1 !== s2) {
    return false;
  }

  // 3. Name comparison
  const name1 = normalizePersianComparison(courseA.name);
  const name2 = normalizePersianComparison(courseB.name);
  if (!name1 || !name2) return false;

  // Check name match with flexibility for "ریاضی" vs "ریاضیات" or exact match
  const cleanName1 = name1.replace(/ات(?:\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanName2 = name2.replace(/ات(?:\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
  const nameMatches = name1 === name2 || cleanName1 === cleanName2;

  if (!nameMatches) {
    return false;
  }

  // 4. Code comparison (if both have non-empty codes)
  const code1 = normalizeCourseCode(courseA.code);
  const code2 = normalizeCourseCode(courseB.code);
  if (code1 && code2) {
    if (code1 !== code2) {
      return false;
    }
  }

  return true;
}

/**
 * Extracts the base course code before group delimiter (e.g. "1022391_01" -> "1022391")
 */
export function getCourseBaseCode(code?: string): string {
  if (!code) return '';
  const normalized = normalizeCourseCode(code);
  return normalized.split('_')[0].trim();
}

/**
 * Checks if another group of the same subject is already present in the active plan
 */
export function checkDuplicateGroupWarning(catalogCourse: Course, planCourses: Course[]): boolean {
  if (!catalogCourse || !planCourses || planCourses.length === 0) return false;

  // If this exact course is already added in plan, it's not a duplicate group warning
  if (planCourses.some((p) => isSameCourse(catalogCourse, p))) {
    return false;
  }

  const catalogBaseCode = getCourseBaseCode(catalogCourse.code);
  const catalogName = normalizePersianComparison(catalogCourse.name);
  const cleanCatalogName = catalogName.replace(/ات(?:\s|$)/g, ' ').replace(/\s+/g, ' ').trim();

  return planCourses.some((planCourse) => {
    const planBaseCode = getCourseBaseCode(planCourse.code);
    const planName = normalizePersianComparison(planCourse.name);
    const cleanPlanName = planName.replace(/ات(?:\s|$)/g, ' ').replace(/\s+/g, ' ').trim();

    const nameMatches = catalogName === planName || cleanCatalogName === cleanPlanName;

    // If both have base codes, both base code and name must match
    if (catalogBaseCode && planBaseCode) {
      return catalogBaseCode === planBaseCode && nameMatches;
    }

    // If one or both lack a code, name matching indicates another group/duplicate subject
    return nameMatches;
  });
}

