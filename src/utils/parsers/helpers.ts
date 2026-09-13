import { DayOfWeek } from '../../types/schedule';
import { COLOR_PALETTE } from '../timeUtils';

export const normalizePersianText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/<nobr[^>]*>/gi, '')
    .replace(/<\/nobr>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/۰/g, '0').replace(/۱/g, '1').replace(/۲/g, '2').replace(/۳/g, '3').replace(/۴/g, '4')
    .replace(/۵/g, '5').replace(/۶/g, '6').replace(/۷/g, '7').replace(/۸/g, '8').replace(/۹/g, '9')
    .replace(/\s+/g, ' ')
    .trim();
};

export const mapPersianDayToDayOfWeek = (dayName: string): DayOfWeek | null => {
  if (!dayName) return null;
  const normalized = dayName
    .replace(/[\u200B\u200C\u200D\uFEFF\s]/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک');

  if (normalized.includes('یکشنبه')) return 'sunday';
  if (normalized.includes('دوشنبه')) return 'monday';
  if (normalized.includes('سهشنبه')) return 'tuesday';
  if (normalized.includes('چهارشنبه')) return 'wednesday';
  if (normalized.includes('پنجشنبه')) return 'thursday';
  if (normalized.includes('جمعه')) return 'friday';
  if (normalized.includes('شنبه')) return 'saturday';
  return null;
};

export class ColorPrefixAssigner {
  private map = new Map<string, string>();
  private index = 0;

  getColor(codeGroup: string): string {
    const prefix = codeGroup.substring(0, 2);
    if (!this.map.has(prefix)) {
      const colorId = COLOR_PALETTE[this.index % COLOR_PALETTE.length].id;
      this.map.set(prefix, colorId);
      this.index++;
    }
    return this.map.get(prefix)!;
  }
}
