import { PassedCourse } from '../../types/schedule';
import { normalizePersianText } from './helpers';

export interface ParsedPassedCoursesResult {
  studentName?: string;
  studentId?: string;
  gpa?: string;
  passedCourses: PassedCourse[];
}

export function parseAutPassedCourses(htmlOrText: string): ParsedPassedCoursesResult {
  const passedCourses: PassedCourse[] = [];
  let studentName: string | undefined;
  let studentId: string | undefined;
  let gpa: string | undefined;

  if (!htmlOrText) {
    return { passedCourses: [] };
  }

  // Extract student ID & Name using regex first
  const idMatch = htmlOrText.match(/شماره\s*دانشجویی\s*[:：]?\s*(\d+)/i);
  if (idMatch) {
    studentId = normalizePersianText(idMatch[1]);
  }

  const gpaMatch = htmlOrText.match(/معدل\s*کل\s*[:：]?\s*([\d.]+)/i);
  if (gpaMatch) {
    gpa = normalizePersianText(gpaMatch[1]);
  }

  // Clean HTML tags to work with uniform text lines, or use DOMParser if HTML
  let textLines: string[] = [];
  if (typeof DOMParser !== 'undefined' && htmlOrText.includes('<')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlOrText, 'text/html');
    
    // Extract text content from body or document
    const rawText = doc.body ? doc.body.innerText || doc.body.textContent || '' : htmlOrText;
    textLines = rawText
      .split('\n')
      .map(l => normalizePersianText(l.trim()))
      .filter(l => l.length > 0);
  } else {
    textLines = htmlOrText
      .split('\n')
      .map(l => normalizePersianText(l.trim()))
      .filter(l => l.length > 0);
  }

  let currentTerm: string | undefined = undefined;

  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i];

    // Detect Term headers e.g. "ترم اول 06-05", "ترم دوم 05-04", "تابستان 04-03"
    if (/^(ترم\s+(اول|دوم|سوم)|تابستان)\s*\d{2}[-/_]\d{2}/.test(line)) {
      currentTerm = line;
      continue;
    }

    // Detect Course Code Line e.g. "3106191 گروه 03" or "3108053 گروه 01"
    const codeGroupMatch = line.match(/^(\d{6,8})\s*گروه\s*(\d{1,2})/);
    if (codeGroupMatch) {
      const code = codeGroupMatch[1];
      const group = codeGroupMatch[2];

      // Course Name is usually the previous line
      let courseName = i > 0 ? textLines[i - 1] : '';
      
      // Ignore if courseName line is a term header or metadata
      if (!courseName || courseName.includes('معدل') || courseName.includes('واحد') || courseName.includes('ثبت نام')) {
        courseName = `درس ${code}`;
      }

      // Look ahead for credits, type, status
      let credits: number | undefined = undefined;
      let courseType: string | undefined = undefined;
      let status: string | undefined = undefined;

      for (let j = i + 1; j < Math.min(i + 8, textLines.length); j++) {
        const nextLine = textLines[j];

        if (!credits && nextLine.includes('واحد کل')) {
          const m = nextLine.match(/واحد\s*کل\s*[:：]?\s*(\d+)/);
          if (m) credits = parseInt(m[1], 10);
        } else if (!courseType && nextLine.includes('نوع درس')) {
          const m = nextLine.match(/نوع\s*درس\s*[:：]?\s*(.+)/);
          if (m) courseType = m[1].trim();
        } else if (!status && nextLine.includes('وضع ثبت نام')) {
          const m = nextLine.match(/وضع\s*ثبت\s*نام\s*[:：]?\s*(.+)/);
          if (m) status = m[1].trim();
        }
      }

      passedCourses.push({
        code,
        group,
        name: courseName,
        credits: credits || 3,
        termName: currentTerm,
        courseType,
        status: status || 'گذرانده',
        passedAt: Date.now()
      });
    }
  }

  return {
    studentName,
    studentId,
    gpa,
    passedCourses
  };
}
