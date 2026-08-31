import LZString from 'lz-string';
import { Course, SchedulePlan, DayOfWeek } from '../types/schedule';

export interface SharedPlanPayload {
  version: number;
  name: string;
  courses: Array<{
    code?: string;
    name: string;
    credits: number;
    instructor?: string;
    capacity?: number;
    location?: string;
    faculty?: string;
    color?: string;
    gender?: 'mixed' | 'men' | 'women';
    notes?: string;
    sessions: Array<{
      day: DayOfWeek;
      startTime: string;
      endTime: string;
    }>;
    exam?: {
      date: string;
      dateType: 'shamsi' | 'gregorian';
      startTime: string;
      endTime: string;
    };
  }>;
}

/**
 * Encodes a schedule plan into a compressed URL-safe string.
 */
export function encodeSchedulePlan(plan: SchedulePlan, includeNotes: boolean = true): string {
  const payload: SharedPlanPayload = {
    version: 1,
    name: plan.name || 'برنامه هفتگی',
    courses: (plan.courses || []).map(c => ({
      code: c.code || '',
      name: c.name || '',
      credits: Number(c.credits) || 0,
      instructor: c.instructor || '',
      capacity: c.capacity,
      location: c.location,
      faculty: c.faculty,
      color: c.color,
      gender: c.gender,
      notes: includeNotes ? c.notes : undefined,
      sessions: (c.sessions || []).map(s => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime
      })),
      exam: c.exam ? {
        date: c.exam.date,
        dateType: c.exam.dateType || 'shamsi',
        startTime: c.exam.startTime,
        endTime: c.exam.endTime
      } : undefined
    }))
  };

  const jsonStr = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(jsonStr);
}

/**
 * Decodes a compressed URL-safe string back into a valid SchedulePlan.
 */
export function decodeSchedulePlan(compressedString: string): SchedulePlan | null {
  try {
    if (!compressedString || !compressedString.trim()) return null;
    const jsonStr = LZString.decompressFromEncodedURIComponent(compressedString.trim());
    if (!jsonStr) return null;

    const payload: SharedPlanPayload = JSON.parse(jsonStr);
    if (!payload || !Array.isArray(payload.courses)) return null;

    const now = Date.now();
    const validatedCourses: Course[] = payload.courses.map((c, idx) => ({
      id: `shared_c_${now}_${idx}`,
      code: c.code || '',
      name: c.name || 'درس بدون نام',
      credits: Number(c.credits) || 0,
      instructor: c.instructor || '',
      capacity: c.capacity,
      location: c.location,
      faculty: c.faculty,
      color: c.color || 'blue',
      gender: c.gender,
      notes: c.notes,
      createdAt: now,
      sessions: (c.sessions || []).map((s, sIdx) => ({
        id: `sess_shared_${idx}_${sIdx}`,
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime
      })),
      exam: c.exam ? {
        date: c.exam.date,
        dateType: c.exam.dateType || 'shamsi',
        startTime: c.exam.startTime,
        endTime: c.exam.endTime
      } : undefined
    }));

    return {
      id: `preview_${now}`,
      name: payload.name ? `${payload.name}` : 'برنامه اشتراک‌گذاری شده',
      courses: validatedCourses,
      createdAt: now
    };
  } catch (err) {
    console.error('Failed to decode shared plan payload:', err);
    return null;
  }
}

/**
 * Generates the full share URL for a given plan.
 */
export function getShareUrl(plan: SchedulePlan, includeNotes: boolean = true): string {
  const encoded = encodeSchedulePlan(plan, includeNotes);
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#plan=${encoded}`;
}
