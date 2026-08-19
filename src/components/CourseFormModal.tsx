import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Plus, Trash2, Calendar, Clock, AlertTriangle, CheckCircle2, 
  User, BookOpen, Hash 
} from 'lucide-react';
import { Course, ClassSession, DayOfWeek, ExamInfo } from '../types/schedule';
import { 
  DAYS_CONFIG, COLOR_PALETTE, validateCourse, toPersianDigits 
} from '../utils/timeUtils';
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  initialCourse?: Course | null;
  existingCourses: Course[];
  prefilledSlot?: { day: DayOfWeek; startTime: string; endTime: string } | null;
}

// Helper to generate time slots with 15-minute intervals
const generateTimeSlots = (startH: number, startM: number, endH: number, endM: number): string[] => {
  const slots: string[] = [];
  let currentMin = startH * 60 + startM;
  const targetEndMin = endH * 60 + endM;
  while (currentMin <= targetEndMin) {
    const h = Math.floor(currentMin / 60);
    const m = currentMin % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    currentMin += 15;
  }
  return slots;
};

const CLASS_START_HOURS = generateTimeSlots(7, 0, 18, 45);
const CLASS_END_HOURS = generateTimeSlots(7, 15, 19, 0);
const EXAM_START_HOURS = generateTimeSlots(7, 0, 18, 0);
const EXAM_END_HOURS = generateTimeSlots(7, 30, 20, 0);

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCourse,
  existingCourses,
  prefilledSlot,
}) => {
  const isEditing = !!initialCourse;

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [color, setColor] = useState('blue');
  const [notes, setNotes] = useState('');

  // Class sessions
  const [sessions, setSessions] = useState<ClassSession[]>([
    {
      id: 'session-1',
      day: 'saturday',
      startTime: '08:00',
      endTime: '10:00',
    },
  ]);

  // Exam info
  const [examYear, setExamYear] = useState('1405');
  const [examMonth, setExamMonth] = useState('10');
  const [examDay, setExamDay] = useState('15');
  const [examStartTime, setExamStartTime] = useState('08:30');
  const [examEndTime, setExamEndTime] = useState('10:30');
  const [examNotes, setExamNotes] = useState('');
  const [hasExam, setHasExam] = useState(true);

  // Active sub-tab in modal
  const [activeTab, setActiveTab] = useState<'details' | 'sessions' | 'exam'>('details');

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      if (initialCourse) {
        setName(initialCourse.name);
        setCode(initialCourse.code || '');
        setInstructor(initialCourse.instructor || '');
        setCredits(initialCourse.credits);
        setColor(initialCourse.color);
        setNotes(initialCourse.notes || '');
        setSessions(
          initialCourse.sessions && initialCourse.sessions.length > 0
            ? initialCourse.sessions
            : [{ id: 'session-1', day: 'saturday', startTime: '08:00', endTime: '10:00' }]
        );

        if (initialCourse.exam) {
          setHasExam(true);
          const parts = (initialCourse.exam.date || '').split('/');
          if (parts.length === 3) {
            setExamYear(parts[0]);
            setExamMonth(parts[1].padStart(2, '0'));
            setExamDay(parts[2].padStart(2, '0'));
          }
          setExamStartTime(initialCourse.exam.startTime || '08:30');
          setExamEndTime(initialCourse.exam.endTime || '10:30');
          setExamNotes(initialCourse.exam.notes || '');
        } else {
          setHasExam(false);
        }
      } else {
        // New Course
        setName('');
        setCode('');
        setInstructor('');
        setCredits(3);
        const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)].id;
        setColor(randomColor);
        setNotes('');
        setHasExam(true);

        if (prefilledSlot) {
          setSessions([
            {
              id: 'session-1',
              day: prefilledSlot.day,
              startTime: prefilledSlot.startTime,
              endTime: prefilledSlot.endTime,
            },
          ]);
        } else {
          setSessions([
            {
              id: 'session-1',
              day: 'saturday',
              startTime: '08:00',
              endTime: '10:00',
            },
          ]);
        }

        try {
          const today = new DateObject({ calendar: persian, locale: persian_fa });
          setExamYear(today.year.toString());
          setExamMonth(today.month.number.toString().padStart(2, '0'));
          setExamDay(today.day.toString().padStart(2, '0'));
        } catch (error) {
          // Fallback if anything goes wrong
          setExamYear('1405');
          setExamMonth('10');
          setExamDay('15');
        }
        setExamStartTime('08:30');
        setExamEndTime('10:30');
        setExamNotes('');
      }
      setActiveTab('details');
    }
  }, [isOpen, initialCourse, prefilledSlot]);

  // Construct current exam object
  const currentExamInfo: ExamInfo | undefined = useMemo(() => {
    if (!hasExam) return undefined;
    return {
      date: `${examYear}/${examMonth.padStart(2, '0')}/${examDay.padStart(2, '0')}`,
      dateType: 'shamsi',
      startTime: examStartTime,
      endTime: examEndTime,
      notes: examNotes,
    };
  }, [hasExam, examYear, examMonth, examDay, examStartTime, examEndTime, examNotes]);

  // Real-time conflict validation
  const validationResult = useMemo(() => {
    return validateCourse(
      { sessions, exam: currentExamInfo },
      existingCourses,
      initialCourse?.id
    );
  }, [sessions, currentExamInfo, existingCourses, initialCourse]);

  if (!isOpen) return null;

  const handleAddSession = () => {
    // Determine the next logical day based on the first session (if it exists)
    let nextDay: DayOfWeek = 'monday';
    let nextStart = '10:00';
    let nextEnd = '12:00';

    if (sessions.length > 0) {
      const firstSession = sessions[0];
      nextStart = firstSession.startTime;
      nextEnd = firstSession.endTime;
      
      const dayOrder: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const firstIdx = dayOrder.indexOf(firstSession.day);
      
      if (firstIdx !== -1) {
        if (firstIdx >= 0 && firstIdx <= 2) {
          // Saturday to Monday -> 2 days later
          nextDay = dayOrder[firstIdx + 2];
        } else if (firstIdx === 3 || firstIdx === 4) {
          // Tuesday, Wednesday -> 2 days before
          nextDay = dayOrder[firstIdx - 2];
        } else {
          // Thursday, Friday -> same day
          nextDay = firstSession.day;
        }
      }
    }

    const newSession: ClassSession = {
      id: `session-${Date.now()}`,
      day: nextDay,
      startTime: nextStart,
      endTime: nextEnd,
    };
    setSessions([...sessions, newSession]);
  };

  const handleRemoveSession = (index: number) => {
    if (sessions.length <= 1) return;
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const handleUpdateSession = (index: number, field: keyof ClassSession, value: any) => {
    const updated = [...sessions];
    updated[index] = { ...updated[index], [field]: value };
    setSessions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('لطفاً نام درس را وارد کنید.');
      return;
    }

    if (validationResult.hasConflict) {
      alert('این درس دارای تداخل زمانی با دروس دیگر است. لطفاً ابتدا تداخل را برطرف نمایید.');
      return;
    }

    const courseToSave: Course = {
      id: initialCourse ? initialCourse.id : `course-${Date.now()}`,
      name: name.trim(),
      code: code.trim() || undefined,
      instructor: instructor.trim() || undefined,
      credits: typeof credits === 'number' ? credits : 3,
      color,
      sessions,
      exam: currentExamInfo,
      notes: notes.trim() || undefined,
      createdAt: initialCourse ? initialCourse.createdAt : Date.now(),
    };

    onSave(courseToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1c1d21] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2a2b30] overflow-hidden my-8 max-h-[92vh] flex flex-col transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#2a2b30] bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-3.5 h-3.5 rounded-full ${COLOR_PALETTE.find(c => c.id === color)?.bg || 'bg-blue-500'}`} />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isEditing ? 'ویرایش مشخصات درس' : 'افزودن درس جدید'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-[#2a2b30] bg-white dark:bg-[#1c1d21] px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'details'
                ? 'border-indigo-600 dark:border-emerald-500 text-indigo-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            مشخصات درس
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'sessions'
                ? 'border-indigo-600 dark:border-emerald-500 text-indigo-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            جلسات هفتگی
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-bold">
              {toPersianDigits(sessions.length)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exam')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'exam'
                ? 'border-indigo-600 dark:border-emerald-500 text-indigo-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            امتحان پایان ترم
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: General Details */}
          {activeTab === 'details' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Course Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  نام درس <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام درس را وارد کنید"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#383a40] bg-white dark:bg-[#131416] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500 focus:border-indigo-500 dark:focus:border-emerald-500 text-slate-800 dark:text-slate-100 text-sm font-medium transition-colors"
                />
              </div>

              {/* Code & Instructor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    نام استاد / مدرس (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="مثال: دکتر علوی"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#383a40] bg-white dark:bg-[#131416] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500 text-slate-800 dark:text-slate-100 text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    کد درس و گروه (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="مثال: 102-01"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#383a40] bg-white dark:bg-[#131416] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500 text-slate-800 dark:text-slate-100 text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Credits (Units) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  تعداد واحد درس
                </label>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setCredits(u)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                        credits === u
                          ? 'bg-indigo-600 dark:bg-[#00B87C] text-white dark:text-black border-indigo-600 dark:border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-[#131416] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#383a40] hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {toPersianDigits(u)} واحد
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  رنگ درس در جدول برنامه
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {COLOR_PALETTE.map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setColor(pal.id)}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        color === pal.id
                          ? 'ring-2 ring-indigo-500 dark:ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 border-transparent font-bold shadow-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800'
                          : 'border-slate-200 dark:border-[#383a40] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#131416] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${pal.bg} shrink-0`} />
                      <span className="truncate">{pal.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  توضیحات و یادداشت (اختیاری)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="یادداشت‌های مربوط به درس"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#383a40] bg-white dark:bg-[#131416] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500 text-slate-800 dark:text-slate-100 text-sm transition-colors"
                />
              </div>

            </div>
          )}

          {/* TAB 2: Class Sessions */}
          {activeTab === 'sessions' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">جلسات کلاسی هفتگی</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddSession}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-emerald-900/30 hover:bg-indigo-100 dark:hover:bg-emerald-900/50 text-indigo-700 dark:text-emerald-400 text-xs font-bold rounded-lg transition-colors border border-indigo-200 dark:border-emerald-800/50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  افزودن جلسه دوم
                </button>
              </div>

              {sessions.map((session, index) => (
                <div 
                  key={session.id || index}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#2a2b30] bg-slate-50/70 dark:bg-[#1c1d21]/70 space-y-4 relative"
                >
                  {/* Session Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#2a2b30]">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">
                        {toPersianDigits(index + 1)}
                      </span>
                      جلسه {index === 0 ? 'اول' : 'دوم'}
                    </span>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSession(index)}
                        className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 text-xs flex items-center gap-1 p-1 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف این جلسه
                      </button>
                    )}
                  </div>

                  {/* Day Picker Buttons */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                      روز برگزاری:
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {DAYS_CONFIG.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleUpdateSession(index, 'day', d.id)}
                          className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            session.day === d.id
                              ? 'bg-indigo-600 dark:bg-[#00B87C] text-white dark:text-black border-indigo-600 dark:border-emerald-600 shadow-xs'
                              : 'bg-white dark:bg-[#131416] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2a2b30] hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {d.fa}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Class Time Selector */}
                  <div className="bg-white dark:bg-[#1c1d21] p-3.5 rounded-xl border border-slate-200 dark:border-[#2a2b30]">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600 dark:text-emerald-500" />
                      ساعت برگزاری کلاس:
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">ساعت شروع:</span>
                        <select
                          value={session.startTime}
                          onChange={(e) => handleUpdateSession(index, 'startTime', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131416] rounded-lg border border-slate-300 dark:border-[#383a40] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-emerald-500"
                        >
                          {CLASS_START_HOURS.map((t) => (
                            <option key={t} value={t}>
                              {toPersianDigits(t)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <span className="text-slate-400 font-bold text-sm mt-5">تا</span>

                      <div className="flex-1">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">ساعت پایان:</span>
                        <select
                          value={session.endTime}
                          onChange={(e) => handleUpdateSession(index, 'endTime', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131416] rounded-lg border border-slate-300 dark:border-[#383a40] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-emerald-500"
                        >
                          {CLASS_END_HOURS.map((t) => (
                            <option key={t} value={t}>
                              {toPersianDigits(t)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Final Exam */}
          {activeTab === 'exam' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* No Exam Checkbox */}
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#131416] rounded-xl border border-slate-200 dark:border-[#2a2b30] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1c1d21] transition-colors">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={!hasExam}
                    onChange={(e) => setHasExam(!e.target.checked)}
                    className="w-5 h-5 appearance-none border-2 border-slate-300 dark:border-[#383a40] rounded bg-white dark:bg-[#1c1d21] checked:bg-indigo-600 dark:checked:bg-emerald-500 checked:border-indigo-600 dark:checked:border-emerald-500 transition-colors cursor-pointer"
                  />
                  <CheckCircle2 className={`absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 transition-opacity ${!hasExam ? 'opacity-100' : ''}`} style={{ left: '3px', top: '3px' }} />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">این درس امتحان پایان ترم ندارد</span>
              </label>

              {/* Date Picker */}
              <div className={`space-y-2 transition-opacity duration-200 ${!hasExam ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  تاریخ امتحان پایان ترم:
                </label>

                <div className="w-full">
                  <DatePicker
                    value={examYear && examMonth && examDay ? new DateObject({ date: `${examYear}/${examMonth}/${examDay}`, format: "YYYY/MM/DD", calendar: persian, locale: persian_fa }) : ""}
                    onChange={(date: DateObject | null) => {
                      if (date) {
                        setExamYear(date.year.toString());
                        setExamMonth(date.month.number.toString().padStart(2, '0'));
                        setExamDay(date.day.toString().padStart(2, '0'));
                      }
                    }}
                    calendar={persian}
                    locale={persian_fa}
                    format="dddd YYYY/MM/DD"
                    calendarPosition="bottom-right"
                    containerClassName="w-full"
                    inputClass="w-full px-4 py-2.5 bg-white dark:bg-[#131416] rounded-xl border border-slate-300 dark:border-[#383a40] text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500 transition-shadow dir-ltr text-center"
                  />
                </div>
              </div>

              {/* Exam Time */}
              <div className={`bg-slate-50 dark:bg-[#1c1d21]/50 p-4 rounded-xl border border-slate-200 dark:border-[#2a2b30] space-y-3 transition-opacity duration-200 ${!hasExam ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-emerald-500" />
                  ساعت برگزاری امتحان:
                </label>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">ساعت شروع:</span>
                    <select
                      value={examStartTime}
                      onChange={(e) => setExamStartTime(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-[#131416] rounded-lg border border-slate-300 dark:border-[#383a40] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-emerald-500"
                    >
                      {EXAM_START_HOURS.map((t) => (
                        <option key={t} value={t}>{toPersianDigits(t)}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-slate-400 font-bold text-sm mt-4">تا</span>
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">ساعت پایان:</span>
                    <select
                      value={examEndTime}
                      onChange={(e) => setExamEndTime(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-[#131416] rounded-lg border border-slate-300 dark:border-[#383a40] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-emerald-500"
                    >
                      {EXAM_END_HOURS.map((t) => (
                        <option key={t} value={t}>{toPersianDigits(t)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Exam Notes */}
              <div className={`transition-opacity duration-200 ${!hasExam ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  یادداشت امتحان (اختیاری):
                </label>
                <input
                  type="text"
                  value={examNotes}
                  onChange={(e) => setExamNotes(e.target.value)}
                  placeholder="مثال: ماشین حساب مجاز است"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#383a40] bg-white dark:bg-[#131416] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500 text-slate-800 dark:text-slate-100 text-sm transition-colors"
                />
              </div>

            </div>
          )}

          {/* REALTIME CONFLICT WARNING */}
          {validationResult.hasConflict ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 space-y-2 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>خطای تداخل زمانی:</span>
              </div>
              <ul className="space-y-1 text-xs text-rose-700 dark:text-rose-400 list-disc list-inside mr-2">
                {validationResult.conflicts.map((conf, i) => (
                  <li key={i} className="leading-relaxed font-medium">
                    {conf.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs border border-emerald-200 dark:border-emerald-800/50 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>بدون تداخل زمانی</span>
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-[#2a2b30]">
            <div className="flex items-center gap-2">
              {activeTab !== 'details' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'exam' ? 'sessions' : 'details')}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  مرحله قبلی
                </button>
              )}
              {activeTab !== 'exam' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'details' ? 'sessions' : 'exam')}
                  className="px-3.5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  مرحله بعدی
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={validationResult.hasConflict || !name.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                  validationResult.hasConflict || !name.trim()
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                    : 'bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black hover:shadow-md active:scale-95'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isEditing ? 'ذخیره تغییرات' : 'ثبت درس'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
