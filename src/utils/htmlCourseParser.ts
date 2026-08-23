import { Course } from '../types/schedule';
import { parseUniversityHtml, ParsedCatalog, UniversityId, SUPPORTED_UNIVERSITIES } from './parsers';

export { SUPPORTED_UNIVERSITIES } from './parsers';
export type { UniversityId, ParsedCatalog } from './parsers';

export function parseBehestanHtml(htmlContent: string, universityId?: UniversityId): ParsedCatalog {
  return parseUniversityHtml(htmlContent, universityId);
}
