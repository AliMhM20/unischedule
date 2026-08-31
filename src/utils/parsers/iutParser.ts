import { Course, ClassSession, ExamInfo } from '../../types/schedule';
import { ParsedCatalog } from './types';
import { normalizePersianText, mapPersianDayToDayOfWeek, ColorPrefixAssigner } from './helpers';

/**
 * Parses time, place, and exam details from Behestan Report 110 (IUT).
 * Format sample:
 * "درس(ت): يك شنبه 11:00-12:00 مکان: مواد24 درس(ت): سه شنبه 11:00-12:00 مکان: مواد24 امتحان(5_1405.10.23) ساعت : 13:30-16:30"
 */
function parseIutTimePlaceExam(rawText: string): {
  sessions: ClassSession[];
  exam?: ExamInfo;
  location?: string;
} {
  const normalized = normalizePersianText(rawText);
  if (!normalized) return { sessions: [] };

  const sessions: ClassSession[] = [];
  let exam: ExamInfo | undefined = undefined;
  let detectedLocation: string | undefined = undefined;

  // Split tokens by session or exam start markers
  const tokens = normalized.split(/(?=(?:درس\s*\(|امتحان\s*\())/);

  for (let tok of tokens) {
    tok = tok.trim();
    if (!tok) continue;

    if (tok.startsWith('درس')) {
      // Matches: درس(ت): شنبه 08:00-09:30 مکان: خوارزمی or درس(ع): دوشنبه 13:30-16:30
      const m = tok.match(/درس(?:\([تعح]\))?\s*:\s*([^\d:]+?)\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})(?:\s*مکان\s*:\s*(.*))?/);
      if (m) {
        const dayStr = normalizePersianText(m[1]);
        const startTime = m[2].padStart(5, '0');
        const endTime = m[3].padStart(5, '0');
        const loc = m[4] ? normalizePersianText(m[4]) : undefined;
        if (loc && !detectedLocation) detectedLocation = loc;

        const day = mapPersianDayToDayOfWeek(dayStr);
        if (day) {
          sessions.push({
            id: 'sess_' + Math.random().toString(36).substring(2, 9),
            day,
            startTime,
            endTime
          });
        }
      }
    } else if (tok.startsWith('امتحان')) {
      // Matches: امتحان(5_1405.10.23) ساعت : 13:30-16:30 or امتحان(1405.10.23) ساعت : 08:30-11:30
      const m = tok.match(/امتحان\s*\((?:\d+_)?(\d{4})[./-](\d{1,2})[./-](\d{1,2})\)\s*ساعت\s*:\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (m) {
        const year = m[1];
        const month = m[2].padStart(2, '0');
        const day = m[3].padStart(2, '0');
        exam = {
          date: `${year}/${month}/${day}`,
          dateType: 'shamsi',
          startTime: m[4].padStart(5, '0'),
          endTime: m[5].padStart(5, '0')
        };
      }
    }
  }

  return { sessions, exam, location: detectedLocation };
}

/**
 * Parses Isfahan University of Technology (IUT) Behestan Report 110 HTML.
 */
export function parseIutBehestan(htmlContent: string): ParsedCatalog {
  const courses: Course[] = [];
  const colorAssigner = new ColorPrefixAssigner();

  // Try DOMParser first if running in browser
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const rows = Array.from(doc.querySelectorAll('table tr:not(.DTitle)'));

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length < 13) continue;

      const codeGroup = normalizePersianText(cells[0]?.textContent || '');
      const courseName = normalizePersianText(cells[1]?.textContent || '');
      if (!codeGroup || !courseName || codeGroup.includes('شماره')) continue;

      const creditsStr = normalizePersianText(cells[2]?.textContent || '3');
      const credits = parseFloat(creditsStr) || 3;
      const capacityStr = normalizePersianText(cells[4]?.textContent || '');
      const capacity = parseInt(capacityStr, 10) || undefined;

      const genderRaw = normalizePersianText(cells[7]?.textContent || '');
      let gender: 'mixed' | 'men' | 'women' | undefined = undefined;
      if (genderRaw.includes('مختلط')) {
        gender = 'mixed';
      } else if (genderRaw.includes('مرد') || genderRaw.includes('آقا') || genderRaw.includes('پسر')) {
        gender = 'men';
      } else if (genderRaw.includes('زن') || genderRaw.includes('بانو') || genderRaw.includes('دختر')) {
        gender = 'women';
      }

      const instructor = normalizePersianText(cells[8]?.textContent || '');
      const timePlaceExam = cells[11]?.textContent || '';
      const remarks = normalizePersianText(cells[12]?.textContent || '');

      const { sessions, exam, location } = parseIutTimePlaceExam(timePlaceExam);
      const color = colorAssigner.getColor(codeGroup);

      courses.push({
        id: 'iut_' + codeGroup + '_' + Math.random().toString(36).substring(2, 7),
        code: codeGroup,
        name: courseName,
        credits,
        instructor: instructor || undefined,
        capacity,
        gender,
        color,
        location,
        notes: remarks || undefined,
        sessions,
        exam,
        createdAt: Date.now()
      });
    }
  }

  // Regex fallback if DOMParser returned 0 rows or is in Node environment
  if (courses.length === 0) {
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match: RegExpExecArray | null;

    while ((match = trRegex.exec(htmlContent)) !== null) {
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let tdMatch: RegExpExecArray | null;
      while ((tdMatch = tdRegex.exec(match[1])) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]+>/g, ' ').trim());
      }

      if (cells.length < 13) continue;

      const codeGroup = normalizePersianText(cells[0]);
      const courseName = normalizePersianText(cells[1]);
      if (!codeGroup || !courseName || codeGroup.includes('شماره')) continue;

      const creditsStr = normalizePersianText(cells[2] || '3');
      const credits = parseFloat(creditsStr) || 3;
      const capacityStr = normalizePersianText(cells[4] || '');
      const capacity = parseInt(capacityStr, 10) || undefined;

      const genderRaw = normalizePersianText(cells[7] || '');
      let gender: 'mixed' | 'men' | 'women' | undefined = undefined;
      if (genderRaw.includes('مختلط')) {
        gender = 'mixed';
      } else if (genderRaw.includes('مرد') || genderRaw.includes('آقا') || genderRaw.includes('پسر')) {
        gender = 'men';
      } else if (genderRaw.includes('زن') || genderRaw.includes('بانو') || genderRaw.includes('دختر')) {
        gender = 'women';
      }

      const instructor = normalizePersianText(cells[8] || '');
      const timePlaceExam = cells[11] || '';
      const remarks = normalizePersianText(cells[12] || '');

      const { sessions, exam, location } = parseIutTimePlaceExam(timePlaceExam);
      const color = colorAssigner.getColor(codeGroup);

      courses.push({
        id: 'iut_' + codeGroup + '_' + Math.random().toString(36).substring(2, 7),
        code: codeGroup,
        name: courseName,
        credits,
        instructor: instructor || undefined,
        capacity,
        gender,
        color,
        location,
        notes: remarks || undefined,
        sessions,
        exam,
        createdAt: Date.now()
      });
    }
  }

  return {
    courses,
    universityId: 'iut',
    universityName: 'دانشگاه صنعتی اصفهان',
    totalParsed: courses.length
  };
}
