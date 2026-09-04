import { PassedCourse } from '../types/schedule';

const PASSED_COURSES_KEY = 'unischedule_passed_courses_v1';

export function getPassedCourses(): PassedCourse[] {
  try {
    const data = localStorage.getItem(PASSED_COURSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Failed to read passed courses from localStorage', e);
    return [];
  }
}

export function savePassedCourses(courses: PassedCourse[]): void {
  try {
    localStorage.setItem(PASSED_COURSES_KEY, JSON.stringify(courses));
  } catch (e) {
    console.warn('Failed to save passed courses to localStorage', e);
  }
}

export function appendPassedCourses(newCourses: PassedCourse[]): PassedCourse[] {
  const existing = getPassedCourses();
  const courseMap = new Map<string, PassedCourse>();

  // Helper to extract base code (e.g. "3108053" from "3108053_01" or "3108053")
  const getBaseCode = (code: string) => (code || '').trim().split(/[_-\s]/)[0];

  for (const c of existing) {
    const key = getBaseCode(c.code) || c.name.trim();
    if (key) courseMap.set(key, c);
  }

  for (const c of newCourses) {
    const key = getBaseCode(c.code) || c.name.trim();
    if (key) {
      // Overwrite or append with fresh info
      courseMap.set(key, c);
    }
  }

  const merged = Array.from(courseMap.values());
  savePassedCourses(merged);
  return merged;
}

export function clearPassedCourses(): void {
  try {
    localStorage.removeItem(PASSED_COURSES_KEY);
  } catch (e) {
    console.warn('Failed to clear passed courses', e);
  }
}

export function isCoursePassed(passedCourses: PassedCourse[], courseCode?: string, courseName?: string): boolean {
  if (!passedCourses || passedCourses.length === 0) return false;

  const baseCode = (courseCode || '').trim().split(/[_-\s]/)[0];
  const cleanName = (courseName || '').trim().toLowerCase();

  return passedCourses.some(p => {
    const pBaseCode = (p.code || '').trim().split(/[_-\s]/)[0];
    const pCleanName = (p.name || '').trim().toLowerCase();

    if (baseCode && pBaseCode && baseCode === pBaseCode) {
      return true;
    }

    if (cleanName && pCleanName && (cleanName === pCleanName || cleanName.includes(pCleanName) || pCleanName.includes(cleanName))) {
      return true;
    }

    return false;
  });
}
