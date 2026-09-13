import { UniversityId, UniversityInfo, ParsedCatalog, ParserFunction } from './types';
import { parseAutBehestan } from './autParser';
import { parseKntuBehestan } from './kntuParser';
import { parseIutBehestan } from './iutParser';
import { parseNitBehestan } from './nitParser';
import { parseSbuBehestan } from './sbuParser';

export * from './types';
export * from './helpers';
export { parseAutBehestan } from './autParser';
export { parseKntuBehestan } from './kntuParser';
export { parseIutBehestan } from './iutParser';
export { parseNitBehestan } from './nitParser';
export { parseSbuBehestan } from './sbuParser';

export const SUPPORTED_UNIVERSITIES: UniversityInfo[] = [
  {
    id: 'aut',
    name: 'دانشگاه صنعتی امیرکبیر',
    shortName: 'امیرکبیر',
    portalName: 'بهستان (گزارش ۲۱۲)',
    reportCode: '212',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    description: 'استخراج هوشمند دروس از سامانه بهستان دانشگاه امیرکبیر (گزارش ۲۱۲)'
  },
  {
    id: 'kntu',
    name: 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
    shortName: 'خواجه‌نصیر',
    portalName: 'بهستان (گزارش ۱۰۲)',
    reportCode: '102',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    description: 'استخراج هوشمند دروس همراه با دانشکده از سامانه بهستان دانشگاه خواجه‌نصیر (گزارش ۱۰۲)'
  },
  {
    id: 'iut',
    name: 'دانشگاه صنعتی اصفهان',
    shortName: 'صنعتی اصفهان',
    portalName: 'بهستان (گزارش ۱۱۰)',
    reportCode: '110',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    description: 'استخراج هوشمند دروس از سامانه بهستان دانشگاه صنعتی اصفهان (گزارش ۱۱۰)'
  },
  {
    id: 'nit',
    name: 'دانشگاه صنعتی نوشیروانی بابل',
    shortName: 'نوشیروانی بابل',
    portalName: 'بهستان (گزارش ۱۱۰)',
    reportCode: '110',
    badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    description: 'استخراج هوشمند دروس همراه با دانشکده از سامانه بهستان دانشگاه صنعتی نوشیروانی بابل (گزارش ۱۱۰)'
  },
  {
    id: 'sbu',
    name: 'دانشگاه شهید بهشتی',
    shortName: 'شهید بهشتی',
    portalName: 'بهستان (گزارش ۱۰۲ یا ۲۱۲)',
    reportCode: '102 / 212',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    description: 'استخراج هوشمند دروس از سامانه بهستان دانشگاه شهید بهشتی (گزارش ۱۰۲ و ۲۱۲)'
  }
];

const parserRegistry: Record<UniversityId, ParserFunction> = {
  aut: parseAutBehestan,
  kntu: parseKntuBehestan,
  iut: parseIutBehestan,
  nit: parseNitBehestan,
  sbu: parseSbuBehestan
};

/**
 * Normalizes text for robust Persian/Arabic string matching.
 * Handles characters like ي/ی, ك/ک, zero-width characters, and excess whitespace.
 */
