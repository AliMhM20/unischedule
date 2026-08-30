import { UniversityId, UniversityInfo, ParsedCatalog, ParserFunction } from './types';
import { parseAutBehestan } from './autParser';
import { parseKntuBehestan } from './kntuParser';

export * from './types';
export * from './helpers';
export { parseAutBehestan } from './autParser';
export { parseKntuBehestan } from './kntuParser';

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
  }
];

const parserRegistry: Record<UniversityId, ParserFunction> = {
  aut: parseAutBehestan,
  kntu: parseKntuBehestan
};

export function detectUniversity(htmlContent: string): UniversityId | null {
  const lower = htmlContent.toLowerCase();

  // Distinctive KNTU (Report 102) indicators
  const isKntu = 
    lower.includes('دانشكده درس') || 
    lower.includes('دانشکده درس') || 
    lower.includes('مخصوص ورودي') || 
    lower.includes('مخصوص ورودی') || 
    lower.includes('خواجه نصیر') || 
    lower.includes('خواجه نصير') || 
    lower.includes('kntu.ac.ir') || 
    lower.includes('kntu');

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

  // If AUT indicators are present (even if a professor name contains "خواجه"), prioritize AUT
  if (isAut && !lower.includes('دانشكده درس') && !lower.includes('دانشکده درس') && !lower.includes('مخصوص ورودي') && !lower.includes('مخصوص ورودی')) {
    return 'aut';
  }

  if (isKntu) {
    return 'kntu';
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

  // If parsed 0 with chosen parser, try fallback
  if (result.courses.length === 0) {
    const fallbackUniv: UniversityId = targetUniv === 'aut' ? 'kntu' : 'aut';
    const fallbackResult = parserRegistry[fallbackUniv](htmlContent);
    if (fallbackResult.courses.length > 0) {
      return fallbackResult;
    }
  }

  return result;
}
