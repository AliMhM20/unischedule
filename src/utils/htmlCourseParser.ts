import { ClassSession, Course, DayOfWeek, ExamInfo } from '../types/schedule';
import { COLOR_PALETTE } from './timeUtils';

// Helper to normalize text (Persian/Arabic chars, digits)
const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/۰/g, '0')
    .replace(/۱/g, '1')
    .replace(/۲/g, '2')
    .replace(/۳/g, '3')
    .replace(/۴/g, '4')
    .replace(/۵/g, '5')
    .replace(/۶/g, '6')
    .replace(/۷/g, '7')
    .replace(/۸/g, '8')
    .replace(/۹/g, '9')
    .trim();
};

const mapPersianDayToDayOfWeek = (dayName: string): DayOfWeek | null => {
  const normalized = dayName.replace(/\s/g, ''); // Remove spaces
  if (normalized.includes('شنبه') && !normalized.includes('یک') && !normalized.includes('دو') && !normalized.includes('سه') && !normalized.includes('چهار') && !normalized.includes('پنج')) return 'saturday';
  if (normalized.includes('یکشنبه')) return 'sunday';
  if (normalized.includes('دوشنبه')) return 'monday';
  if (normalized.includes('سهشنبه')) return 'tuesday';
  if (normalized.includes('چهارشنبه')) return 'wednesday';
  if (normalized.includes('پنجشنبه')) return 'thursday';
  if (normalized.includes('جمعه')) return 'friday';
  return null;
};

interface ParsedCatalog {
  courses: Course[];
  studentName?: string;
  studentId?: string;
}

export function parseBehestanHtml(htmlContent: string): ParsedCatalog {
  const courses: Course[] = [];
  let studentName: string | undefined;
  let studentId: string | undefined;

  // Create a DOM element to parse the HTML string safely
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const rows = Array.from(doc.querySelectorAll('table tr:not(.DTitle)'));

  // Dictionary to store prefix -> color ID mapping
  const prefixColorMap = new Map<string, string>();
  let nextColorIndex = 0;

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length < 11) continue;

    // Extract student info from first valid row
    if (!studentId && cells[0]?.textContent) {
      studentId = normalizeText(cells[0].textContent);
    }
    if (!studentName && cells[1]?.textContent) {
      studentName = normalizeText(cells[1].textContent);
    }

    const codeGroup = normalizeText(cells[3]?.textContent || '');
    const courseName = normalizeText(cells[4]?.textContent || '');
    const creditsStr = normalizeText(cells[5]?.textContent || '3');
    const credits = parseFloat(creditsStr) || 3;
    const instructor = normalizeText(cells[9]?.textContent || '');
    
    // td[10]: ساعات ارائه و امتحان
    // Using innerHTML to split by <br> because it contains multiple lines
    const scheduleLines = (cells[10]?.innerHTML || '').split(/<br\s*\/?>/i).map(l => {
      // Create a temporary element to extract just text, removing any tags
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = l;
      return normalizeText(tempDiv.textContent || '');
    }).filter(l => l.trim().length > 0);

    const sessions: ClassSession[] = [];
    let exam: ExamInfo | undefined = undefined;

    for (const line of scheduleLines) {
      if (line.includes('درس(ت)') || line.includes('درس(ع)')) {
        // e.g. "درس(ت): یک شنبه 09:15-10:45"
        const parts = line.split(':');
        if (parts.length >= 2) {
          const content = parts.slice(1).join(':').trim(); // "یک شنبه 09:15-10:45"
          const spaceIdx = content.lastIndexOf(' '); // last space separates day from time
          if (spaceIdx > -1) {
            const dayStr = content.substring(0, spaceIdx).trim(); // "یک شنبه"
            const timeStr = content.substring(spaceIdx + 1).trim(); // "09:15-10:45"
            const day = mapPersianDayToDayOfWeek(dayStr);
            if (day && timeStr.includes('-')) {
              const [start, end] = timeStr.split('-');
              sessions.push({
                id: crypto.randomUUID(),
                day,
                startTime: start,
                endTime: end
              });
            }
          }
        }
      } else if (line.includes('امتحان')) {
        // e.g. "امتحان(1405.10.20) ساعت : 09:00-12:00"
        const dateMatch = line.match(/\((.*?)\)/);
        const date = dateMatch ? dateMatch[1].replace(/\./g, '/') : undefined;
        
        let timeStr = '';
        if (line.includes('ساعت')) {
            const timeParts = line.split('ساعت');
            if(timeParts.length > 1) {
               timeStr = timeParts[1].replace(':', '').trim(); // "09:00-12:00"
            }
        } else {
             // Try to extract time directly if "ساعت" is missing
             const potentialTimeMatch = line.match(/\d{2}:\d{2}-\d{2}:\d{2}/);
             if (potentialTimeMatch) {
                 timeStr = potentialTimeMatch[0];
             }
        }

        if (date && timeStr.includes('-')) {
          const [start, end] = timeStr.split('-');
          exam = {
            date,
            dateType: 'shamsi',
            startTime: start.trim(),
            endTime: end.trim()
          };
        }
      }
    }

    if (codeGroup && courseName) {
      // Color assignment logic
      const codePrefix = codeGroup.substring(0, 2);
      let colorId = prefixColorMap.get(codePrefix);
      if (!colorId) {
        colorId = COLOR_PALETTE[nextColorIndex % COLOR_PALETTE.length].id;
        prefixColorMap.set(codePrefix, colorId);
        nextColorIndex++;
      }

      courses.push({
        id: `catalog_${codeGroup}`,
        code: codeGroup,
        name: courseName,
        instructor,
        credits,
        color: colorId,
        sessions,
        exam,
        createdAt: Date.now()
      });
    }
  }

  return { courses, studentName, studentId };
}
