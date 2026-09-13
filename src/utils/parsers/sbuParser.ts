import { Course, ClassSession, ExamInfo } from '../../types/schedule';
import { ParsedCatalog } from './types';
import { normalizePersianText, mapPersianDayToDayOfWeek, ColorPrefixAssigner } from './helpers';

/**
 * Dual Parser for Shahid Beheshti University (SBU) Behestan Portal.
 * Supports both Report 102 (detailed table with separate session/exam columns)
 * and Report 212 (standard table with combined session/exam column).
 */
export function parseSbuBehestan(htmlContent: string): ParsedCatalog {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const textContent = doc.body?.textContent || '';
  const isReport212 = 
    textContent.includes('ساعات ارائه و امتحان') || 
    (!textContent.includes('زمان و مكان ارائه') && textContent.includes('شماره دانشجو'));

  if (isReport212) {
    return parseSbuReport212(doc);
  } else {
    return parseSbuReport102(doc);
  }
}

/**
 * Parses SBU Report 102 (Standard Behestan Report 102)
 * Features separate columns for session hours and exam datetime, plus faculty and department.
 */
function parseSbuReport102(doc: Document): ParsedCatalog {
  const courses: Course[] = [];
  const facultySet = new Set<string>();
  const colorAssigner = new ColorPrefixAssigner();

  const rows = Array.from(doc.querySelectorAll('table tr:not(.DTitle)'));

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
    const rawSessionsHtml = cells[13]?.innerHTML || '';
    const cleanSessionText = rawSessionsHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&nbsp;/gi, ' ')
      .replace(/<[^>]*>/g, ' ');
    
    const normalizedSessionsText = normalizePersianText(cleanSessionText);

    // Match all occurrences of (Day) ... (StartTime)-(EndTime) ... optional (Location)
    const sessionRegex = /(شنبه|یک[\s\u200c]*شنبه|دوشنبه|سه[\s\u200c]*شنبه|چهار[\s\u200c]*شنبه|پنج[\s\u200c]*شنبه|جمعه)\s*[:\s]*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})(?:\s*(?:مکان|مكان|کلاس|كلاس)?\s*:?\s*([^،,;\n\r<]+))?/gi;

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

    // Remarks/Notes from the last cell (توضیحات)
    const remarks = cells.length >= 20 ? normalizePersianText(cells[cells.length - 1]?.textContent || '') : undefined;

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
      notes: remarks || undefined,
      sessions,
      exam,
      createdAt: Date.now()
    });
  }

  return {
    courses,
    universityId: 'sbu',
    universityName: 'دانشگاه شهید بهشتی',
    facultySummary: Array.from(facultySet),
    totalParsed: courses.length
  };
}

/**
 * Parses SBU Report 212 (Report 212 with combined session/exam schedule)
 */
function parseSbuReport212(doc: Document): ParsedCatalog {
  const courses: Course[] = [];
  let studentName: string | undefined;
  let studentId: string | undefined;
  const colorAssigner = new ColorPrefixAssigner();

  const rows = Array.from(doc.querySelectorAll('table tr:not(.DTitle)'));

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
            endTime: timeMatch ? timeMatch[2].padStart(5, '0') : '11:00'
          };
        }
      }
    }

    const location = cells[11]?.textContent ? normalizePersianText(cells[11].textContent) : undefined;
    // Remarks/Notes from the last cell (توضیحات)
    const remarks = cells.length > 11 ? normalizePersianText(cells[cells.length - 1]?.textContent || '') : undefined;

    courses.push({
      id: `course_${codeGroup}`,
      code: codeGroup,
      name: courseName,
      instructor,
      credits,
      capacity,
      location: location || undefined,
      gender,
      color: colorAssigner.getColor(codeGroup),
      notes: remarks || undefined,
      sessions,
      exam,
      createdAt: Date.now()
    });
  }

  return {
    courses,
    universityId: 'sbu',
    universityName: 'دانشگاه شهید بهشتی',
    studentName,
    studentId,
    totalParsed: courses.length
  };
}
