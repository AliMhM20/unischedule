import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TimetableGrid } from './components/TimetableGrid';
import { CourseListSidebar } from './components/CourseListSidebar';
import { ExamTimelineView } from './components/ExamTimelineView';
import { HelpAndRules } from './components/HelpAndRules';
import { SoftwareUpdateView } from './components/SoftwareUpdateView';
import { CourseFormModal } from './components/CourseFormModal';
import { CourseCatalogModal } from './components/CourseCatalogModal';
import { Footer } from './components/Footer';
import { Course, DayOfWeek, SchedulePlan } from './types/schedule';
import { INITIAL_SAMPLE_COURSES } from './utils/sampleData';
import { toPersianDigits } from './utils/timeUtils';
import { CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';

const STORAGE_KEY = 'uni_schedule_plans_v3';
const ACTIVE_PLAN_KEY = 'uni_schedule_active_plan_v3';
const CATALOG_STORAGE_KEY = 'unischedule_catalog_courses';
const STUDENT_INFO_KEY = 'unischedule_student_info';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'grid' | 'help' | 'update'>('grid');
  const [showFriday, setShowFriday] = useState<boolean>(false);

  // Catalog State
  const [catalogCourses, setCatalogCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(CATALOG_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [studentInfo, setStudentInfo] = useState<{ name?: string; id?: string } | null>(() => {
    try {
      const saved = localStorage.getItem(STUDENT_INFO_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Plans state - Defaults to empty schedule for new users
  const [plans, setPlans] = useState<SchedulePlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load plans from localStorage', e);
    }
    return [
      {
        id: 'plan-1',
        name: 'برنامه اصلی (پلان الف)',
        courses: INITIAL_SAMPLE_COURSES, // Empty array []
        createdAt: Date.now(),
      },
    ];
  });

  // Active Plan ID
  const [activePlanId, setActivePlanId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_PLAN_KEY);
      if (saved) return saved;
    } catch (e) {
      // fallback
    }
    return 'plan-1';
  });

  // Current active plan
  const activePlan = plans.find((p) => p.id === activePlanId) || plans[0] || {
    id: 'plan-1',
    name: 'برنامه اصلی',
    courses: [],
    createdAt: Date.now(),
  };

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme_preference');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch (e) {
      // ignore
    }
    return false;
  });

  // Apply theme to html element
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme_preference', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme_preference', 'light');
      }
    } catch (e) {
      // ignore
    }
  }, [isDarkMode]);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [prefilledSlot, setPrefilledSlot] = useState<{ day: DayOfWeek; startTime: string; endTime: string } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
      localStorage.setItem(ACTIVE_PLAN_KEY, activePlanId);
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalogCourses));
      localStorage.setItem(STUDENT_INFO_KEY, JSON.stringify(studentInfo));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [plans, activePlanId, catalogCourses, studentInfo]);

  // Handler: Save (Add or Update) Course
  const handleSaveCourse = (course: Course) => {
    const isExisting = activePlan.courses.some((c) => c.id === course.id);
    let updatedCourses: Course[];

    if (isExisting) {
      updatedCourses = activePlan.courses.map((c) => (c.id === course.id ? course : c));
      showToast(`درس «${course.name}» به‌روزرسانی شد.`, 'success');
    } else {
      updatedCourses = [...activePlan.courses, course];
      showToast(`درس «${course.name}» به برنامه اضافه شد.`, 'success');
    }

    const updatedPlans = plans.map((p) =>
      p.id === activePlan.id ? { ...p, courses: updatedCourses } : p
    );
    setPlans(updatedPlans);
    setIsFormModalOpen(false);
    setEditingCourse(null);
    setPrefilledSlot(null);
  };

  // Handler: Delete Course
  const handleDeleteCourse = (courseId: string) => {
    const courseToDelete = activePlan.courses.find((c) => c.id === courseId);
    const updatedCourses = activePlan.courses.filter((c) => c.id !== courseId);
    const updatedPlans = plans.map((p) =>
      p.id === activePlan.id ? { ...p, courses: updatedCourses } : p
    );
    setPlans(updatedPlans);
    if (courseToDelete) {
      showToast(`درس «${courseToDelete.name}» حذف شد.`, 'success');
    }
  };

  // Handler: Clear All Courses
  const handleClearAllCourses = () => {
    if (activePlan.courses.length === 0) return;
    if (window.confirm('آیا مطمئن هستید که می‌خواهید همه دروس این برنامه را حذف کنید؟')) {
      const updatedPlans = plans.map((p) =>
        p.id === activePlan.id ? { ...p, courses: [] } : p
      );
      setPlans(updatedPlans);
      showToast('تمام دروس برنامه حذف شدند.', 'success');
    }
  };

  // Handler: Add New Scenario Plan
  const handleAddNewPlan = () => {
    const planLetters = ['الف', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ی'];
    const nextIndex = plans.length;
    const letter = planLetters[nextIndex] || toPersianDigits(nextIndex + 1);
    const newPlanId = `plan-${Date.now()}`;
    const newPlan: SchedulePlan = {
      id: newPlanId,
      name: `سناریوی ${letter}`,
      courses: [],
      createdAt: Date.now(),
    };

    setPlans([...plans, newPlan]);
    setActivePlanId(newPlanId);
    showToast(`سناریوی جدید «${newPlan.name}» ایجاد شد.`, 'success');
  };

  // Trigger Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#131416] dark:text-slate-100 flex flex-col font-['Vazirmatn',sans-serif] w-full overflow-x-hidden transition-colors duration-200">
      
      {/* Top Bar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingCourse(null);
          setPrefilledSlot(null);
          setIsFormModalOpen(true);
        }}
        plans={plans}
        activePlanId={activePlan.id}
        onSelectPlan={(id) => setActivePlanId(id)}
        onAddPlan={handleAddNewPlan}
        onPrint={handlePrint}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      {/* Main Content Area: 100% Fluid Width */}
      <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
        
        {/* TAB 1: WEEKLY TIMETABLE GRID */}
        {activeTab === 'grid' && (
          <div className="w-full space-y-6">
            
            {/* Catalog Banner */}
            <button
              onClick={() => setIsCatalogModalOpen(true)}
              className="w-full relative overflow-hidden bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 bg-[length:200%_200%] animate-gradient hover:opacity-90 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-md hover:shadow-lg active:scale-[0.99] group text-right print:hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-10 rounded-full -ml-10 -mb-10 blur-3xl"></div>
              
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                    بانک دروس دانشگاه (گزارش ۲۱۲)
                    <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-md leading-none font-bold">BETA</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-100 mt-1 opacity-90">دروس خود را با یک کلیک از سامانه بهستان وارد کرده و از تداخل‌های کلاسی و امتحانی جلوگیری کنید.</p>
                </div>
              </div>
              <div className="relative shrink-0 w-full sm:w-auto bg-white/20 hover:bg-white/30 px-6 py-2.5 rounded-xl font-bold text-sm text-center transition-colors">
                ورود به بانک دروس
              </div>
            </button>

            {/* 1. Courses & Units Summary Panel (On Top) */}
            <div className="w-full print:hidden">
              <CourseListSidebar
                courses={activePlan.courses}
                onAddCourse={() => {
                  setEditingCourse(null);
                  setPrefilledSlot(null);
                  setIsFormModalOpen(true);
                }}
                onEditCourse={(course) => {
                  setEditingCourse(course);
                  setPrefilledSlot(null);
                  setIsFormModalOpen(true);
                }}
                onDeleteCourse={handleDeleteCourse}
                onClearAll={handleClearAllCourses}
              />
            </div>

            {/* 2. Full-Width Timetable Grid (Below Panel) */}
            <div className="w-full">
              <TimetableGrid
                courses={activePlan.courses}
                onEditCourse={(course) => {
                  setEditingCourse(course);
                  setPrefilledSlot(null);
                  setIsFormModalOpen(true);
                }}
                onDeleteCourse={handleDeleteCourse}
                onAddCourseAtSlot={(day, startTime, endTime) => {
                  setEditingCourse(null);
                  setPrefilledSlot({ day, startTime, endTime });
                  setIsFormModalOpen(true);
                }}
                showFriday={showFriday}
                onToggleFriday={() => setShowFriday((prev) => !prev)}
              />
            </div>

            {/* 3. Exam Timeline (Below Timetable) */}
            <div className="w-full pt-4">
              <ExamTimelineView
                courses={activePlan.courses}
                onEditCourse={(course) => {
                  setEditingCourse(course);
                  setPrefilledSlot(null);
                  setIsFormModalOpen(true);
                }}
              />
            </div>

          </div>
        )}

        {/* TAB 2: HELP & REGULATIONS */}
        {activeTab === 'help' && (
          <div className="w-full">
            <HelpAndRules />
          </div>
        )}

        {/* TAB 3: SOFTWARE UPDATE (Full Page View) */}
        {activeTab === 'update' && (
          <div className="w-full">
            <SoftwareUpdateView />
          </div>
        )}

        {/* Footer always visible on all tabs */}
        <Footer />
      </main>

      {/* Floating Add/Edit Course Modal */}
      {isFormModalOpen && (
        <CourseFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingCourse(null);
            setPrefilledSlot(null);
          }}
          onSave={handleSaveCourse}
          initialCourse={editingCourse}
          prefilledSlot={prefilledSlot}
          existingCourses={activePlan.courses}
        />
      )}

      {/* Course Catalog Modal (Behestan Import) */}
      {isCatalogModalOpen && (
        <CourseCatalogModal
          isOpen={isCatalogModalOpen}
          onClose={() => setIsCatalogModalOpen(false)}
          onAddCourse={handleSaveCourse}
          onRemoveCourse={handleDeleteCourse}
          existingCourses={activePlan.courses}
          catalogCourses={catalogCourses}
          setCatalogCourses={setCatalogCourses}
          studentInfo={studentInfo}
          setStudentInfo={setStudentInfo}
        />
      )}

      {/* Toast Notification Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-xs font-bold text-white ${
              toastMessage.type === 'success' ? 'bg-slate-900 border border-slate-800' : 'bg-rose-600'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

    </div>
  );
}
