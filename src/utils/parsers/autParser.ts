import { Course, ClassSession, ExamInfo } from '../../types/schedule';
import { ParsedCatalog } from './types';
import { normalizePersianText, mapPersianDayToDayOfWeek, ColorPrefixAssigner } from './helpers';

export function parseAutBehestan(htmlContent: string): ParsedCatalog {
  const courses: Course[] = [];
  let studentName: string | undefined;
  let studentId: string | undefined;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const rows = Array.from(doc.querySelectorAll('table tr:not(.DTitle)'));

  const colorAssigner = new ColorPrefixAssigner();

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length < 11) continue;

    // Student Info
    if (!studentId && cells[0]?.textContent) {
      studentId = normalizePersianText(cells[0].textContent);
    }
    if (!studentName && cells[1]?.textContent) {
      studentName = normalizePersianText(cells[1].textContent);
    }

    const codeGroup = normalizePersianText(cells[3]?.textContent || '');
    const courseName = normalizePersianText(cells[4]?.textContent || '');
    if (!codeGroup || !courseName || codeGroup.includes('شماره')) continue;

    const creditsStr = normalizePersianText(cells[5]?.textContent || '3');
    const credits = parseFloat(creditsStr) || 3;
    const capacityStr = normalizePersianText(cells[7]?.textContent || '');
    const capacity = parseInt(capacityStr, 10) || undefined;

    // Gender from cells[8] (جنسیت: مختلط / زن / مرد)
    const genderRaw = normalizePersianText(cells[8]?.textContent || '');
    let gender: 'mixed' | 'men' | 'women' | undefined = undefined;
    if (genderRaw.includes('مختلط')) {
      gender = 'mixed';
    } else if (genderRaw.includes('مرد') || genderRaw.includes('آقا') || genderRaw.includes('مردانه')) {
      gender = 'men';
    } else if (genderRaw.includes('زن') || genderRaw.includes('بانو') || genderRaw.includes('زنانه')) {
      gender = 'women';
    }

    const instructor = normalizePersianText(cells[9]?.textContent || '');

    // td[10]: ساعات ارائه و امتحان ترکیبی
    const rawHtml = cells[10]?.innerHTML || '';
    const scheduleLines = rawHtml
      .split(/<br\s*\/?>/i)
      .map(l => normalizePersianText(l))
      .filter(l => l.length > 0);

    const sessions: ClassSession[] = [];
    let exam: ExamInfo | undefined = undefined;

    for (const line of scheduleLines) {
      if (line.includes('درس(ت)') || line.includes('درس(ع)') || line.includes('درس(ع و ت)')) {
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
      } else if (line.includes('امتحان')) {
        // e.g. امتحان(1405.10.20) ساعت : 09:00-12:00
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

    courses.push({
      id: `course_${codeGroup}`,
      code: codeGroup,
      name: courseName,
      instructor,
      credits,
      capacity,
      gender,
      color: colorAssigner.getColor(codeGroup),
      sessions,
      exam,
      createdAt: Date.now()
    });
  }

  return {
    courses,
    universityId: 'aut',
    universityName: 'دانشگاه صنعتی امیرکبیر',
    studentName,
    studentId,
    totalParsed: courses.length
  };
}
