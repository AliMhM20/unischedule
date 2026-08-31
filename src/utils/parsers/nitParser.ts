import { Course, ClassSession, ExamInfo } from '../../types/schedule';
import { ParsedCatalog } from './types';
import { normalizePersianText, mapPersianDayToDayOfWeek, ColorPrefixAssigner } from './helpers';

/**
 * Parses Babol Noshirvani University of Technology (NIT) Behestan Report 110 HTML.
 *
 * Table columns:
 * 0: Faculty code | 1: Faculty name | 2: Department code | 3: Department name
 * 4: Code and group | 5: Course name | 6: Total credits | 7: Practical credits
 * 8: Capacity | 9: Registered | 10: Waitlist | 11: Gender
 * 12: Instructor | 13: Time/place/exam composite | 14: Remarks / Notes
 * 15: External enrollment | 16: Emergency drop
 */
export function parseNitBehestan(htmlContent: string): ParsedCatalog {
  const courses: Course[] = [];
  const facultySet = new Set<string>();
  const colorAssigner = new ColorPrefixAssigner();

  // Try DOMParser if in browser environment
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const rows = Array.from(doc.querySelectorAll('table tr:not(.DTitle)'));

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length < 17) continue;

      const faculty = normalizePersianText(cells[1]?.textContent || '');
      if (faculty && faculty !== 'دانشکده درس') {
        facultySet.add(faculty);
      }

      const department = normalizePersianText(cells[3]?.textContent || '');
      const codeGroup = normalizePersianText(cells[4]?.textContent || '');
      const courseName = normalizePersianText(cells[5]?.textContent || '');
      if (!codeGroup || !courseName || codeGroup.includes('شماره')) continue;

      const creditsStr = normalizePersianText(cells[6]?.textContent || '3');
      const credits = parseFloat(creditsStr) || 3;
      const capacityStr = normalizePersianText(cells[8]?.textContent || '');
      const capacity = parseInt(capacityStr, 10) || undefined;

      // Gender from cells[11] (جنسیت: مختلط / زن / مرد)
      const genderRaw = normalizePersianText(cells[11]?.textContent || '');
      let gender: 'mixed' | 'men' | 'women' | undefined = undefined;
      if (genderRaw.includes('مختلط')) {
        gender = 'mixed';
      } else if (genderRaw.includes('مرد') || genderRaw.includes('آقا') || genderRaw.includes('مردانه')) {
        gender = 'men';
      } else if (genderRaw.includes('زن') || genderRaw.includes('بانو') || genderRaw.includes('زنانه')) {
        gender = 'women';
      }

      const instructor = normalizePersianText(cells[12]?.textContent || '');

      // td[13]: ساعات ارائه و امتحان ترکیبی
      const rawHtml = cells[13]?.innerHTML || '';
      const scheduleLines = rawHtml
        .split(/<br\s*\/?>/i)
        .map(l => normalizePersianText(l))
        .filter(l => l.length > 0);

      const sessions: ClassSession[] = [];
      let location: string | undefined = undefined;
      let exam: ExamInfo | undefined = undefined;

      for (const line of scheduleLines) {
        if (line.includes('درس(ت)') || line.includes('درس(ع)') || line.includes('درس(ع و ت)') || line.includes('درس(ح)') || line.includes('درس')) {
          const timeMatch = line.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
          if (timeMatch) {
            const startTime = timeMatch[1].padStart(5, '0');
            const endTime = timeMatch[2].padStart(5, '0');
            const dayPart = line.substring(0, timeMatch.index);
            const day = mapPersianDayToDayOfWeek(dayPart);

            const locMatch = line.match(/مکان\s*:?\s*([^،,;]+)/);
            if (locMatch && !location) {
              location = normalizePersianText(locMatch[1]);
            }

            if (day) {
              sessions.push({
                id: 'sess_' + Math.random().toString(36).substring(2, 9),
                day,
                startTime,
                endTime
              });
            }
          }
        } else if (line.includes('امتحان')) {
          const dateMatch = line.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
          const timeMatch = line.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

          if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2].padStart(2, '0');
            const day = dateMatch[3].padStart(2, '0');
            exam = {
              date: `${year}/${month}/${day}`,
              dateType: 'shamsi',
              startTime: timeMatch ? timeMatch[1].padStart(5, '0') : '09:00',
              endTime: timeMatch ? timeMatch[2].padStart(5, '0') : '12:00'
            };
          }
        }
      }

      // td[14]: توضیحات (Notes / Remarks)
      const remarks = normalizePersianText(cells[14]?.textContent || '');

      courses.push({
        id: 'nit_' + codeGroup + '_' + Math.random().toString(36).substring(2, 7),
        code: codeGroup,
        name: courseName,
        instructor: instructor || undefined,
        credits,
        faculty: faculty || undefined,
        department: department || undefined,
        capacity,
        location,
        gender,
        notes: remarks || undefined,
        color: colorAssigner.getColor(codeGroup),
        sessions,
        exam,
        createdAt: Date.now()
      });
    }
  }

  // Regex fallback if DOMParser produced 0 courses (or in test environment)
  if (courses.length === 0) {
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match: RegExpExecArray | null;

    while ((match = trRegex.exec(htmlContent)) !== null) {
      const rowHtml = match[1];
      if (rowHtml.includes('class="DTitle"')) continue;

      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let tdMatch: RegExpExecArray | null;
      while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
        cells.push(tdMatch[1]);
      }

      if (cells.length < 17) continue;

      const faculty = normalizePersianText(cells[1] || '');
      if (faculty && faculty !== 'دانشکده درس') {
        facultySet.add(faculty);
      }

      const department = normalizePersianText(cells[3] || '');
      const codeGroup = normalizePersianText(cells[4] || '');
      const courseName = normalizePersianText(cells[5] || '');
      if (!codeGroup || !courseName || codeGroup.includes('شماره')) continue;

      const creditsStr = normalizePersianText(cells[6] || '3');
      const credits = parseFloat(creditsStr) || 3;
      const capacityStr = normalizePersianText(cells[8] || '');
      const capacity = parseInt(capacityStr, 10) || undefined;

      const genderRaw = normalizePersianText(cells[11] || '');
      let gender: 'mixed' | 'men' | 'women' | undefined = undefined;
      if (genderRaw.includes('مختلط')) {
        gender = 'mixed';
      } else if (genderRaw.includes('مرد') || genderRaw.includes('آقا') || genderRaw.includes('مردانه')) {
        gender = 'men';
      } else if (genderRaw.includes('زن') || genderRaw.includes('بانو') || genderRaw.includes('زنانه')) {
        gender = 'women';
      }

      const instructor = normalizePersianText(cells[12] || '');

      // td[13]: ساعات ارائه و امتحان ترکیبی
      const rawSchedule = cells[13] || '';
      const scheduleLines = rawSchedule
        .split(/<br\s*\/?>/i)
        .map(l => normalizePersianText(l))
        .filter(l => l.length > 0);

      const sessions: ClassSession[] = [];
      let location: string | undefined = undefined;
      let exam: ExamInfo | undefined = undefined;

      for (const line of scheduleLines) {
        if (line.includes('درس(ت)') || line.includes('درس(ع)') || line.includes('درس(ع و ت)') || line.includes('درس(ح)') || line.includes('درس')) {
          const timeMatch = line.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
          if (timeMatch) {
            const startTime = timeMatch[1].padStart(5, '0');
            const endTime = timeMatch[2].padStart(5, '0');
            const dayPart = line.substring(0, timeMatch.index);
            const day = mapPersianDayToDayOfWeek(dayPart);

            const locMatch = line.match(/مکان\s*:?\s*([^،,;]+)/);
            if (locMatch && !location) {
              location = normalizePersianText(locMatch[1]);
            }

            if (day) {
              sessions.push({
                id: 'sess_' + Math.random().toString(36).substring(2, 9),
                day,
                startTime,
                endTime
              });
            }
          }
        } else if (line.includes('امتحان')) {
          const dateMatch = line.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
          const timeMatch = line.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

          if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2].padStart(2, '0');
            const day = dateMatch[3].padStart(2, '0');
            exam = {
              date: `${year}/${month}/${day}`,
              dateType: 'shamsi',
              startTime: timeMatch ? timeMatch[1].padStart(5, '0') : '09:00',
              endTime: timeMatch ? timeMatch[2].padStart(5, '0') : '12:00'
            };
          }
        }
      }

      // td[14]: توضیحات (Notes / Remarks)
      const remarks = normalizePersianText(cells[14] || '');

      courses.push({
        id: 'nit_' + codeGroup + '_' + Math.random().toString(36).substring(2, 7),
        code: codeGroup,
        name: courseName,
        instructor: instructor || undefined,
        credits,
        faculty: faculty || undefined,
        department: department || undefined,
        capacity,
        location,
        gender,
        notes: remarks || undefined,
        color: colorAssigner.getColor(codeGroup),
        sessions,
        exam,
        createdAt: Date.now()
      });
    }
  }

  return {
    courses,
    universityId: 'nit',
    universityName: 'دانشگاه صنعتی نوشیروانی بابل',
    facultySummary: Array.from(facultySet),
    totalParsed: courses.length
  };
}
