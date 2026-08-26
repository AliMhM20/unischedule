import { Course, ClassSession, ExamInfo } from '../../types/schedule';
import { ParsedCatalog } from './types';
import { normalizePersianText, mapPersianDayToDayOfWeek, ColorPrefixAssigner } from './helpers';

export function parseKntuBehestan(htmlContent: string): ParsedCatalog {
  const courses: Course[] = [];
  const facultySet = new Set<string>();

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const rows = Array.from(doc.querySelectorAll('table tr:not(.DTitle)'));

  const colorAssigner = new ColorPrefixAssigner();

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length < 15) continue;

    const faculty = normalizePersianText(cells[1]?.textContent || '');
    if (faculty) facultySet.add(faculty);

    const department = normalizePersianText(cells[3]?.textContent || '');
    const codeGroup = normalizePersianText(cells[4]?.textContent || '');
    const courseName = normalizePersianText(cells[5]?.textContent || '');
    if (!codeGroup || !courseName || codeGroup.includes('شماره')) continue;

    const creditsStr = normalizePersianText(cells[6]?.textContent || '3');
    const credits = parseFloat(creditsStr) || 3;
    const capacityStr = normalizePersianText(cells[8]?.textContent || '');
    const capacity = parseInt(capacityStr, 10) || undefined;

    // Gender from cells[11] (جنس: مختلط / زنانه / مردانه)
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

    // Sessions from cells[13] (زمان و مکان ارائه)
    // In KNTU, multiple sessions are often in the same cell separated by commas, 'درس(...)', or newlines
    const rawSessionsHtml = cells[13]?.innerHTML || '';
    const cleanSessionText = rawSessionsHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&nbsp;/gi, ' ')
      .replace(/<[^>]*>/g, ' ');
    
    const normalizedSessionsText = normalizePersianText(cleanSessionText);

    // Match all occurrences of (Day) ... (StartTime)-(EndTime) ... optional (Location)
    const sessionRegex = /(شنبه|یک\s*شنبه|دوشنبه|سه\s*شنبه|چهار\s*شنبه|چهارشنبه|پنج\s*شنبه|پنجشنبه|جمعه)\s*[:\s]*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})(?:\s*(?:مکان|مكان|کلاس|كلاس)?\s*:?\s*([^،,;\n\r<]+))?/gi;

    const sessions: ClassSession[] = [];
    let detectedLocation: string | undefined = undefined;

    let sessionMatch: RegExpExecArray | null;
    while ((sessionMatch = sessionRegex.exec(normalizedSessionsText)) !== null) {
      const dayStr = sessionMatch[1];
      const startTime = sessionMatch[2].padStart(5, '0');
      const endTime = sessionMatch[3].padStart(5, '0');
      const loc = sessionMatch[4] ? normalizePersianText(sessionMatch[4]) : undefined;
      
      if (loc && !detectedLocation) {
        detectedLocation = loc;
      }
      
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

    // Exam from cells[14] (زمان و مکان امتحان)
    const rawExamText = normalizePersianText(cells[14]?.textContent || '');
    let exam: ExamInfo | undefined = undefined;

    if (rawExamText.includes('تاریخ') || rawExamText.includes('ساعت') || /\d{4}[./-]/.test(rawExamText)) {
      const dateMatch = rawExamText.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
      const timeMatch = rawExamText.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

      if (dateMatch) {
        const year = dateMatch[1];
        const month = dateMatch[2].padStart(2, '0');
        const day = dateMatch[3].padStart(2, '0');
        exam = {
          date: `${year}/${month}/${day}`,
          dateType: 'shamsi',
          startTime: timeMatch ? timeMatch[1].padStart(5, '0') : '09:00',
          endTime: timeMatch ? timeMatch[2].padStart(5, '0') : '11:00'
        };
      }
    }

    courses.push({
      id: `course_${codeGroup}`,
      code: codeGroup,
      name: courseName,
      instructor,
      credits,
      faculty: faculty || undefined,
      department: department || undefined,
      capacity,
      location: detectedLocation || undefined,
      gender,
      color: colorAssigner.getColor(codeGroup),
      sessions,
      exam,
      createdAt: Date.now()
    });
  }

  return {
    courses,
    universityId: 'kntu',
    universityName: 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
    facultySummary: Array.from(facultySet),
    totalParsed: courses.length
  };
}
