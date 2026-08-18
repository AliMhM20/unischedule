import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Plus, Trash2, Calendar, Clock, AlertTriangle, CheckCircle2, 
  User, BookOpen, Hash 
} from 'lucide-react';
import { Course, ClassSession, DayOfWeek, ExamInfo } from '../types/schedule';
import { 
  DAYS_CONFIG, COLOR_PALETTE, validateCourse, toPersianDigits 
} from '../utils/timeUtils';
import { ShamsiDateWheelPicker } from './ShamsiDateWheelPicker';

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
          const parts = (initialCourse.exam.date || '').split('/');
          if (parts.length === 3) {
            setExamYear(parts[0]);
            setExamMonth(parts[1].padStart(2, '0'));
            setExamDay(parts[2].padStart(2, '0'));
          }
          setExamStartTime(initialCourse.exam.startTime || '08:30');
          setExamEndTime(initialCourse.exam.endTime || '10:30');
          setExamNotes(initialCourse.exam.notes || '');
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

        setExamYear('1405');
        setExamMonth('10');
        setExamDay('15');
        setExamStartTime('08:30');
        setExamEndTime('10:30');
        setExamNotes('');
      }
      setActiveTab('details');
    }
  }, [isOpen, initialCourse, prefilledSlot]);

  // Construct current exam object
  const currentExamInfo: ExamInfo = useMemo(() => ({
    date: `${examYear}/${examMonth.padStart(2, '0')}/${examDay.padStart(2, '0')}`,
    dateType: 'shamsi',
    startTime: examStartTime,
    endTime: examEndTime,
    notes: examNotes,
  }), [examYear, examMonth, examDay, examStartTime, examEndTime, examNotes]);

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
    const newSession: ClassSession = {
      id: `session-${Date.now()}`,
      day: 'monday',
      startTime: '10:00',
      endTime: '12:00',
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
      credits: Number(credits) || 3,
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
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className={`w-3.5 h-3.5 rounded-full ${COLOR_PALETTE.find(c => c.id === color)?.bg || 'bg-blue-500'}`} />
            <h2 className="text-lg font-bold text-slate-800">
              {isEditing ? 'ویرایش مشخصات درس' : 'افزودن درس جدید'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            مشخصات درس
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            جلسات هفتگی
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {toPersianDigits(sessions.length)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exam')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'exam'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  نام درس <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام درس را وارد کنید"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm font-medium"
                />
              </div>

              {/* Code & Instructor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-600" />
                    نام استاد / مدرس (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="مثال: دکتر علوی"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-slate-600" />
                    کد درس و گروه (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="مثال: 102-01"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Credits (Units) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  تعداد واحد درس
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setCredits(u)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                        credits === u
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {toPersianDigits(u)} واحد
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  رنگ درس در جدول برنامه
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {COLOR_PALETTE.map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setColor(pal.id)}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                        color === pal.id
                          ? 'ring-2 ring-indigo-500 ring-offset-2 border-transparent font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  توضیحات و یادداشت (اختیاری)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="یادداشت‌های مربوط به درس"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                />
              </div>

            </div>
          )}

          {/* TAB 2: Class Sessions */}
          {activeTab === 'sessions' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">جلسات کلاسی هفتگی</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddSession}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-200"
                >
                  <Plus className="w-4 h-4" />
                  افزودن جلسه دوم
                </button>
              </div>

              {sessions.map((session, index) => (
                <div 
                  key={session.id || index}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4 relative"
                >
                  {/* Session Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs">
                        {toPersianDigits(index + 1)}
                      </span>
                      جلسه {index === 0 ? 'اول' : 'دوم'}
                    </span>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSession(index)}
                        className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 p-1 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف این جلسه
                      </button>
                    )}
                  </div>

                  {/* Day Picker Buttons */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">
                      روز برگزاری:
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {DAYS_CONFIG.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleUpdateSession(index, 'day', d.id)}
                          className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                            session.day === d.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {d.fa}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Class Time Selector */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      ساعت برگزاری کلاس:
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <span className="text-xs font-medium text-slate-500 block mb-1">ساعت شروع:</span>
                        <select
                          value={session.startTime}
                          onChange={(e) => handleUpdateSession(index, 'startTime', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                        <span className="text-xs font-medium text-slate-500 block mb-1">ساعت پایان:</span>
                        <select
                          value={session.endTime}
                          onChange={(e) => handleUpdateSession(index, 'endTime', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              
              {/* Date Wheel Picker */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  تاریخ امتحان پایان ترم:
                </label>

                <ShamsiDateWheelPicker
                  year={examYear}
                  month={examMonth}
                  day={examDay}
                  onChange={(y, m, d) => {
                    setExamYear(y);
                    setExamMonth(m);
                    setExamDay(d);
                  }}
                />
              </div>

              {/* Exam Time */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  ساعت برگزاری امتحان:
                </label>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 block mb-1">ساعت شروع:</span>
                    <select
                      value={examStartTime}
                      onChange={(e) => setExamStartTime(e.target.value)}
                      className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {EXAM_START_HOURS.map((t) => (
                        <option key={t} value={t}>{toPersianDigits(t)}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-slate-400 font-bold text-sm mt-4">تا</span>
                  <div className="flex-1">
                    <span className="text-xs text-slate-500 block mb-1">ساعت پایان:</span>
                    <select
                      value={examEndTime}
                      onChange={(e) => setExamEndTime(e.target.value)}
                      className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {EXAM_END_HOURS.map((t) => (
                        <option key={t} value={t}>{toPersianDigits(t)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Exam Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  یادداشت امتحان (اختیاری):
                </label>
                <input
                  type="text"
                  value={examNotes}
                  onChange={(e) => setExamNotes(e.target.value)}
                  placeholder="مثال: ماشین حساب مجاز است"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                />
              </div>

            </div>
          )}

          {/* REALTIME CONFLICT WARNING */}
          {validationResult.hasConflict ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>خطای تداخل زمانی:</span>
              </div>
              <ul className="space-y-1 text-xs text-rose-700 list-disc list-inside mr-2">
                {validationResult.conflicts.map((conf, i) => (
                  <li key={i} className="leading-relaxed font-medium">
                    {conf.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs border border-emerald-200 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>بدون تداخل زمانی</span>
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              {activeTab !== 'details' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'exam' ? 'sessions' : 'details')}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  مرحله قبلی
                </button>
              )}
              {activeTab !== 'exam' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'details' ? 'sessions' : 'exam')}
                  className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                >
                  مرحله بعدی
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={validationResult.hasConflict || !name.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                  validationResult.hasConflict || !name.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow-md active:scale-95'
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
