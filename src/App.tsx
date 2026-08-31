import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TimetableGrid } from './components/TimetableGrid';
import { CourseListSidebar } from './components/CourseListSidebar';
import { ExamTimelineView } from './components/ExamTimelineView';
import { HelpAndRules } from './components/HelpAndRules';
import { SoftwareUpdateView } from './components/SoftwareUpdateView';
import { CourseFormModal } from './components/CourseFormModal';
import { CourseCatalogModal } from './components/CourseCatalogModal';
import { PlanModal } from './components/PlanModal';
import { ShareModal } from './components/ShareModal';
import { AnnouncementModal } from './components/AnnouncementModal';
import { ConfirmModal, ConfirmModalConfig } from './components/ConfirmModal';
import { LATEST_ANNOUNCEMENT } from './data/announcementData';
import { Footer } from './components/Footer';
import { Course, DayOfWeek, SchedulePlan } from './types/schedule';
import { INITIAL_SAMPLE_COURSES } from './utils/sampleData';
import { toPersianDigits } from './utils/timeUtils';
import { decodeSchedulePlan } from './utils/shareUtils';
import { UniversityId } from './utils/parsers';
import { CheckCircle2, AlertCircle, BookOpen, Upload, X, Eye, Download, Share2, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'uni_schedule_plans_v3';
const ACTIVE_PLAN_KEY = 'uni_schedule_active_plan_v3';
const CATALOG_STORAGE_KEY = 'unischedule_catalog_courses';
const STUDENT_INFO_KEY = 'unischedule_student_info';
const DISMISSED_ANNOUNCEMENT_KEY = 'unischedule_dismissed_announcement_id';

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
  const [studentInfo, setStudentInfo] = useState<{ name?: string; id?: string; universityName?: string; universityId?: UniversityId } | null>(() => {
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
  // Announcement / Release Notes Modal State
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const dismissedId = localStorage.getItem(DISMISSED_ANNOUNCEMENT_KEY);
        return dismissedId !== LATEST_ANNOUNCEMENT.id;
      }
    } catch (e) {
      // ignore
    }
    return true;
  });

  const handleCloseAnnouncement = (dontShowAgain: boolean) => {
    setIsAnnouncementOpen(false);
    try {
      if (dontShowAgain) {
        localStorage.setItem(DISMISSED_ANNOUNCEMENT_KEY, LATEST_ANNOUNCEMENT.id);
      } else {
        localStorage.removeItem(DISMISSED_ANNOUNCEMENT_KEY);
      }
    } catch (e) {
      console.error('Failed to save announcement dismissal state to localStorage', e);
    }
  };

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalTab, setFormModalTab] = useState<'details' | 'sessions' | 'exam'>('details');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isEmptyCatalogAlertOpen, setIsEmptyCatalogAlertOpen] = useState(false);
  const [catalogFilterSlot, setCatalogFilterSlot] = useState<{ day: DayOfWeek; startTime: string; endTime: string } | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [prefilledSlot, setPrefilledSlot] = useState<{ day: DayOfWeek; startTime: string; endTime: string } | null>(null);

  // Share & Preview Plan State
  const [shareModalPlan, setShareModalPlan] = useState<SchedulePlan | null>(null);
  const [previewPlan, setPreviewPlan] = useState<SchedulePlan | null>(null);
  const [importSuccessPrompt, setImportSuccessPrompt] = useState<{
    newPlanId: string;
    planName: string;
  } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Listen to URL hash for shareable plan (#plan=...)
  useEffect(() => {
    const handleCheckHash = () => {
      try {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#plan=')) {
          const encoded = hash.replace('#plan=', '');
          const decoded = decodeSchedulePlan(encoded);
          if (decoded) {
            setPreviewPlan(decoded);
            setActiveTab('grid');
          } else {
            showToast('لینک اشتراک‌گذاری برنامه نامعتبر است یا به درستی کپی نشده است.', 'error');
          }
        }
      } catch (err) {
        console.error('Error parsing plan from hash:', err);
      }
    };

    handleCheckHash();
    window.addEventListener('hashchange', handleCheckHash);
    return () => window.removeEventListener('hashchange', handleCheckHash);
  }, []);

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

  // Handler: Import preview plan into user's own plans
  const handleImportPreviewPlan = (planToImport: SchedulePlan) => {
    const newPlanId = `plan_${Date.now()}`;
    const now = Date.now();
    const importedPlan: SchedulePlan = {
      id: newPlanId,
      name: `${planToImport.name} (اشتراکی)`,
      courses: planToImport.courses.map((c, i) => ({
        ...c,
        id: `c_${now}_${i}`,
        createdAt: now,
        sessions: (c.sessions || []).map((s, si) => ({
          ...s,
          id: `sess_${now}_${i}_${si}`
        }))
      })),
      createdAt: now
    };

    const hasFriday = (planToImport.courses || []).some(c => (c.sessions || []).some(s => s.day === 'friday'));
    if (hasFriday) {
      setShowFriday(true);
    }

    setPlans(prev => [...prev, importedPlan]);
    setImportSuccessPrompt({
      newPlanId,
      planName: importedPlan.name
    });
  };

  // Handler: Save (Add or Update) Course
  const handleSaveCourse = (course: Course) => {
    let isExisting = false;
    setPlans((prevPlans) => {
      return prevPlans.map((p) => {
        if (p.id !== activePlanId) return p;
        isExisting = p.courses.some((c) => c.id === course.id);
        const updatedCourses = isExisting
          ? p.courses.map((c) => (c.id === course.id ? course : c))
          : [...p.courses, course];
        return { ...p, courses: updatedCourses };
      });
    });
    showToast(
      isExisting ? `درس «${course.name}» به‌روزرسانی شد.` : `درس «${course.name}» به برنامه اضافه شد.`,
      'success'
    );
    setIsFormModalOpen(false);
    setEditingCourse(null);
    setPrefilledSlot(null);
  };

  // Handler: Delete Course
  const handleDeleteCourse = (courseId: string) => {
    let courseToDeleteName = '';
    setPlans((prevPlans) => {
      return prevPlans.map((p) => {
        if (p.id !== activePlanId) return p;
        const target = p.courses.find((c) => c.id === courseId);
        if (target) courseToDeleteName = target.name;
        return { ...p, courses: p.courses.filter((c) => c.id !== courseId) };
      });
    });
    if (courseToDeleteName) {
      showToast(`درس «${courseToDeleteName}» حذف شد.`, 'success');
    }
  };

  // Handler: Replace Conflicting Courses with a New Course (Atomic Operation)
  const handleReplaceCourses = (courseToAdd: Course, conflictingCourseIds: string[]) => {
    setPlans((prevPlans) => {
      return prevPlans.map((p) => {
        if (p.id !== activePlanId) return p;
        const remainingCourses = p.courses.filter((c) => !conflictingCourseIds.includes(c.id));
        const updatedCourses = [...remainingCourses.filter((c) => c.id !== courseToAdd.id), courseToAdd];
        return { ...p, courses: updatedCourses };
      });
    });
    showToast(`درس «${courseToAdd.name}» جایگزین دروس متداخل شد.`, 'success');
  };

  // Global In-App Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig | null>(null);

  // Handler: Prompt Delete Course with In-App Confirm Modal
  const handlePromptDeleteCourse = (courseId: string) => {
    const course = activePlan.courses.find((c) => c.id === courseId);
    if (!course) return;
    setConfirmModal({
      isOpen: true,
      title: 'حذف درس از برنامه',
      message: `آیا از حذف درس «${course.name}» از برنامه هفتگی خود اطمینان دارید؟`,
      confirmText: 'حذف درس',
      cancelText: 'انصراف',
      variant: 'danger',
      onConfirm: () => {
        handleDeleteCourse(courseId);
      },
    });
  };

  // Handler: Clear All Courses with In-App Confirm Modal
  const handleClearAllCourses = () => {
    if (activePlan.courses.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'پاکسازی تمام دروس برنامه',
      message: `آیا از حذف تمامی ${toPersianDigits(activePlan.courses.length)} درس ثبت‌شده در «${activePlan.name}» اطمینان دارید؟ این عمل غیرقابل بازگشت است.`,
      confirmText: 'بله، همه را پاک کن',
      cancelText: 'انصراف',
      variant: 'danger',
      onConfirm: () => {
        setPlans((prevPlans) =>
          prevPlans.map((p) => (p.id === activePlanId ? { ...p, courses: [] } : p))
        );
        showToast('تمام دروس برنامه حذف شدند.', 'success');
      },
    });
  };

  // Plan Modal state (Create / Edit)
  const [planModalConfig, setPlanModalConfig] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    planToEdit?: SchedulePlan | null;
    isMainPlan?: boolean;
    defaultSuggestedName: string;
  }>({
    isOpen: false,
    mode: 'create',
    planToEdit: null,
    isMainPlan: false,
    defaultSuggestedName: '',
  });

  // Handler: Request Create Plan Modal
  const handleRequestCreatePlan = () => {
    const planLetters = ['الف', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ی'];
    const nextIndex = plans.length;
    const letter = planLetters[nextIndex] || toPersianDigits(nextIndex + 1);
    const defaultName = `سناریوی ${letter}`;

    setPlanModalConfig({
      isOpen: true,
      mode: 'create',
      planToEdit: null,
      isMainPlan: false,
      defaultSuggestedName: defaultName,
    });
  };

  // Handler: Request Edit Plan Modal
  const handleRequestEditPlan = (plan: SchedulePlan) => {
    const isMain = plan.id === 'plan-1' || plans.indexOf(plan) === 0;
    setPlanModalConfig({
      isOpen: true,
      mode: 'edit',
      planToEdit: plan,
      isMainPlan: isMain,
      defaultSuggestedName: plan.name,
    });
  };

  // Handler: Save Plan from Modal
  const handleSavePlanFromModal = (name: string) => {
    if (planModalConfig.mode === 'create') {
      const newPlanId = `plan-${Date.now()}`;
      const newPlan: SchedulePlan = {
        id: newPlanId,
        name,
        courses: [],
        createdAt: Date.now(),
      };
      setPlans([...plans, newPlan]);
      setActivePlanId(newPlanId);
      showToast(`سناریوی جدید «${name}» ایجاد شد.`, 'success');
    } else if (planModalConfig.mode === 'edit' && planModalConfig.planToEdit) {
      const targetId = planModalConfig.planToEdit.id;
      const updatedPlans = plans.map((p) => (p.id === targetId ? { ...p, name } : p));
      setPlans(updatedPlans);
      showToast(`نام سناریو به «${name}» تغییر یافت.`, 'success');
    }
  };

  // Handler: Duplicate Plan
  const handleDuplicatePlan = (planId: string) => {
    const target = plans.find((p) => p.id === planId);
    if (!target) return;

    const newPlanId = `plan-${Date.now()}`;
    let cloneName = `کپی ${target.name}`;
    if (cloneName.length > 30) {
      cloneName = cloneName.substring(0, 30);
    }

    const clonedCourses: Course[] = target.courses.map((c) => ({
      ...c,
      sessions: c.sessions.map((s) => ({ ...s })),
      exam: c.exam ? { ...c.exam } : undefined,
    }));

    const clonedPlan: SchedulePlan = {
      id: newPlanId,
      name: cloneName,
      courses: clonedCourses,
      createdAt: Date.now(),
    };

    setPlans([...plans, clonedPlan]);
    setActivePlanId(newPlanId);
    showToast(`سناریوی «${cloneName}» با موفقیت تکثیر شد.`, 'success');
  };

  // Handler: Delete Plan
  const handleDeletePlan = (planId: string) => {
    if (planId === 'plan-1' || plans[0]?.id === planId) {
      showToast('برنامه اصلی قابل حذف نیست.', 'error');
      return;
    }

    const target = plans.find((p) => p.id === planId);
    if (!target) return;

    const performDelete = () => {
      const remaining = plans.filter((p) => p.id !== planId);
      setPlans(remaining);
      if (activePlanId === planId) {
        setActivePlanId(remaining[0]?.id || 'plan-1');
      }
      showToast(`سناریوی «${target.name}» حذف شد.`, 'success');
    };

    if (target.courses.length === 0) {
      performDelete();
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'حذف سناریو برنامه',
        message: `سناریوی «${target.name}» دارای ${toPersianDigits(target.courses.length)} درس ثبت‌شده است. آیا از حذف آن اطمینان دارید؟`,
        confirmText: 'حذف سناریو',
        cancelText: 'انصراف',
        variant: 'danger',
        onConfirm: performDelete,
      });
    }
  };

  // Trigger Print
  const handlePrint = () => {
    window.print();
  };

  const currentDisplayPlan = previewPlan || activePlan;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#131416] dark:text-slate-100 flex flex-col font-['Vazirmatn',sans-serif] w-full overflow-x-hidden transition-colors duration-200" dir="rtl">
      
      {/* Dynamic Top Navbar */}
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
        onSelectPlan={(id) => {
          setPreviewPlan(null);
          try {
            history.replaceState(null, '', window.location.pathname);
          } catch (e) {}
          setActivePlanId(id);
        }}
        onRequestCreatePlan={handleRequestCreatePlan}
        onRequestEditPlan={handleRequestEditPlan}
        onDuplicatePlan={handleDuplicatePlan}
        onDeletePlan={handleDeletePlan}
        onSharePlan={(plan) => setShareModalPlan(plan)}
        onPrint={handlePrint}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        isPreviewMode={Boolean(previewPlan)}
      />

      {/* Main Content Area: 100% Fluid Width */}
      <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
        
        {/* TAB 1: WEEKLY TIMETABLE GRID */}
        {activeTab === 'grid' && (
          <div className="w-full space-y-6">
            
            {/* Preview Banner if in Preview Mode */}
            {previewPlan && (
              <div className="w-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/40 border-2 border-indigo-300 dark:border-emerald-600/60 rounded-3xl p-4 sm:p-5 shadow-lg animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-[#00B87C] text-white dark:text-black flex items-center justify-center shrink-0 shadow-md">
                      <Eye className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                          پیش‌نمایش برنامه اشتراک‌گذاری شده
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-emerald-300 bg-indigo-100 dark:bg-emerald-900/60 border border-indigo-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                          حالت فقط‌خواندنی (Read-Only)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        نام برنامه: <strong className="text-slate-900 dark:text-white">«{previewPlan.name}»</strong> ({toPersianDigits(previewPlan.courses.length)} درس - {toPersianDigits((previewPlan.courses || []).reduce((sum, c) => sum + (Number(c.credits) || 0), 0))} واحد)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewPlan(null);
                        try {
                          history.replaceState(null, '', window.location.pathname);
                        } catch (e) {}
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-center"
                    >
                      خروج از پیش‌نمایش
                    </button>

                    <button
                      type="button"
                      onClick={() => handleImportPreviewPlan(previewPlan)}
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-[#00B87C] dark:to-[#009e6a] dark:hover:from-[#00d18d] dark:hover:to-[#00B87C] text-white dark:text-black rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-center whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      <span>افزودن به برنامه‌های من</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Catalog Banner (Hidden in Preview Mode) */}
            {!previewPlan && (
              <button
                onClick={() => {
                  setCatalogFilterSlot(null);
                  setIsCatalogModalOpen(true);
                }}
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
                      بانک دروس ارائه شده دانشگاه
                      <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-md leading-none font-bold">BETA</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-purple-100 mt-1 opacity-90">دروس خود را با یک کلیک از پورتال آموزشی دانشگاه وارد کرده و از تداخل‌های کلاسی و امتحانی جلوگیری کنید.</p>
                  </div>
                </div>
                <div className="relative shrink-0 w-full sm:w-auto bg-white/20 hover:bg-white/30 px-6 py-2.5 rounded-xl font-bold text-sm text-center transition-colors">
                  ورود به بانک دروس
                </div>
              </button>
            )}

            {/* 1. Courses & Units Summary Panel (On Top) */}
            <div className="w-full print:hidden">
              <CourseListSidebar
                courses={currentDisplayPlan.courses}
                onAddCourse={() => {
                  setEditingCourse(null);
                  setPrefilledSlot(null);
                  setFormModalTab('details');
                  setIsFormModalOpen(true);
                }}
                onEditCourse={(course) => {
                  setEditingCourse(course);
                  setPrefilledSlot(null);
                  setFormModalTab('details');
                  setIsFormModalOpen(true);
                }}
                onDeleteCourse={handlePromptDeleteCourse}
                onClearAll={handleClearAllCourses}
                isPreviewMode={Boolean(previewPlan)}
              />
            </div>

            {/* 2. Full-Width Timetable Grid (Below Panel) */}
            <div className="w-full">
              <TimetableGrid
                courses={currentDisplayPlan.courses}
                onEditCourse={(course) => {
                  setEditingCourse(course);
                  setPrefilledSlot(null);
                  setFormModalTab('details');
                  setIsFormModalOpen(true);
                }}
                onDeleteCourse={handlePromptDeleteCourse}
                onAddCourseAtSlot={(day, startTime, endTime) => {
                  setEditingCourse(null);
                  setPrefilledSlot({ day, startTime, endTime });
                  setFormModalTab('details');
                  setIsFormModalOpen(true);
                }}
                onSelectGapFromCatalog={(day, startTime, endTime) => {
                  if (catalogCourses.length === 0) {
                    setIsEmptyCatalogAlertOpen(true);
                    return;
                  }
                  setCatalogFilterSlot({ day, startTime, endTime });
                  setIsCatalogModalOpen(true);
                }}
                showFriday={showFriday}
                onToggleFriday={() => setShowFriday((prev) => !prev)}
                isPreviewMode={Boolean(previewPlan)}
              />
            </div>

            {/* 3. Exam Timeline (Below Timetable) */}
            <div className="w-full pt-4">
              <ExamTimelineView
                courses={currentDisplayPlan.courses}
                onEditCourse={(course) => {
                  setEditingCourse(course);
                  setPrefilledSlot(null);
                  setFormModalTab('exam');
                  setIsFormModalOpen(true);
                }}
                onOpenAddModal={() => {
                  setEditingCourse(null);
                  setPrefilledSlot(null);
                  setFormModalTab('details');
                  setIsFormModalOpen(true);
                }}
                isPreviewMode={Boolean(previewPlan)}
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

        {/* TAB 3: SOFTWARE UPDATE (Desktop Electron Only) */}
        {activeTab === 'update' && typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron) && (
          <div className="w-full">
            <SoftwareUpdateView />
          </div>
        )}

        {/* Footer always visible on all tabs */}
        <Footer onOpenAnnouncement={() => setIsAnnouncementOpen(true)} />
      </main>

      {/* Floating Add/Edit Course Modal */}
      {isFormModalOpen && (
        <CourseFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingCourse(null);
            setPrefilledSlot(null);
            setFormModalTab('details');
          }}
          onSave={handleSaveCourse}
          initialCourse={editingCourse}
          prefilledSlot={prefilledSlot}
          existingCourses={activePlan.courses}
          initialTab={formModalTab}
        />
      )}

      {/* Course Catalog Modal (Behestan Import) */}
      {isCatalogModalOpen && (
        <CourseCatalogModal
          isOpen={isCatalogModalOpen}
          onClose={() => {
            setIsCatalogModalOpen(false);
            setCatalogFilterSlot(null);
          }}
          onAddCourse={handleSaveCourse}
          onRemoveCourse={handleDeleteCourse}
          onReplaceCourse={handleReplaceCourses}
          existingCourses={activePlan.courses}
          catalogCourses={catalogCourses}
          setCatalogCourses={setCatalogCourses}
          studentInfo={studentInfo}
          setStudentInfo={setStudentInfo}
          initialFilterSlot={catalogFilterSlot}
          showFriday={showFriday}
          onToggleFriday={() => setShowFriday(prev => !prev)}
          onEditCourse={(course) => {
            setEditingCourse(course);
            setFormModalTab('details');
            setIsFormModalOpen(true);
          }}
        />
      )}

      {/* Plan Modal (Create & Rename) */}
      <PlanModal
        isOpen={planModalConfig.isOpen}
        onClose={() => setPlanModalConfig((prev) => ({ ...prev, isOpen: false }))}
        mode={planModalConfig.mode}
        planToEdit={planModalConfig.planToEdit}
        isMainPlan={planModalConfig.isMainPlan}
        defaultSuggestedName={planModalConfig.defaultSuggestedName}
        onSave={handleSavePlanFromModal}
      />

            {/* Empty Catalog Alert Modal for Gap Selection */}
      {isEmptyCatalogAlertOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in print:hidden"
          dir="rtl"
          onClick={() => setIsEmptyCatalogAlertOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#18191d] rounded-3xl border border-slate-200 dark:border-[#2a2b30] shadow-2xl max-w-md w-full p-6 space-y-4 transition-colors duration-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2a2b30] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    بانک دروس دانشگاه خالی است!
                  </h3>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                    نیاز به بارگذاری دروس
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmptyCatalogAlertOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2b30] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 space-y-2.5">
              <p>
                برای استفاده از قابلیت هوشمند <strong>«انتخاب از روی گپ‌های جدول»</strong>، ابتدا باید لیست دروس ارائه شده این ترم دانشگاه خود را وارد برنامه کنید.
              </p>
              <div className="bg-slate-50 dark:bg-[#131416] p-3 rounded-2xl border border-slate-100 dark:border-[#2a2b30] text-[11.5px] text-slate-700 dark:text-slate-300">
                💡 کافیست وارد <strong>بانک دروس</strong> شوید، دانشگاه خود را انتخاب کنید و طبق <strong>راهنمای تصویری</strong>، فایل دروس دانشگاه را با یک کلیک بارگذاری نمایید.
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#2a2b30]">
              <button
                type="button"
                onClick={() => {
                  setIsEmptyCatalogAlertOpen(false);
                  setCatalogFilterSlot(null);
                  setIsCatalogModalOpen(true);
                }}
                className="w-full sm:flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-[#00B87C] dark:to-[#009e6a] dark:hover:from-[#00d18d] dark:hover:to-[#00B87C] text-white dark:text-black rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>ورود به بانک دروس و بارگذاری</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEmptyCatalogAlertOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement / Release Notes Modal */}
      <AnnouncementModal
        isOpen={isAnnouncementOpen}
        isDismissed={(() => {
          try {
            return localStorage.getItem(DISMISSED_ANNOUNCEMENT_KEY) === LATEST_ANNOUNCEMENT.id;
          } catch {
            return false;
          }
        })()}
        onClose={handleCloseAnnouncement}
      />

      {/* Share Schedule Plan Modal */}
      {shareModalPlan && (
        <ShareModal
          isOpen={Boolean(shareModalPlan)}
          plan={shareModalPlan}
          onClose={() => setShareModalPlan(null)}
        />
      )}

      {/* Global In-App Confirm Modal */}
      <ConfirmModal
        config={confirmModal}
        onClose={() => setConfirmModal(null)}
      />

      {/* Shared Import Success In-App Modal Dialog */}
      {importSuccessPrompt && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in print:hidden"
          dir="rtl"
          onClick={() => setImportSuccessPrompt(null)}
        >
          <div
            className="bg-white dark:bg-[#18191d] rounded-3xl border border-slate-200 dark:border-[#2a2b30] shadow-2xl max-w-md w-full p-6 space-y-4 transition-colors duration-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2a2b30] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    برنامه با موفقیت اضافه شد!
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    ذخیره در برنامه‌های من
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportSuccessPrompt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2b30] transition-colors cursor-pointer"
                title="ادامه مشاهده (بستن پنجره)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 py-1">
              <p>
                برنامه <strong className="text-slate-900 dark:text-slate-100">«{importSuccessPrompt.planName}»</strong> با موفقیت به لیست سناریوهای شما اضافه شد.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-[#2a2b30]">
              <button
                type="button"
                onClick={() => {
                  const targetId = importSuccessPrompt.newPlanId;
                  const name = importSuccessPrompt.planName;
                  setImportSuccessPrompt(null);
                  setPreviewPlan(null);
                  try {
                    history.replaceState(null, '', window.location.pathname);
                  } catch (e) {}
                  setActivePlanId(targetId);
                  showToast(`به برنامه «${name}» منتقل شدید.`, 'success');
                }}
                className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                خروج از پیش‌نمایش
              </button>

              <button
                type="button"
                onClick={() => setImportSuccessPrompt(null)}
                className="w-full sm:flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#00B87C] dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer text-center"
              >
                ادامه مشاهده
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
