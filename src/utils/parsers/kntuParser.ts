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
    const instructor = normalizePersianText(cells[12]?.textContent || '');

    // Sessions from cells[13] (زمان و مکان ارائه)
    const rawSessionsHtml = cells[13]?.innerHTML || '';
    const sessionLines = rawSessionsHtml
      .split(/<br\s*\/?>/i)
      .map(l => normalizePersianText(l))
      .filter(l => l.length > 0);

    const sessions: ClassSession[] = [];
    for (const line of sessionLines) {
      const timeMatch = line.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (timeMatch) {
        const startTime = timeMatch[1].padStart(5, '0');
        const endTime = timeMatch[2].padStart(5, '0');
        const dayPart = line.substring(0, timeMatch.index);
        const day = mapPersianDayToDayOfWeek(dayPart);
        if (day) {
          sessions.push({
            id: 'sess_' + Math.random().toString(36).substring(2, 9),
            day,
            startTime,
            endTime
          });
        }
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
