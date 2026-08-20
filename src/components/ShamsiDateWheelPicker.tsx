import React, { useRef, useEffect } from 'react';
import { toPersianDigits } from '../utils/timeUtils';

export const SHAMSI_MONTHS = [
  { num: '01', name: 'فروردین' },
  { num: '02', name: 'اردیبهشت' },
  { num: '03', name: 'خرداد' },
  { num: '04', name: 'تیر' },
  { num: '05', name: 'مرداد' },
  { num: '06', name: 'شهریور' },
  { num: '07', name: 'مهر' },
  { num: '08', name: 'آبان' },
  { num: '09', name: 'آذر' },
  { num: '10', name: 'دی' },
  { num: '11', name: 'بهمن' },
  { num: '12', name: 'اسفند' },
];

const YEARS = ['1405', '1406', '1407', '1408', '1409', '1410'];

interface ShamsiDateWheelPickerProps {
  year: string;
  month: string;
  day: string;
  onChange: (year: string, month: string, day: string) => void;
}

interface WheelColumnProps<T> {
  label: string;
  items: T[];
  selectedItem: T;
  getItemKey: (item: T) => string;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  onSelect: (item: T) => void;
}

function WheelColumn<T>({
  label,
  items,
  selectedItem,
  getItemKey,
  renderItem,
  onSelect,
}: WheelColumnProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemHeight = 40; // 40px per item

  useEffect(() => {
    if (listRef.current) {
      const selectedIndex = items.findIndex((i) => getItemKey(i) === getItemKey(selectedItem));
      if (selectedIndex !== -1) {
        listRef.current.scrollTop = selectedIndex * itemHeight;
      }
    }
  }, [selectedItem, items, getItemKey]);

  return (
    <div className="flex-1 flex flex-col items-center">
      <span className="text-xs font-bold text-slate-500 mb-2">{label}</span>
      <div className="relative w-full h-[160px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden select-none">
        
        {/* Selection Center Highlight Bar */}
        <div className="absolute top-[60px] left-1 right-1 h-[40px] bg-indigo-600/10 border-y border-indigo-500/30 rounded-lg pointer-events-none z-0" />

        {/* Top/Bottom Fade Gradients */}
        <div className="absolute top-0 left-0 right-0 h-[60px] bg-gradient-to-b from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10" />

        {/* Scrollable list */}
        <div
          ref={listRef}
          className="h-full overflow-y-auto snap-y snap-mandatory py-[60px] scrollbar-none no-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          {items.map((item) => {
            const isSelected = getItemKey(item) === getItemKey(selectedItem);
            return (
              <div
                key={getItemKey(item)}
                onClick={() => onSelect(item)}
                className={`h-[40px] flex items-center justify-center snap-center cursor-pointer transition-all duration-150 text-xs font-bold ${
                  isSelected
                    ? 'text-indigo-700 font-extrabold text-sm scale-105'
                    : 'text-slate-400 hover:text-slate-700 opacity-60 hover:opacity-100'
                }`}
              >
                {renderItem(item, isSelected)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const ShamsiDateWheelPicker: React.FC<ShamsiDateWheelPickerProps> = ({
  year,
  month,
  day,
  onChange,
}) => {
  // Compute days in the selected Shamsi month (1-6: 31 days, 7-11: 30 days, 12: 29 days)
  const monthNum = parseInt(month, 10);
  const totalDays = monthNum <= 6 ? 31 : monthNum <= 11 ? 30 : 29;

  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = (i + 1).toString().padStart(2, '0');
    return d;
  });

  const currentYear = YEARS.includes(year) ? year : YEARS[0];
  const currentMonth = SHAMSI_MONTHS.find((m) => m.num === month) || SHAMSI_MONTHS[9]; // default 'دی' (10)
  const safeDay = parseInt(day, 10) > totalDays ? totalDays.toString().padStart(2, '0') : day.padStart(2, '0');

  const handleYearChange = (newYear: string) => {
    onChange(newYear, month, safeDay);
  };

  const handleMonthChange = (newMonth: { num: string; name: string }) => {
    const newMonthNum = parseInt(newMonth.num, 10);
    const newTotalDays = newMonthNum <= 6 ? 31 : newMonthNum <= 11 ? 30 : 29;
    const adjustedDay = parseInt(safeDay, 10) > newTotalDays ? newTotalDays.toString().padStart(2, '0') : safeDay;
    onChange(currentYear, newMonth.num, adjustedDay);
  };

  const handleDayChange = (newDay: string) => {
    onChange(currentYear, month, newDay);
  };

  return (
    <div className="space-y-3">
      {/* 3-Column Wheel Picker: Day | Month | Year (in RTL: Day on Right, Month in Middle, Year on Left) */}
      <div className="flex items-center gap-3">
        {/* Day Column */}
        <WheelColumn<string>
          label="روز"
          items={days}
          selectedItem={safeDay}
          getItemKey={(d) => d}
          renderItem={(d) => toPersianDigits(d)}
          onSelect={handleDayChange}
        />

        {/* Month Column */}
        <WheelColumn<{ num: string; name: string }>
          label="ماه"
          items={SHAMSI_MONTHS}
          selectedItem={currentMonth}
          getItemKey={(m) => m.num}
          renderItem={(m) => `${m.name} (${toPersianDigits(m.num)})`}
          onSelect={handleMonthChange}
        />

        {/* Year Column */}
        <WheelColumn<string>
          label="سال"
          items={YEARS}
          selectedItem={currentYear}
          getItemKey={(y) => y}
          renderItem={(y) => toPersianDigits(y)}
          onSelect={handleYearChange}
        />
      </div>

      {/* Selected Date Summary Tag */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/90 rounded-xl text-xs">
        <span className="text-slate-500 font-medium">تاریخ انتخابی نهایی:</span>
        <span className="font-mono font-bold text-slate-800 text-sm">
          {toPersianDigits(`${currentYear}/${currentMonth.num}/${safeDay}`)} ({currentMonth.name} {toPersianDigits(currentYear)})
        </span>
      </div>
    </div>
  );
};
