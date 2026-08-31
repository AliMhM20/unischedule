import { UniversityId, UniversityInfo, ParsedCatalog, ParserFunction } from './types';
import { parseAutBehestan } from './autParser';
import { parseKntuBehestan } from './kntuParser';
import { parseIutBehestan } from './iutParser';
import { parseNitBehestan } from './nitParser';

export * from './types';
export * from './helpers';
export { parseAutBehestan } from './autParser';
export { parseKntuBehestan } from './kntuParser';
export { parseIutBehestan } from './iutParser';
export { parseNitBehestan } from './nitParser';

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
  }
];

const parserRegistry: Record<UniversityId, ParserFunction> = {
  aut: parseAutBehestan,
  kntu: parseKntuBehestan,
  iut: parseIutBehestan,
  nit: parseNitBehestan
};

export function detectUniversity(htmlContent: string): UniversityId | null {
  const lower = htmlContent.toLowerCase();

  // Distinctive NIT (Report 110) indicators
  const isNit = 
    lower.includes('امكان اخذ درس توسط ساير مراكز') || 
    lower.includes('امکان اخذ درس توسط سایر مراکز') || 
    lower.includes('حذف اضطراري') || 
    lower.includes('حذف اضطراری') || 
    lower.includes('نوشیروانی') || 
    lower.includes('نوشيرواني') || 
    lower.includes('nit.ac.ir');

  // Distinctive KNTU (Report 102) indicators
  const isKntu = 
    lower.includes('دانشكده درس') || 
    lower.includes('دانشکده درس') || 
    lower.includes('مخصوص ورودي') || 
    lower.includes('مخصوص ورودی') || 
    lower.includes('محدوديت اخذ') || 
    lower.includes('محدودیت اخذ') || 
    lower.includes('خواجه نصیر') || 
    lower.includes('خواجه نصير') || 
    lower.includes('kntu.ac.ir') || 
    lower.includes('گزارش ۱۰۲') || 
    lower.includes('گزارش 102');

  // Distinctive IUT (Report 110) indicators
  const isIut = 
    lower.includes('وضعيت استخدامي اساتيد') || 
    lower.includes('وضعیت استخدامی اساتید') || 
    lower.includes('نوع مسئوليت استاد') || 
    lower.includes('نوع مسئولیت استاد') || 
    lower.includes('زمان و مكان ارائه/ امتحان') || 
    lower.includes('زمان و مکان ارائه/ امتحان') || 
    lower.includes('صنعتی اصفهان') || 
    lower.includes('صنعتي اصفهان') || 
    lower.includes('iut.ac.ir') || 
    lower.includes('گزارش ۱۱۰') || 
    lower.includes('گزارش 110');

  // Distinctive AUT (Report 212) indicators
  const isAut = 
    lower.includes('شماره دانشجو') || 
    lower.includes('پيش نياز، همنياز') || 
    lower.includes('پیش نیاز، همنیاز') || 
    lower.includes('اميركبير') || 
    lower.includes('امیرکبیر') || 
    lower.includes('aut.ac.ir') ||
    lower.includes('گزارش ۲۱۲') ||
    lower.includes('گزارش 212');

  if (isNit) {
    return 'nit';
  }

  if (isKntu) {
    return 'kntu';
  }

  if (isIut) {
    return 'iut';
  }

  if (isAut) {
    return 'aut';
  }

  return null;
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

  // If parsed 0 with chosen parser, try fallback across others
  if (result.courses.length === 0) {
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
