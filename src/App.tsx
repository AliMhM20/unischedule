import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TimetableGrid } from './components/TimetableGrid';
import { CourseListSidebar } from './components/CourseListSidebar';
import { ExamTimelineView } from './components/ExamTimelineView';
import { HelpAndRules } from './components/HelpAndRules';
import { CourseFormModal } from './components/CourseFormModal';
import { Course, DayOfWeek, SchedulePlan } from './types/schedule';
import { INITIAL_SAMPLE_COURSES } from './utils/sampleData';
import { toPersianDigits } from './utils/timeUtils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'uni_schedule_plans_v3';
const ACTIVE_PLAN_KEY = 'uni_schedule_active_plan_v3';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'grid' | 'exams' | 'help'>('grid');
  const [showFriday, setShowFriday] = useState<boolean>(false);

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

  const [activePlanId, setActivePlanId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_PLAN_KEY);
      if (savedId) return savedId;
    } catch (e) {
      // ignore
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

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
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
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [plans, activePlanId]);

  // Handler: Save (Add or Update) Course
  const handleSaveCourse = (course: Course) => {
    setPlans((prevPlans) =>
      prevPlans.map((p) => {
        if (p.id !== activePlan.id) return p;

        const exists = p.courses.some((c) => c.id === course.id);
        let updatedCourses: Course[];

        if (exists) {
          updatedCourses = p.courses.map((c) => (c.id === course.id ? course : c));
          showToast(`درس «${course.name}» با موفقیت ویرایش شد.`, 'success');
        } else {
          updatedCourses = [...p.courses, course];
          showToast(`درس «${course.name}» به جدول برنامه هفتگی اضافه گردید.`, 'success');
        }

        return {
          ...p,
          courses: updatedCourses,
        };
      })
    );
  };

  // Handler: Delete Course
  const handleDeleteCourse = (courseId: string) => {
    const targetCourse = activePlan.courses.find((c) => c.id === courseId);
    setPlans((prevPlans) =>
      prevPlans.map((p) => {
        if (p.id !== activePlan.id) return p;
        return {
          ...p,
          courses: p.courses.filter((c) => c.id !== courseId),
        };
      })
    );
    if (targetCourse) {
      showToast(`درس «${targetCourse.name}» از برنامه حذف شد.`, 'success');
    }
  };

  // Handler: Clear All Courses in active plan
  const handleClearAllCourses = () => {
    setPlans((prevPlans) =>
      prevPlans.map((p) => (p.id === activePlan.id ? { ...p, courses: [] } : p))
    );
    showToast('تمامی دروس این برنامه پاکسازی شدند.', 'success');
  };

  // Handler: Add New Scenario Plan
  const handleAddNewPlan = () => {
    const planNumber = plans.length + 1;
    const newPlanId = `plan-${Date.now()}`;
    const newPlan: SchedulePlan = {
      id: newPlanId,
      name: `سناریو شماره ${toPersianDigits(planNumber)} (پلان ${planNumber === 2 ? 'ب' : planNumber === 3 ? 'ج' : planNumber})`,
      courses: [...activePlan.courses],
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Vazirmatn',sans-serif] w-full overflow-x-hidden">
      
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
      />

      {/* Main Content Area: 100% Fluid Width */}
      <main className="flex-1 w-full p-6 space-y-6">
        
        {/* TAB 1: WEEKLY TIMETABLE GRID */}
        {activeTab === 'grid' && (
          <div className="w-full space-y-6">
            
            {/* 1. Courses & Units Summary Panel (On Top) */}
            <div className="w-full">
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

          </div>
        )}

        {/* TAB 2: EXAM TIMELINE & CONFLICTS */}
        {activeTab === 'exams' && (
          <div className="w-full">
            <ExamTimelineView
              courses={activePlan.courses}
              onEditCourse={(course) => {
                setEditingCourse(course);
                setPrefilledSlot(null);
                setIsFormModalOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 3: HELP & REGULATIONS */}
        {activeTab === 'help' && (
          <div className="w-full">
            <HelpAndRules />
          </div>
        )}

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
