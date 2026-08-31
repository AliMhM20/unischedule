import { Course } from '../../types/schedule';

export type UniversityId = 'aut' | 'kntu' | 'iut' | 'nit';

export interface UniversityInfo {
  id: UniversityId;
  name: string;
  shortName: string;
  portalName: string;
  reportCode: string;
  badgeColor: string;
  description: string;
}

export interface ParsedCatalog {
  courses: Course[];
  universityId: UniversityId;
  universityName: string;
  studentName?: string;
  studentId?: string;
  facultySummary?: string[];
  totalParsed: number;
}

export type ParserFunction = (htmlContent: string) => ParsedCatalog;