export function normalizeHtmlForDetection(text: string): string {
  return text
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Validates whether the given HTML table matches the expected schema of targetUniv.
 */
export function validateUniversitySchema(htmlContent: string, targetUniv: UniversityId): boolean {
  if (!htmlContent || typeof htmlContent !== 'string') return false;
  const norm = normalizeHtmlForDetection(htmlContent);

  // General Behestan table requirement: must include course code and group column
  const hasCourseNumber = norm.includes('شماره و گروه درس') || norm.includes('شماره وگروه درس');
  if (!hasCourseNumber) {
    return false;
  }

  switch (targetUniv) {
    case 'aut': {
      // AUT (Amirkabir - Report 212):
      // Distinctive columns: ساعات ارائه و امتحان, دروس پیش نیاز، همنیاز, شماره دانشجو
      const hasAutDistinctive = 
        norm.includes('ساعات ارائه و امتحان') || 
        norm.includes('پیش نیاز، همنیاز') || 
        norm.includes('شماره دانشجو');
      
      const hasExclusiveOthers = 
        norm.includes('امکان اخذ درس توسط سایر مراکز') || 
        norm.includes('حذف اضطراری') || 
        norm.includes('وضعیت استخدامی اساتید') || 
        norm.includes('نوع مسئولیت استاد') || 
        norm.includes('گروه آموزشی درس') || 
        norm.includes('مخصوص ورودی') || 
        norm.includes('محدودیت اخذ') || 
        norm.includes('زمان و مکان امتحان');

      return hasAutDistinctive && !hasExclusiveOthers;
    }

    case 'kntu': {
      // KNTU (Khajeh Nasir - Report 102):
      // Distinctive columns: گروه آموزشی درس, زمان و مکان امتحان, محدودیت اخذ, مخصوص ورودی, نحوه ارائه درس, دوره درس
      const hasKntuDistinctive = 
        norm.includes('گروه آموزشی درس') || 
        norm.includes('زمان و مکان امتحان') || 
        norm.includes('مخصوص ورودی') || 
        norm.includes('محدودیت اخذ') || 
        norm.includes('نحوه ارائه درس') || 
        norm.includes('دوره درس');

      const hasExclusiveOthers = 
        norm.includes('امکان اخذ درس توسط سایر مراکز') || 
        norm.includes('حذف اضطراری') || 
        norm.includes('وضعیت استخدامی اساتید') || 
        norm.includes('نوع مسئولیت استاد') || 
        norm.includes('ساعات ارائه و امتحان');

      return hasKntuDistinctive && !hasExclusiveOthers;
    }

    case 'nit': {
      // NIT (Noshirvani Babol - Report 110):
      // Distinctive columns: امکان اخذ درس توسط سایر مراکز, حذف اضطراری
      const hasNitDistinctive = 
        norm.includes('امکان اخذ درس توسط سایر مراکز') || 
        norm.includes('حذف اضطراری');

      const hasExclusiveOthers = 
        norm.includes('وضعیت استخدامی اساتید') || 
        norm.includes('نوع مسئولیت استاد') || 
        norm.includes('گروه آموزشی درس') || 
        norm.includes('مخصوص ورودی') || 
        norm.includes('محدودیت اخذ') || 
        norm.includes('ساعات ارائه و امتحان');

      return hasNitDistinctive && !hasExclusiveOthers;
    }

    case 'iut': {
      // IUT (Isfahan Tech - Report 110):
      // Distinctive columns: وضعیت استخدامی اساتید, نوع مسئولیت استاد
      const hasIutDistinctive = 
        norm.includes('وضعیت استخدامی اساتید') || 
        norm.includes('نوع مسئولیت استاد');

      const hasExclusiveOthers = 
        norm.includes('امکان اخذ درس توسط سایر مراکز') || 
        norm.includes('حذف اضطراری') || 
        norm.includes('گروه آموزشی درس') || 
        norm.includes('دانشکده درس') || 
        norm.includes('ساعات ارائه و امتحان');

      return hasIutDistinctive && !hasExclusiveOthers;
    }

    case 'sbu': {
      // SBU (Shahid Beheshti - Dual Report 102 & 212):
      // Matches either Report 102 schema (separate session/exam) or Report 212 schema (combined session/exam).
      const hasReport102 = 
        norm.includes('گروه آموزشی درس') || 
        norm.includes('زمان و مکان امتحان') || 
        norm.includes('زمان و مکان ارائه') ||
        norm.includes('مخصوص ورودی') || 
        norm.includes('محدودیت اخذ') || 
        norm.includes('نحوه ارائه درس') || 
        norm.includes('دوره درس');

      const hasReport212 = 
        norm.includes('ساعات ارائه و امتحان') || 
        norm.includes('پیش نیاز، همنیاز') || 
        norm.includes('شماره دانشجو');

      const hasExclusiveOthers = 
        norm.includes('امکان اخذ درس توسط سایر مراکز') || 
        norm.includes('حذف اضطراری') || 
        norm.includes('وضعیت استخدامی اساتید') || 
        norm.includes('نوع مسئولیت استاد');

      return (hasReport102 || hasReport212) && !hasExclusiveOthers;
    }

    default:
      return false;
  }
}

/**
 * Detects all universities that match the given HTML schema.
 * For Report 102, returns [KNTU, SBU].
 * For Report 212, returns [AUT, SBU].
 * For Report 110 (NIT), returns [NIT].
 * For Report 110 (IUT), returns [IUT].
 */
export function detectCandidateUniversities(htmlContent: string): UniversityInfo[] {
  if (!htmlContent || typeof htmlContent !== 'string') return [];

  return SUPPORTED_UNIVERSITIES.filter(univ => validateUniversitySchema(htmlContent, univ.id));
}

export function detectUniversity(htmlContent: string): UniversityId | null {
  if (!htmlContent || typeof htmlContent !== 'string') return null;

  const candidates = detectCandidateUniversities(htmlContent);
  return candidates.length > 0 ? candidates[0].id : null;
}

export function parseUniversityHtml(htmlContent: string, selectedUniversity?: UniversityId): ParsedCatalog {
  let targetUniv: UniversityId;

  if (selectedUniversity && parserRegistry[selectedUniversity]) {
    targetUniv = selectedUniversity;
  } else {
    targetUniv = detectUniversity(htmlContent) || 'aut';
  }

  const parser = parserRegistry[targetUniv] || parseAutBehestan;
  const result = parser(htmlContent);

  // If parsed 0 with chosen parser and no explicit university was provided, try fallback across others
  if (result.courses.length === 0 && !selectedUniversity) {
    const fallbackUnivs: UniversityId[] = (Object.keys(parserRegistry) as UniversityId[]).filter(id => id !== targetUniv);
    for (const fb of fallbackUnivs) {
      const fallbackResult = parserRegistry[fb](htmlContent);
      if (fallbackResult.courses.length > 0) {
        return fallbackResult;
      }
    }
  }

  return result;
}
