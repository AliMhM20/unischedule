import React, { useState, useMemo, useRef, useEffect, useDeferredValue } from 'react';
import { Course, DayOfWeek } from '../types/schedule';
import { 
  X, Upload, FileText, Search, BookOpen, AlertCircle, 
  CheckCircle2, User, Trash2, Building2, Sparkles, GraduationCap, Check, ArrowRight,
  Plus, ShieldAlert, Eye, EyeOff, CheckSquare, Square, MinusSquare, RotateCw,
  Clock, AlertTriangle, SlidersHorizontal, Calendar
} from 'lucide-react';
import { parseUniversityHtml, SUPPORTED_UNIVERSITIES, UniversityId, detectUniversity } from '../utils/parsers';
import { saveFreshCatalogSource, appendCatalogSource, getCatalogSources, getCatalogSourcesCount, clearCatalogSources } from '../utils/catalogStorage';
import { validateCourse, toPersianDigits, getDayFaName, formatExamDate, getCourseTheme, isSameCourse, checkDuplicateGroupWarning } from '../utils/timeUtils';
import { TimetableGrid } from './TimetableGrid';

// AUT Help Photos
import autImage1 from '../../assets/Help Photos/aut/image1.png';
import autImage2 from '../../assets/Help Photos/aut/image2.png';
import autImage3 from '../../assets/Help Photos/aut/image3.png';
import autImage4 from '../../assets/Help Photos/aut/image4.png';

// KNTU Help Photos
import kntuImage1 from '../../assets/Help Photos/kntu/image1.png';
import kntuImage2 from '../../assets/Help Photos/kntu/image2.png';
import kntuImage3 from '../../assets/Help Photos/kntu/image3.png';
import kntuImage4 from '../../assets/Help Photos/kntu/image4.png';
import kntuImage5 from '../../assets/Help Photos/kntu/image5.png';

// IUT Help Photos
import iutImage1 from '../../assets/Help Photos/iut/image1.png';
import iutImage2 from '../../assets/Help Photos/iut/image2.png';
import iutImage3 from '../../assets/Help Photos/iut/image3.png';
import iutImage4 from '../../assets/Help Photos/iut/image4.png';
import iutImage5 from '../../assets/Help Photos/iut/image5.png';

// NIT Help Photos
import nitImage1 from '../../assets/Help Photos/nit/image1.png';
import nitImage2 from '../../assets/Help Photos/nit/image2.png';
import nitImage3 from '../../assets/Help Photos/nit/image3.png';
import nitImage4 from '../../assets/Help Photos/nit/image4.png';
import nitImage5 from '../../assets/Help Photos/nit/image5.png';

import { GenderBadge } from './GenderBadge';
import { ConfirmModal, ConfirmModalConfig } from './ConfirmModal';

interface CourseCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCourse: (course: Course) => void;
  onRemoveCourse: (courseId: string) => void;
  onReplaceCourse?: (courseToAdd: Course, conflictingCourseIds: string[]) => void;
  existingCourses: Course[];
  catalogCourses: Course[];
  setCatalogCourses: (courses: Course[]) => void;
  studentInfo: { name?: string; id?: string; universityName?: string; universityId?: UniversityId } | null;
  setStudentInfo: (info: { name?: string; id?: string; universityName?: string; universityId?: UniversityId } | null) => void;
  initialFilterSlot?: { day: DayOfWeek; startTime: string; endTime: string } | null;
  showFriday?: boolean;
  onToggleFriday?: () => void;
  onEditCourse?: (course: Course) => void;
}

// Function to generate a deterministic unique key for a course (for deduplication / Set behavior)
const getCourseSignature = (c: Course): string => {
  const code = (c.code || '').trim();
  const name = (c.name || '').trim();
  const instructor = (c.instructor || '').trim();
  const credits = c.credits || 0;
  const faculty = (c.faculty || '').trim();
  const gender = c.gender || 'unspecified';
  const sessions = (c.sessions || [])
    .map(s => `${s.day}:${s.startTime}-${s.endTime}`)
    .sort()
    .join('|');
  const exam = c.exam ? `${c.exam.date}:${c.exam.startTime}-${c.exam.endTime}` : 'no-exam';
  return `${code}__${name}__${instructor}__${credits}__${faculty}__${gender}__${sessions}__${exam}`;
};

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

const TIME_FILTER_HOURS = generateTimeSlots(7, 0, 21, 0);

export const CourseCatalogModal: React.FC<CourseCatalogModalProps> = ({
  isOpen,
  onClose,
  onAddCourse,
  onRemoveCourse,
  onReplaceCourse,
  existingCourses,
  catalogCourses,
  setCatalogCourses,
  studentInfo,
  setStudentInfo,
  initialFilterSlot,
  showFriday,
  onToggleFriday,
  onEditCourse
}) => {
  // Active Tab in Catalog Modal: 'list' (Courses Catalog list) | 'timetable' (Weekly Schedule Timetable)
  const [activeCatalogTab, setActiveCatalogTab] = useState<'list' | 'timetable'>('list');

  // Upload mode: 'none' (browsing), 'replace' (fresh import/replace), 'append' (add more courses to current catalog)
  const [uploadMode, setUploadMode] = useState<'none' | 'replace' | 'append'>('none');
  const [htmlInput, setHtmlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedUniv, setSelectedUniv] = useState<UniversityId>(studentInfo?.universityId || 'aut');
  const [storedSourcesCount, setStoredSourcesCount] = useState<number>(0);
  const [isReloadingSources, setIsReloadingSources] = useState<boolean>(false);
  const [detectedToast, setDetectedToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Selection state for batch operations
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());

  // Visibility filter: 'active' (non-hidden), 'hidden' (only hidden), 'added' (registered in plan), 'all' (all courses)
  const [visibilityFilter, setVisibilityFilter] = useState<'active' | 'hidden' | 'added' | 'all'>('active');

  // University Mismatch Modal Alert
  const [universityMismatchModal, setUniversityMismatchModal] = useState<{
    currentUnivName: string;
    detectedUnivName: string;
  } | null>(null);

  // Dual Personality / Student Identity Conflict Modal
  const [identityConflictModal, setIdentityConflictModal] = useState<{
    currentStudent: { name?: string; id?: string; universityName?: string; universityId?: UniversityId };
    incomingStudent: { name?: string; id?: string; universityName?: string; universityId?: UniversityId };
    selectedChoice: 'current' | 'incoming';
  } | null>(null);

  // In-App Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig | null>(null);

  // Note Viewer Modal State for catalog course notes
  const [viewingNoteModal, setViewingNoteModal] = useState<{ courseName: string; note: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [examFilter, setExamFilter] = useState<'all' | 'has_exam' | 'no_exam'>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'mixed' | 'men' | 'women'>('all');

  // Time Range Filter
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
  const [timeFilterStart, setTimeFilterStart] = useState<string>('07:00');
  const [timeFilterEnd, setTimeFilterEnd] = useState<string>('20:00');
  const [isTimeFilterActive, setIsTimeFilterActive] = useState<boolean>(false);
  const [timeFilterError, setTimeFilterError] = useState<string | null>(null);

  // Storage keys for persisting catalog filter checkboxes
  const HIDE_CONFLICTING_KEY = 'unischedule_catalog_hide_conflicting';
  const HIDE_WARNING_KEY = 'unischedule_catalog_hide_warning';

  // Quick Checkboxes to hide conflicting and warning courses (Persisted in localStorage)
  const [hideConflictingCourses, setHideConflictingCourses] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HIDE_CONFLICTING_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [hideWarningCourses, setHideWarningCourses] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HIDE_WARNING_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Auto-apply initial filter slot if opened from Timetable Gap selection
  useEffect(() => {
    if (isOpen && initialFilterSlot) {
      setSelectedDay(initialFilterSlot.day);
      setTimeFilterStart(initialFilterSlot.startTime);
      setTimeFilterEnd(initialFilterSlot.endTime);
      setIsTimeFilterActive(true);
      setTimeFilterError(null);
      setHideConflictingCourses(true);
      try {
        localStorage.setItem(HIDE_CONFLICTING_KEY, 'true');
      } catch {
        // ignore
      }
    }
  }, [isOpen, initialFilterSlot]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCatalog = catalogCourses.length > 0;
  const isImportViewOpen = !hasCatalog || uploadMode !== 'none';
  const isAppendMode = uploadMode === 'append';

  // Active university for parser & guides
  const activeUniversityId: UniversityId = hasCatalog 
    ? (studentInfo?.universityId || selectedUniv) 
    : selectedUniv;

  const currentUnivObj = useMemo(() => {
    return SUPPORTED_UNIVERSITIES.find(u => u.id === (isAppendMode ? activeUniversityId : selectedUniv)) || SUPPORTED_UNIVERSITIES[0];
  }, [selectedUniv, activeUniversityId, isAppendMode]);

  // Consolidated Map for Course Metadata & Conflicts (Single O(N) pass for all catalog courses)
  const courseValidationMap = useMemo(() => {
    const map = new Map<string, {
      isAdded: boolean;
      hasConflict: boolean;
      conflicts: ReturnType<typeof validateCourse>['conflicts'];
      hasDuplicateWarning: boolean;
      isEffectivelyHidden: boolean;
      effectiveNote?: string;
    }>();

    let conflictCount = 0;
    let warningCount = 0;
    let addedCountVal = 0;
    let hiddenCountVal = 0;

    for (const course of catalogCourses) {
      const matchedExistingCourse = existingCourses.find(c => isSameCourse(course, c));
      const isAdded = Boolean(matchedExistingCourse);
      if (isAdded) addedCountVal++;

      // Effective note: matched existing course edited note takes priority, otherwise course note from Behestan
      const effectiveNote = (matchedExistingCourse?.notes && matchedExistingCourse.notes.trim().length > 0)
        ? matchedExistingCourse.notes.trim()
        : (course.notes && course.notes.trim().length > 0 ? course.notes.trim() : undefined);

      const otherExistingCourses = matchedExistingCourse 
        ? existingCourses.filter(c => c.id !== matchedExistingCourse.id) 
        : existingCourses;

      const { hasConflict, conflicts } = isAdded 
        ? { hasConflict: false, conflicts: [] } 
        : validateCourse(course, otherExistingCourses);

      const hasDuplicateWarning = !isAdded && checkDuplicateGroupWarning(course, existingCourses);

      if (!isAdded) {
        if (hasConflict) conflictCount++;
        if (hasDuplicateWarning) warningCount++;
      }

      // Determine isEffectivelyHidden
      let isEffectivelyHidden = false;
      if (course.isHidden) {
        isEffectivelyHidden = true;
      } else if (!isAdded) {
        if (hideConflictingCourses && hasConflict) {
          isEffectivelyHidden = true;
        } else if (hideWarningCourses && hasDuplicateWarning) {
          isEffectivelyHidden = true;
        }
      }

      if (isEffectivelyHidden) {
        hiddenCountVal++;
      }

      map.set(course.id, {
        isAdded,
        hasConflict,
        conflicts,
        hasDuplicateWarning,
        isEffectivelyHidden,
        effectiveNote
      });
    }

    return {
      map,
      conflictCount,
      warningCount,
      addedCount: addedCountVal,
      hiddenCount: hiddenCountVal,
      activeCount: catalogCourses.length - hiddenCountVal
    };
  }, [catalogCourses, existingCourses, hideConflictingCourses, hideWarningCourses]);

  const isCourseEffectivelyHidden = (course: Course): boolean => {
    return courseValidationMap.map.get(course.id)?.isEffectivelyHidden ?? false;
  };

  const hiddenCount = courseValidationMap.hiddenCount;
  const activeCount = courseValidationMap.activeCount;
  const addedCount = courseValidationMap.addedCount;
  const conflictingCoursesCount = courseValidationMap.conflictCount;
  const warningCoursesCount = courseValidationMap.warningCount;

  // Extract unique faculties if present
  const availableFaculties = useMemo(() => {
    const set = new Set<string>();
    catalogCourses.forEach(c => {
      if (c.faculty) set.add(c.faculty);
    });
    return Array.from(set);
  }, [catalogCourses]);

  // Sync stored raw HTML sources count
  useEffect(() => {
    if (isOpen) {
      getCatalogSourcesCount(activeUniversityId).then(count => {
        setStoredSourcesCount(count);
      }).catch(err => {
        console.warn('Failed to get catalog sources count', err);
      });
    }
  }, [isOpen, activeUniversityId]);

  const handleProcessHtml = (htmlContent: string) => {
    try {
      if (!htmlContent || !htmlContent.trim()) {
        setError('لطفاً محتوای فایل یا کد HTML را وارد کنید.');
        return;
      }

      // Auto-detect university from HTML
      const detectedUniv = detectUniversity(htmlContent);

      if (isAppendMode && hasCatalog) {
        // === APPEND MODE: Strict University Match Check ===
        const currentId = activeUniversityId;
        if (detectedUniv && detectedUniv !== currentId) {
          const currentUniv = SUPPORTED_UNIVERSITIES.find(u => u.id === currentId)?.name || 'دانشگاه فعلی';
          const incomingUniv = SUPPORTED_UNIVERSITIES.find(u => u.id === detectedUniv)?.name || 'دانشگاه دیگر';
          setUniversityMismatchModal({
            currentUnivName: currentUniv,
            detectedUnivName: incomingUniv
          });
          return;
        }

        // Parse with current university driver
        const result = parseUniversityHtml(htmlContent, currentId);
        if (result.courses.length === 0) {
          setError('هیچ درسی در فایل جدید یافت نشد. لطفاً مطمئن شوید فایل خروجی جدول گزارش ' + toPersianDigits(currentUnivObj.reportCode) + ' را انتخاب کرده‌اید.');
          return;
        }

        // Deduplicate using Course Signatures (Set behavior)
        const existingSignatures = new Set(catalogCourses.map(getCourseSignature));
        const newCoursesToAdd = result.courses.filter(c => !existingSignatures.has(getCourseSignature(c)));

        if (newCoursesToAdd.length > 0) {
          setCatalogCourses([...catalogCourses, ...newCoursesToAdd]);
          setDetectedToast(`تعداد ${toPersianDigits(newCoursesToAdd.length)} درس جدید با موفقیت به بانک دروس اضافه شد.`);
        } else {
          setDetectedToast('هیچ درس جدیدی اضافه نشد (تمام دروس فایل انتخابی قبلاً در بانک دروس موجود بودند).');
        }

        // Save raw HTML to stored sources
        appendCatalogSource(currentId, htmlContent).then(() => {
          setStoredSourcesCount(prev => prev + 1);
        }).catch(e => console.warn('Could not store source', e));

        // Check for different student identity in AUT or similar portals (Dual Personality Easter Egg)
        const hasDifferentIdentity = 
          (result.studentName && studentInfo?.name && result.studentName.trim() !== studentInfo.name.trim()) ||
          (result.studentId && studentInfo?.id && result.studentId.trim() !== studentInfo.id.trim());

        if (hasDifferentIdentity && (result.studentName || result.studentId)) {
          setIdentityConflictModal({
            currentStudent: {
              name: studentInfo?.name,
              id: studentInfo?.id,
              universityName: studentInfo?.universityName || result.universityName,
              universityId: studentInfo?.universityId || result.universityId,
            },
            incomingStudent: {
              name: result.studentName,
              id: result.studentId,
              universityName: result.universityName || studentInfo?.universityName,
              universityId: result.universityId || studentInfo?.universityId,
            },
            selectedChoice: 'incoming',
          });
        }

        setTimeout(() => setDetectedToast(null), 4500);
        setError(null);
        setHtmlInput('');
        setUploadMode('none');

      } else {
        // === FRESH / REPLACE MODE ===
        const activeUniv: UniversityId = detectedUniv || selectedUniv;

        if (detectedUniv) {
          setSelectedUniv(detectedUniv);
          const univObj = SUPPORTED_UNIVERSITIES.find(u => u.id === detectedUniv);
          setDetectedToast(`سامانه ${univObj?.name || ''} به صورت خودکار شناسایی شد.`);
          setTimeout(() => setDetectedToast(null), 4000);
        }

        const result = parseUniversityHtml(htmlContent, activeUniv);
        if (result.courses.length === 0) {
          setError('هیچ درسی در فایل یافت نشد. لطفاً مطمئن شوید فایل خروجی نمایش جدولی را به درستی انتخاب کرده‌اید.');
          return;
        }

        // Save fresh source to storage
        saveFreshCatalogSource(activeUniv, htmlContent).then(() => {
          setStoredSourcesCount(1);
        }).catch(e => console.warn('Could not store source', e));

        // Deduplicate parsed courses using getCourseSignature
        const uniqueMap = new Map<string, Course>();
        for (const c of result.courses) {
          const sig = getCourseSignature(c);
          if (!uniqueMap.has(sig)) {
            uniqueMap.set(sig, c);
          }
        }
        const deduplicatedCourses = Array.from(uniqueMap.values());

        setCatalogCourses(deduplicatedCourses);
        setStudentInfo({
          name: result.studentName,
          id: result.studentId,
          universityName: result.universityName,
          universityId: result.universityId
        });

        setDetectedToast(`تعداد ${toPersianDigits(deduplicatedCourses.length)} درس با موفقیت بارگذاری شد.`);
        setTimeout(() => setDetectedToast(null), 4000);

        setError(null);
        setHtmlInput('');
        setSelectedCourseIds(new Set());
        setUploadMode('none');
      }

    } catch (err) {
      setError('خطا در پردازش فایل. لطفاً فایل جدول معتبر انتخاب کنید.');
      console.error(err);
    }
  };

  // Reload catalog from all stored raw HTML sources
  const handleReloadCatalogFromSources = async () => {
    try {
      setIsReloadingSources(true);
      const targetUniv = hasCatalog ? activeUniversityId : selectedUniv;
      const sources = await getCatalogSources(targetUniv);

      if (sources.length === 0) {
        setDetectedToast('هیچ منبع فایلی برای بارگذاری مجدد در حافظه یافت نشد.');
        setTimeout(() => setDetectedToast(null), 3500);
        return;
      }

      let allCourses: Course[] = [];
      const existingSignatures = new Set<string>();
      let latestStudent: { name?: string; id?: string; universityName?: string; universityId?: UniversityId } | null = null;

      for (const src of sources) {
        const parsed = parseUniversityHtml(src.rawHtml, src.universityId);
        if (parsed.studentName || parsed.studentId) {
          latestStudent = {
            name: parsed.studentName,
            id: parsed.studentId,
            universityName: parsed.universityName,
            universityId: parsed.universityId,
          };
        }
        for (const course of parsed.courses) {
          const sig = getCourseSignature(course);
          if (!existingSignatures.has(sig)) {
            existingSignatures.add(sig);
            // Reset hide status on reload
            allCourses.push({ ...course, isHidden: false });
          }
        }
      }

      if (allCourses.length === 0) {
        setError('خطا در پردازش فایل‌های ذخیره‌شده.');
        return;
      }

      setCatalogCourses(allCourses);
      if (latestStudent) {
        setStudentInfo(latestStudent);
      }
      setSelectedCourseIds(new Set());
      setUploadMode('none');
      setError(null);
      setDetectedToast(
        `تعداد ${toPersianDigits(allCourses.length)} درس از روی ${toPersianDigits(sources.length)} فایل ذخیره‌شده با موفقیت بارگذاری مجدد شدند.`
      );
      setTimeout(() => setDetectedToast(null), 4000);
    } catch (err) {
      console.error('Failed to reload catalog from sources', err);
      setError('خطا در بازیابی مجدد فایل‌ها از حافظه.');
    } finally {
      setIsReloadingSources(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleProcessHtml(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isHtml = 
      file.name.toLowerCase().endsWith('.html') || 
      file.name.toLowerCase().endsWith('.htm') || 
      file.type.includes('html') || 
      file.type.includes('text');

    if (!isHtml) {
      setError('فرمت فایل نامعتبر است. لطفاً فقط فایل ذخیره شده با پسوند html. یا htm. را بارگذاری کنید.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleProcessHtml(content);
      }
    };
    reader.readAsText(file);
  };

  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Filter courses (using cached validation meta for instant O(1) checks)
  const filteredCourses = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase().trim();

    return catalogCourses.filter(course => {
      const meta = courseValidationMap.map.get(course.id);
      const isAdded = meta?.isAdded ?? false;
      const effectivelyHidden = meta?.isEffectivelyHidden ?? false;

      // Dynamic Visibility Filter (Active, Hidden, Added, All)
      if (visibilityFilter === 'active' && effectivelyHidden) return false;
      if (visibilityFilter === 'hidden' && !effectivelyHidden) return false;
      if (visibilityFilter === 'added' && !isAdded) return false;

      // Search query
      if (q) {
        const matchesSearch = 
          course.name.toLowerCase().includes(q) || 
          (course.code && course.code.toLowerCase().includes(q)) ||
          (course.instructor && course.instructor.toLowerCase().includes(q)) ||
          (course.faculty && course.faculty.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Gender filter
      if (genderFilter !== 'all' && course.gender !== genderFilter) return false;

      // Day filter
      if (selectedDay !== 'all' && !course.sessions.some(s => s.day === selectedDay)) return false;

      // Exam filter
      if (examFilter === 'has_exam' && !course.exam) return false;
      if (examFilter === 'no_exam' && course.exam) return false;

      // Units filter
      if (unitFilter !== 'all' && course.credits !== parseInt(unitFilter, 10)) return false;

      // Faculty filter
      if (selectedFaculty !== 'all' && course.faculty !== selectedFaculty) return false;

      // Time Range filter
      if (isTimeFilterActive) {
        if (!course.sessions || course.sessions.length === 0) return false;
        const allSessionsInside = course.sessions.every(s => {
          const sStart = (s.startTime || '').padStart(5, '0');
          const sEnd = (s.endTime || '').padStart(5, '0');
          return sStart >= timeFilterStart && sEnd <= timeFilterEnd;
        });
        if (!allSessionsInside) return false;
      }

      return true;
    });
  }, [
    catalogCourses, 
    courseValidationMap,
    visibilityFilter, 
    deferredSearchQuery, 
    selectedDay, 
    examFilter, 
    unitFilter, 
    selectedFaculty,
    genderFilter,
    isTimeFilterActive,
    timeFilterStart,
    timeFilterEnd
  ]);

  // Progressive Chunked Rendering (Virtual Pagination for extreme speed)
  const CHUNK_SIZE = 200;
  const [visibleLimit, setVisibleLimit] = useState<number>(CHUNK_SIZE);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Reset visible limit to CHUNK_SIZE whenever search or filters change
  useEffect(() => {
    setVisibleLimit(CHUNK_SIZE);
  }, [deferredSearchQuery, selectedDay, examFilter, unitFilter, selectedFaculty, genderFilter, visibilityFilter, isTimeFilterActive, timeFilterStart, timeFilterEnd, hideConflictingCourses, hideWarningCourses]);

  const displayedCourses = useMemo(() => {
    return filteredCourses.slice(0, visibleLimit);
  }, [filteredCourses, visibleLimit]);

  // Load next chunk handler
  const loadNextChunk = () => {
    setVisibleLimit((prev) => {
      if (prev < filteredCourses.length) {
        return Math.min(prev + CHUNK_SIZE, filteredCourses.length);
      }
      return prev;
    });
  };

  // Automatic Infinite Scroll loading with IntersectionObserver
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextChunk();
        }
      },
      { 
        root: modalBodyRef.current,
        rootMargin: '600px', // Pre-load 600px ahead before reaching bottom
        threshold: 0
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleLimit, filteredCourses.length]);

  // Backup scroll event listener for seamless automatic loading
  const handleModalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 700) {
      loadNextChunk();
    }
  };

  // Checkbox Toggle Handlers (Persist state to localStorage)
  const handleToggleHideConflicting = (checked: boolean) => {
    setHideConflictingCourses(checked);
    try {
      localStorage.setItem(HIDE_CONFLICTING_KEY, checked ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const handleToggleHideWarnings = (checked: boolean) => {
    setHideWarningCourses(checked);
    try {
      localStorage.setItem(HIDE_WARNING_KEY, checked ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  // Single Course Actions
  const handleToggleHideSingleCourse = (courseId: string) => {
    const updated = catalogCourses.map(c => {
      if (c.id === courseId) {
        return { ...c, isHidden: !c.isHidden };
      }
      return c;
    });
    setCatalogCourses(updated);
  };

  const handleDeleteSingleCourse = (courseId: string) => {
    const target = catalogCourses.find(c => c.id === courseId);
    if (!target) return;
    setConfirmModal({
      isOpen: true,
      title: 'حذف درس از بانک دروس',
      message: `آیا از حذف درس «${target.name}» از بانک دروس اطمینان دارید؟`,
      confirmText: 'حذف از بانک دروس',
      cancelText: 'انصراف',
      variant: 'danger',
      onConfirm: () => {
        setCatalogCourses(catalogCourses.filter(c => c.id !== courseId));
        setSelectedCourseIds(prev => {
          const next = new Set(prev);
          next.delete(courseId);
          return next;
        });
        setDetectedToast(`درس «${target.name}» از بانک دروس حذف شد.`);
        setTimeout(() => setDetectedToast(null), 3000);
      },
    });
  };

  // Selection Handlers
  const handleToggleSelectCourse = (courseId: string) => {
    setSelectedCourseIds(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const isAllFilteredSelected = useMemo(() => {
    if (filteredCourses.length === 0) return false;
    return filteredCourses.every(c => selectedCourseIds.has(c.id));
  }, [filteredCourses, selectedCourseIds]);

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect all currently filtered
      setSelectedCourseIds(prev => {
        const next = new Set(prev);
        filteredCourses.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      // Select all currently filtered
      setSelectedCourseIds(prev => {
        const next = new Set(prev);
        filteredCourses.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  // Batch Actions
  const handleBatchHide = (hide: boolean) => {
    if (selectedCourseIds.size === 0) return;
    const count = selectedCourseIds.size;
    const updated = catalogCourses.map(c => {
      if (selectedCourseIds.has(c.id)) {
        return { ...c, isHidden: hide };
      }
      return c;
    });
    setCatalogCourses(updated);
    setSelectedCourseIds(new Set());
    setDetectedToast(
      hide 
        ? `تعداد ${toPersianDigits(count)} درس پنهان شدند.`
        : `تعداد ${toPersianDigits(count)} درس آشکار شدند.`
    );
    setTimeout(() => setDetectedToast(null), 3500);
  };

  const handleBatchDelete = () => {
    if (selectedCourseIds.size === 0) return;
    const count = selectedCourseIds.size;
    setConfirmModal({
      isOpen: true,
      title: 'حذف گروهی دروس',
      message: `آیا از حذف ${toPersianDigits(count)} درس انتخاب‌شده از بانک دروس اطمینان دارید؟`,
      confirmText: 'بله، حذف کن',
      cancelText: 'انصراف',
      variant: 'danger',
      onConfirm: () => {
        const updated = catalogCourses.filter(c => !selectedCourseIds.has(c.id));
        setCatalogCourses(updated);
        setSelectedCourseIds(new Set());
        setDetectedToast(`تعداد ${toPersianDigits(count)} درس از بانک دروس حذف شدند.`);
        setTimeout(() => setDetectedToast(null), 3500);
      },
    });
  };

  // Confirm Identity Choice
  const handleConfirmIdentity = () => {
    if (!identityConflictModal) return;
    const chosen = identityConflictModal.selectedChoice === 'incoming' 
      ? identityConflictModal.incomingStudent 
      : identityConflictModal.currentStudent;
    
    setStudentInfo(chosen);
    setIdentityConflictModal(null);
    setDetectedToast(`هویت نمایشی شما به «${chosen.name || 'دانشجو'}» تغییر یافت.`);
    setTimeout(() => setDetectedToast(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-xs transition-opacity" 
      dir="rtl"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <div className="bg-white dark:bg-[#131416] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-7xl 2xl:max-w-[1500px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-[#2a2b30] relative">
        
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-[#1c1d21] bg-white dark:bg-[#131416] shrink-0">
          {/* Right Side: Title & University Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-emerald-950/40 text-indigo-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-emerald-800/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100">
                  بانک دروس ارائه شده
                </h2>
                <span className="bg-indigo-100 dark:bg-emerald-900/40 text-indigo-700 dark:text-emerald-300 text-[11px] px-2 py-0.5 rounded-full font-black border border-indigo-200 dark:border-emerald-800/40">
                  BETA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>پورتال آموزشی دانشگاه</span>
                {studentInfo?.universityName && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-indigo-600 dark:text-emerald-400">{studentInfo.universityName}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Left Side: Prominent Tab Bar & Close Button */}
          <div className="flex items-center gap-2 sm:gap-3 mr-auto">
            {hasCatalog && !isImportViewOpen && (
              <div className="flex items-center bg-slate-100 dark:bg-[#1a1c23] p-1 sm:p-1.5 rounded-2xl border-2 border-indigo-100 dark:border-emerald-950/60 shadow-xs gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveCatalogTab('list')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none ${
                    activeCatalogTab === 'list'
                      ? 'bg-indigo-600 dark:bg-[#00B87C] text-white dark:text-black shadow-md shadow-indigo-500/20 dark:shadow-emerald-500/20 ring-2 ring-indigo-600/30 dark:ring-emerald-400/30 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-emerald-300 hover:bg-white/80 dark:hover:bg-[#25262c]'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>فهرست دروس</span>
                  <span className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.2 rounded-full font-black ${
                    activeCatalogTab === 'list'
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {toPersianDigits(filteredCourses.length)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCatalogTab('timetable')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none ${
                    activeCatalogTab === 'timetable'
                      ? 'bg-indigo-600 dark:bg-[#00B87C] text-white dark:text-black shadow-md shadow-indigo-500/20 dark:shadow-emerald-500/20 ring-2 ring-indigo-600/30 dark:ring-emerald-400/30 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-emerald-300 hover:bg-white/80 dark:hover:bg-[#25262c]'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>جدول هفتگی</span>
                  <span className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.2 rounded-full font-black ${
                    activeCatalogTab === 'timetable'
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {toPersianDigits(existingCourses.length)}
                  </span>
                </button>
              </div>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-[#2a2b30] hidden sm:block" />

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c1d21] rounded-xl transition-colors cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast / Feedback Banner */}
        {detectedToast && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 px-6 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in slide-in-from-top duration-200">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{detectedToast}</span>
          </div>
        )}

        {/* Modal Body */}
        <div ref={modalBodyRef} onScroll={handleModalScroll} className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0b0c0e]">
          
          {isImportViewOpen ? (
            /* ================= STATE 1: UPLOAD / APPEND / REPLACE ================= */
            <div className="p-6 sm:p-10 max-w-2xl mx-auto space-y-7">
              
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-emerald-950/40 text-indigo-600 dark:text-emerald-400 text-xs font-bold border border-indigo-100 dark:border-emerald-800/30 mb-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{isAppendMode ? 'افزودن دروس بیشتر به بانک فعلی' : 'انتخاب دانشگاه و بارگذاری کاتالوگ'}</span>
                </div>
                
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                  {isAppendMode ? 'افزودن فایل و دروس جدید به بانک دروس' : 'دروس خود را خودکار وارد کنید'}
                </h3>
                
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
                  {isAppendMode 
                    ? `فایل HTML جدید گزارش ${toPersianDigits(currentUnivObj.reportCode)} (مثلاً دانشکده یا گروه آموزشی دیگر) را وارد کنید تا به ${toPersianDigits(catalogCourses.length)} درس قبلی اضافه شود.`
                    : `فایل HTML گزارش ${toPersianDigits(currentUnivObj.reportCode)} (نمایش جدولی) را از سامانه بهستان دریافت کرده و در اینجا قرار دهید.`
                  }
                </p>
              </div>

              {hasCatalog && (
                <button
                  onClick={() => {
                    setUploadMode('none');
                    setError(null);
                    setHtmlInput('');
                    setIsDragging(false);
                  }}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به لیست دروس (انصراف)</span>
                </button>
              )}

              {/* Restore Stored Sources Banner (if catalog is empty but sources exist) */}
              {!isAppendMode && !hasCatalog && storedSourcesCount > 0 && (
                <div className="bg-indigo-50/90 dark:bg-emerald-950/40 border border-indigo-200 dark:border-emerald-800/60 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3.5 text-right">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <RotateCw className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 block">
                        تعداد {toPersianDigits(storedSourcesCount)} فایل HTML از قبل در حافظه ذخیره است
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 block mt-0.5 leading-relaxed">
                        می‌توانید بدون نیاز به بارگذاری مجدد فایل‌ها، بانک دروس را از منابع قبلی بازیابی کنید.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReloadCatalogFromSources}
                    disabled={isReloadingSources}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer active:scale-95"
                  >
                    <RotateCw className={`w-4 h-4 ${isReloadingSources ? 'animate-spin' : ''}`} />
                    <span>بازیابی و بارگذاری مجدد دروس</span>
                  </button>
                </div>
              )}

              {/* University Selector (Only displayed in Fresh / Replace mode) */}
              {!isAppendMode ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    دانشگاه خود را انتخاب کنید:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUPPORTED_UNIVERSITIES.map((univ) => {
                      const isSelected = selectedUniv === univ.id;
                      return (
                        <button
                          key={univ.id}
                          type="button"
                          onClick={() => setSelectedUniv(univ.id)}
                          className={`p-4 rounded-2xl border text-right transition-all flex items-start justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-white dark:bg-[#1c1d21] border-indigo-600 dark:border-emerald-500 shadow-md ring-2 ring-indigo-500/20 dark:ring-emerald-500/20'
                              : 'bg-white/60 dark:bg-[#131416]/60 border-slate-200 dark:border-[#2a2b30] hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 block">
                              {univ.name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                              {univ.portalName}
                            </span>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                            isSelected 
                              ? 'bg-indigo-600 dark:bg-emerald-500 border-indigo-600 dark:border-emerald-500 text-white dark:text-black' 
                              : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Append Mode: Locked university badge */
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-emerald-950/30 border border-indigo-200/80 dark:border-emerald-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-emerald-400" />
                    <div>
                      <span className="text-xs font-black text-indigo-950 dark:text-emerald-200 block">
                        دانشگاه فعال: {currentUnivObj.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        دروس جدید به {toPersianDigits(catalogCourses.length)} درس موجود اضافه خواهند شد
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual Guide Accordion */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl overflow-hidden text-sm transition-all">
                <details className="group">
                  <summary className="font-bold text-blue-900 dark:text-blue-300 p-4 cursor-pointer flex items-center justify-between list-none select-none">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>راهنمای دریافت فایل از سامانه بهستان از طریق کامپیوتر شخصی</span>
                    </div>
                    <div className="text-blue-500 group-open:rotate-180 transition-transform shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </summary>
                  <div className="px-5 pb-5 pt-1 border-t border-blue-100/60 dark:border-blue-900/30 space-y-6 text-blue-900 dark:text-blue-200 text-xs sm:text-sm">
                    
                    {/* AUT SPECIFIC GUIDE */}
                    {currentUnivObj.id === 'aut' && (
                      <div className="space-y-6 animate-in fade-in duration-150">
                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۱. وارد پورتال آموزشی بهستان (امیرکبیر) شوید.</p>
                          <p className="leading-relaxed font-medium">۲. در قسمت جست و جو، کد <strong>212</strong> را وارد کنید و <strong>Enter</strong> بزنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={autImage1} alt="جستجوی فرم ۲۱۲" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۳. در پنجره جدید لیست دروس خود را مشاهده میکنید. پایین لیست روی دکمه <strong>"نمایش جدولی"</strong> کلیک کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={autImage2} alt="دکمه نمایش جدولی" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۴. روی صفحه جدید باز شده راست کلیک کنید و گزینه <strong>"inspect"</strong> را انتخاب کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={autImage3} alt="Inspect صفحه" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۵. در صفحه جدید کد html ای مشاهده میکنید. روی خط اول کد ( <strong>&lt;html&gt;</strong> ) راست کلیک کنید و در قسمت <strong>Copy</strong>، روی <strong>Copy outerHTML</strong> کلیک کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={autImage4} alt="کپی outerHTML" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="bg-blue-100/70 dark:bg-blue-900/40 p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-800/60 text-sm sm:text-[15px] leading-relaxed sm:leading-7 font-medium text-blue-950 dark:text-blue-100 space-y-2">
                          <p>
                            ۶. کد html درون کلیپ بورد شما کپی شده. میتوانید کد را مستقیما درون قسمت مشخص شده paste کنید و یا میتوانید درون کامپیوتر خود فایل تکست ساخته و محتوای کد را درون آن paste کرده و در آخر فایل را با پسوند <strong>html.</strong> ذخیره کنید و فایل ساخته شده را در قسمت مشخص شده آپلود کنید.
                          </p>
                          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 font-bold">
                            (از مرورگرهای Microsoft Edge/Google Chrome برای وارد شدن به پورتال اموزشی استفاده کنید. مشکلاتی در حین استفاده از مرورگر Mozilla Firefox گزارش شده.)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* KNTU SPECIFIC GUIDE */}
                    {currentUnivObj.id === 'kntu' && (
                      <div className="space-y-6 animate-in fade-in duration-150">
                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۱. وارد پورتال آموزشی بهستان (خواجه نصیرالدین طوسی) شوید.</p>
                          <p className="leading-relaxed font-medium">۲. در قسمت جست و جو، کد <strong>102</strong> را وارد کنید و <strong>Enter</strong> بزنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={kntuImage1} alt="جستجوی فرم ۱۰۲" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۳. فیلترهای مدنظر برای دروس مدنظر را انتخاب کرده و در آخر روی دکمه <strong>"مشاهده گزارش"</strong> بزنید</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={kntuImage2} alt="مشاهده گزارش ۱۰۲" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۴. در پنجره جدید لیست دروس خود را مشاهده میکنید. پایین لیست روی دکمه <strong>"نمایش جدولی"</strong> کلیک کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={kntuImage3} alt="دکمه نمایش جدولی خواجه نصیر" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۵. روی صفحه جدید باز شده راست کلیک کنید و گزینه <strong>"inspect"</strong> را انتخاب کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={kntuImage4} alt="Inspect صفحه خواجه نصیر" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۶. در صفحه جدید کد html ای مشاهده میکنید. روی خط اول کد ( <strong>&lt;html&gt;</strong> ) راست کلیک کنید و در قسمت <strong>Copy</strong>، روی <strong>Copy outerHTML</strong> کلیک کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={kntuImage5} alt="کپی outerHTML خواجه نصیر" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="bg-blue-100/70 dark:bg-blue-900/40 p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-800/60 text-sm sm:text-[15px] leading-relaxed sm:leading-7 font-medium text-blue-950 dark:text-blue-100 space-y-2">
                          <p>
                            ۷. کد html درون کلیپ بورد شما کپی شده. میتوانید کد را مستقیما درون قسمت مشخص شده paste کنید و یا میتوانید درون کامپیوتر خود فایل تکست ساخته و محتوای کد را درون آن paste کرده و در آخر فایل را با پسوند <strong>html.</strong> ذخیره کنید و فایل ساخته شده را در قسمت مشخص شده آپلود کنید.
                          </p>
                          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 font-bold">
                            (از مرورگرهای Microsoft Edge/Google Chrome برای وارد شدن به پورتال اموزشی استفاده کنید. مشکلاتی در حین استفاده از مرورگر Mozilla Firefox گزارش شده.)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* IUT SPECIFIC GUIDE */}
                    {currentUnivObj.id === 'iut' && (
                      <div className="space-y-6 animate-in fade-in duration-150">
                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۱. وارد پورتال آموزشی بهستان (صنعتی اصفهان) شوید.</p>
                          <p className="leading-relaxed font-medium">۲. در قسمت جست و جو، کد <strong>110</strong> را وارد کنید و <strong>Enter</strong> بزنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={iutImage1} alt="جستجوی فرم ۱۱۰" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۳. فیلترهای مدنظر برای دروس مدنظر را انتخاب کرده و در آخر روی دکمه <strong>"مشاهده گزارش"</strong> بزنید</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50">
                            (نکته مهم: فیلتر "نمایش اطلاعات امتحان" را روی «بله» قرار دهید)
                          </p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={iutImage2} alt="مشاهده گزارش ۱۱۰" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۴. در پنجره جدید لیست دروس خود را مشاهده میکنید. پایین لیست روی دکمه <strong>"نمایش جدولی"</strong> کلیک کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={iutImage3} alt="دکمه نمایش جدولی صنعتی اصفهان" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۵. روی صفحه جدید باز شده راست کلیک کنید و گزینه <strong>"inspect"</strong> را انتخاب کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={iutImage4} alt="Inspect صفحه صنعتی اصفهان" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۶. در صفحه جدید کد html ای مشاهده میکنید. روی خط اول کد ( <strong>&lt;html&gt;</strong> ) راست کلیک کنید و در قسمت <strong>Copy</strong>، روی <strong>Copy outerHTML</strong> کلیک کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={iutImage5} alt="کپی outerHTML صنعتی اصفهان" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="bg-blue-100/70 dark:bg-blue-900/40 p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-800/60 text-sm sm:text-[15px] leading-relaxed sm:leading-7 font-medium text-blue-950 dark:text-blue-100 space-y-2">
                          <p>
                            ۷. کد html درون کلیپ بورد شما کپی شده. میتوانید کد را مستقیما درون قسمت مشخص شده paste کنید و یا میتوانید درون کامپیوتر خود فایل تکست ساخته و محتوای کد را درون آن paste کرده و در آخر فایل را با پسوند <strong>html.</strong> ذخیره کنید و فایل ساخته شده را در قسمت مشخص شده آپلود کنید.
                          </p>
                          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 font-bold">
                            (از مرورگرهای Microsoft Edge/Google Chrome برای وارد شدن به پورتال اموزشی استفاده کنید. مشکلاتی در حین استفاده از مرورگر Mozilla Firefox گزارش شده.)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* NIT SPECIFIC GUIDE */}
                    {currentUnivObj.id === 'nit' && (
                      <div className="space-y-6 animate-in fade-in duration-150">
                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۱. وارد پورتال آموزشی بهستان (نوشیروانی) شوید.</p>
                          <p className="leading-relaxed font-medium">۲. در قسمت جست و جو، کد <strong>110</strong> را وارد کنید و <strong>Enter</strong> بزنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={nitImage1} alt="جستجوی فرم ۱۱۰ نوشیروانی" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۳. فیلترهای مدنظر برای دروس مدنظر را انتخاب کرده و در آخر روی دکمه <strong>"مشاهده گزارش"</strong> بزنید</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50">
                            (نکته مهم: فیلتر "نمایش اطلاعات امتحان" را روی «بله» قرار دهید)
                          </p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={nitImage2} alt="مشاهده گزارش ۱۱۰ نوشیروانی" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۴. در پنجره جدید لیست دروس خود را مشاهده میکنید. پایین لیست روی دکمه <strong>"نمایش جدولی"</strong> کلیک کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={nitImage3} alt="دکمه نمایش جدولی نوشیروانی" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۵. روی صفحه جدید باز شده راست کلیک کنید و گزینه <strong>"inspect"</strong> را انتخاب کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={nitImage4} alt="Inspect صفحه نوشیروانی" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="leading-relaxed font-medium">۶. در صفحه جدید کد html ای مشاهده میکنید. روی خط اول کد ( <strong>&lt;html&gt;</strong> ) راست کلیک کنید و در قسمت <strong>Copy</strong>، روی <strong>Copy outerHTML</strong> کلیک کنید.</p>
                          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-xs max-w-lg">
                            <img src={nitImage5} alt="کپی outerHTML نوشیروانی" className="w-full h-auto" />
                          </div>
                        </div>

                        <div className="bg-blue-100/70 dark:bg-blue-900/40 p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-800/60 text-sm sm:text-[15px] leading-relaxed sm:leading-7 font-medium text-blue-950 dark:text-blue-100 space-y-2">
                          <p>
                            ۷. کد html درون کلیپ بورد شما کپی شده. میتوانید کد را مستقیما درون قسمت مشخص شده paste کنید و یا میتوانید درون کامپیوتر خود فایل تکست ساخته و محتوای کد را درون آن paste کرده و در آخر فایل را با پسوند <strong>html.</strong> ذخیره کنید و فایل ساخته شده را در قسمت مشخص شده آپلود کنید.
                          </p>
                          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 font-bold">
                            (از مرورگرهای Microsoft Edge/Google Chrome برای وارد شدن به پورتال اموزشی استفاده کنید. مشکلاتی در حین استفاده از مرورگر Mozilla Firefox گزارش شده.)
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                </details>
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-start gap-2.5 border border-rose-200 dark:border-rose-800/50">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Upload & Paste Inputs */}
              <div className="grid grid-cols-1 gap-4">
                {/* Method 1: File Upload (Supports Drag & Drop + Click) */}
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-all cursor-pointer select-none group ${
                    isDragging
                      ? 'border-indigo-500 dark:border-emerald-400 bg-indigo-50/90 dark:bg-emerald-950/60 ring-4 ring-indigo-500/20 dark:ring-emerald-500/20 scale-[1.01]'
                      : 'border-indigo-200 dark:border-emerald-800/40 bg-white dark:bg-[#131416] hover:bg-indigo-50/50 dark:hover:bg-emerald-950/20 hover:border-indigo-300 dark:hover:border-emerald-700/60'
                  }`}
                >
                  <input 
                    type="file" 
                    accept=".html,.htm" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform ${
                    isDragging
                      ? 'bg-indigo-600 dark:bg-[#00B87C] text-white dark:text-black scale-110 animate-bounce shadow-md'
                      : 'bg-indigo-50 dark:bg-emerald-950/40 text-indigo-600 dark:text-emerald-400 border border-indigo-100 dark:border-emerald-800/40 group-hover:scale-110'
                  }`}>
                    <Upload className="w-7 h-7" />
                  </div>
                  
                  <span className={`font-extrabold text-base transition-colors ${
                    isDragging ? 'text-indigo-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'
                  }`}>
                    {isDragging
                      ? 'فایل HTML را همینجا رها (Drop) کنید...'
                      : isAppendMode 
                        ? 'انتخاب یا رها کردن (Drag & Drop) فایل HTML جدید' 
                        : 'انتخاب یا رها کردن (Drag & Drop) فایل HTML'
                    }
                  </span>
                  
                  <span className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 text-center">
                    {isDragging
                      ? 'برای استخراج و ثبت دروس، فایل را رها کنید'
                      : `فایل ذخیره‌شده جدول گزارش ${toPersianDigits(currentUnivObj.reportCode)} را در این کادر Drag & Drop کنید یا کلیک کنید`
                    }
                  </span>
                </div>

                {/* Method 2: Paste Code */}
                <div className="bg-white dark:bg-[#131416] p-5 rounded-3xl border border-slate-200 dark:border-[#2a2b30] space-y-3">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {isAppendMode ? 'یا کد HTML جدول جدید را در اینجا Paste کنید:' : 'یا کد HTML جدول را مستقیماً اینجا Paste کنید:'}
                  </p>
                  <textarea
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    placeholder="<html dir='rtl'>...</html>"
                    className="w-full h-28 bg-slate-50 dark:bg-[#0b0c0e] border border-slate-200 dark:border-[#2a2b30] rounded-xl p-3 text-left text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500 transition-all resize-none"
                    dir="ltr"
                  />
                  <button
                    onClick={() => handleProcessHtml(htmlInput)}
                    disabled={!htmlInput.trim()}
                    className="w-full py-2.5 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white dark:text-black rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    {isAppendMode ? 'پردازش و افزودن به بانک دروس' : 'پردازش کد وارد شده'}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* ================= STATE 2: BROWSE & QUICK ADD ================= */
            <div className="flex flex-col h-full">
              
              {/* Sticky Top Bar (Tabs, Filters & Info) */}
              <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#131416]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#2a2b30] p-4 sm:p-5 space-y-3.5 shadow-xs">
                
                {/* University Badge & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-emerald-950/30 border border-indigo-100 dark:border-emerald-800/40 px-3 py-1.5 rounded-xl">
                      <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-emerald-400" />
                      <span className="text-xs font-black text-indigo-900 dark:text-emerald-300">
                        {studentInfo?.universityName || currentUnivObj.name}
                      </span>
                    </div>

                    {studentInfo?.name && (
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1c1d21] px-3 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2a2b30]">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-bold">{studentInfo.name}</span>
                        {studentInfo?.id && <span className="opacity-70 font-medium">({toPersianDigits(studentInfo.id)})</span>}
                      </div>
                    )}

                    <div className="text-xs font-extrabold text-slate-500 dark:text-slate-400 px-1">
                      {toPersianDigits(catalogCourses.length)} درس در بانک دروس
                      {hiddenCount > 0 && (
                        <span className="mr-1.5 text-amber-600 dark:text-amber-400 font-bold">
                          ({toPersianDigits(hiddenCount)} پنهان)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons: Add More Courses & Replace Table */}
                  <div className="flex items-center gap-2">
                    {storedSourcesCount > 0 && (
                      <button
                        type="button"
                        onClick={handleReloadCatalogFromSources}
                        disabled={isReloadingSources}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1d21] dark:hover:bg-[#2a2b30] rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-[#2a2b30] shadow-2xs active:scale-95 disabled:opacity-50"
                        title="بارگذاری مجدد تمام فایل‌های ذخیره‌شده و بازنشانی وضعیت دروس"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isReloadingSources ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">بارگذاری مجدد ({toPersianDigits(storedSourcesCount)} فایل)</span>
                        <span className="sm:hidden">بازخوانی ({toPersianDigits(storedSourcesCount)})</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUploadMode('append');
                        setError(null);
                        setHtmlInput('');
                        setIsDragging(false);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-emerald-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 rounded-xl transition-all cursor-pointer border border-indigo-200/80 dark:border-emerald-800/50 shadow-2xs active:scale-95"
                      title="افزودن فایل HTML جدید برای دانشکده یا دروس دیگر"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن دروس بیشتر</span>
                    </button>

                    <button
                      onClick={() => {
                        setUploadMode('replace');
                        setError(null);
                        setHtmlInput('');
                        setIsDragging(false);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1d21] dark:hover:bg-[#2a2b30] rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-[#2a2b30]"
                      title="جایگزینی کامل فایل کاتالوگ"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>تعویض فایل جدول</span>
                    </button>
                  </div>
                </div>

                {/* Filter Controls Row (Only active when in list tab) */}
                {activeCatalogTab === 'list' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
                  
                  {/* Search Box */}
                  <div className="relative sm:col-span-2">
                    <div className={`absolute inset-y-0 right-3 flex items-center pointer-events-none transition-colors ${
                      searchQuery.trim().length > 0
                        ? 'text-indigo-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}>
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجوی نام درس، کد درس، نام استاد یا دانشکده..."
                      className={`w-full h-10 rounded-xl pr-9 pl-8 text-xs font-medium focus:outline-none transition-all ${
                        searchQuery.trim().length > 0
                          ? 'bg-indigo-50/60 dark:bg-emerald-950/30 border border-indigo-300 dark:border-emerald-600 text-indigo-950 dark:text-emerald-100 ring-2 ring-indigo-500/20 dark:ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#0b0c0e] border border-slate-200 dark:border-[#2a2b30] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500'
                      }`}
                    />
                    {searchQuery.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 left-2.5 flex items-center p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="پاک کردن جستجو"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Visibility Filter (Active, Added, Hidden, All) */}
                  <div>
                    <select
                      value={visibilityFilter}
                      onChange={(e) => setVisibilityFilter(e.target.value as any)}
                      className={`w-full h-10 border rounded-xl px-2.5 text-xs font-bold focus:outline-none transition-all ${
                        visibilityFilter === 'hidden'
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 ring-1 ring-amber-400/20 shadow-xs'
                          : visibilityFilter === 'added'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/20 shadow-xs'
                            : visibilityFilter === 'all'
                              ? 'bg-indigo-50 dark:bg-emerald-950/40 border-indigo-300 dark:border-emerald-600 text-indigo-700 dark:text-emerald-300 ring-1 ring-indigo-500/20 dark:ring-emerald-500/20 shadow-xs'
                              : 'bg-slate-50 dark:bg-[#0b0c0e] border-slate-200 dark:border-[#2a2b30] text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500'
                      }`}
                    >
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="active">دروس فعال ({toPersianDigits(activeCount)})</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="added">ثبت شده در برنامه ({toPersianDigits(addedCount)})</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="hidden">پنهان‌شده‌ها ({toPersianDigits(hiddenCount)})</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="all">همه دروس ({toPersianDigits(catalogCourses.length)})</option>
                    </select>
                  </div>

                  {/* Gender Filter */}
                  <div>
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value as any)}
                      className={`w-full h-10 border rounded-xl px-2.5 text-xs font-bold focus:outline-none transition-all ${
                        genderFilter === 'men'
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 ring-1 ring-blue-500/20 shadow-xs'
                          : genderFilter === 'women'
                            ? 'bg-pink-50 dark:bg-pink-950/50 border-pink-400 dark:border-pink-600 text-pink-800 dark:text-pink-200 ring-1 ring-pink-500/20 shadow-xs'
                            : genderFilter === 'mixed'
                              ? 'bg-linear-to-r from-blue-50/90 via-purple-50/90 to-pink-50/90 dark:from-blue-950/60 dark:via-purple-950/60 dark:to-pink-950/60 border-purple-400 dark:border-purple-600 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500/20 shadow-xs'
                              : 'bg-slate-50 dark:bg-[#0b0c0e] border-slate-200 dark:border-[#2a2b30] text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500'
                      }`}
                    >
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="all">جنسیت (همه)</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="mixed">مختلط</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="men">آقایان</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="women">بانوان</option>
                    </select>
                  </div>

                  {/* Faculty Filter (if available) */}
                  {availableFaculties.length > 0 && (
                    <div>
                      <select
                        value={selectedFaculty}
                        onChange={(e) => setSelectedFaculty(e.target.value)}
                        className={`w-full h-10 border rounded-xl px-2.5 text-xs font-bold focus:outline-none transition-all ${
                          selectedFaculty !== 'all'
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200 ring-1 ring-purple-500/20 shadow-xs'
                            : 'bg-slate-50 dark:bg-[#0b0c0e] border-slate-200 dark:border-[#2a2b30] text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500'
                        }`}
                      >
                        <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="all">همه دانشکده‌ها ({toPersianDigits(availableFaculties.length)})</option>
                        {availableFaculties.map((f, i) => (
                          <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" key={i} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Day Filter */}
                  <div>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className={`w-full h-10 border rounded-xl px-2.5 text-xs font-bold focus:outline-none transition-all ${
                        selectedDay !== 'all'
                          ? 'bg-indigo-50 dark:bg-emerald-950/40 border-indigo-300 dark:border-emerald-600 text-indigo-700 dark:text-emerald-300 ring-1 ring-indigo-500/20 dark:ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#0b0c0e] border-slate-200 dark:border-[#2a2b30] text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500'
                      }`}
                    >
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="all">همه روزها</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="saturday">شنبه</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="sunday">یک‌شنبه</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="monday">دوشنبه</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="tuesday">سه‌شنبه</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="wednesday">چهارشنبه</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="thursday">پنج‌شنبه</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="friday">جمعه</option>
                    </select>
                  </div>

                  {/* Units & Exam Filter */}
                  <div>
                    <select
                      value={unitFilter}
                      onChange={(e) => setUnitFilter(e.target.value)}
                      className={`w-full h-10 border rounded-xl px-2.5 text-xs font-bold focus:outline-none transition-all ${
                        unitFilter !== 'all'
                          ? 'bg-indigo-50 dark:bg-emerald-950/40 border-indigo-300 dark:border-emerald-600 text-indigo-700 dark:text-emerald-300 ring-1 ring-indigo-500/20 dark:ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#0b0c0e] border-slate-200 dark:border-[#2a2b30] text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-emerald-500'
                      }`}
                    >
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="all">تعداد واحد (همه)</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="1">۱ واحد</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="2">۲ واحد</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="3">۳ واحد</option>
                      <option className="bg-white dark:bg-[#18191d] text-slate-800 dark:text-slate-100" value="4">۴ واحد</option>
                    </select>
                  </div>

                  {/* Time Range Filter Button with Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
                      className={`w-full h-10 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                        isTimeFilterActive
                          ? 'bg-indigo-50 dark:bg-emerald-950/40 border-indigo-300 dark:border-emerald-600 text-indigo-700 dark:text-emerald-300 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#0b0c0e] border-slate-200 dark:border-[#2a2b30] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1d21]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className={`w-3.5 h-3.5 shrink-0 ${isTimeFilterActive ? 'text-indigo-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                        <span className="truncate">
                          {isTimeFilterActive 
                            ? `${toPersianDigits(timeFilterStart)} تا ${toPersianDigits(timeFilterEnd)}` 
                            : 'زمان کلاس'}
                        </span>
                      </div>
                      {isTimeFilterActive ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsTimeFilterActive(false);
                          }}
                          className="p-0.5 hover:bg-indigo-200/60 dark:hover:bg-emerald-800/60 rounded-full text-indigo-700 dark:text-emerald-300"
                          title="حذف فیلتر زمانی"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      ) : (
                        <SlidersHorizontal className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {/* Time Range Popover */}
                    {isTimeFilterOpen && (
                      <div className="absolute top-12 left-0 right-0 sm:right-auto sm:w-80 bg-white dark:bg-[#18191d] rounded-2xl shadow-xl border border-slate-200 dark:border-[#2a2b30] p-4 z-40 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2a2b30]">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-emerald-400" />
                            فیلتر بر اساس بازه ساعت کلاس
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsTimeFilterOpen(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          فقط دروسی نمایش داده می‌شوند که جلسات کلاسی آن‌ها درون این بازه زمانی برگزار شود:
                        </p>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1">از ساعت:</span>
                            <select
                              value={timeFilterStart}
                              onChange={(e) => {
                                setTimeFilterStart(e.target.value);
                                setTimeFilterError(null);
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#131416] border border-slate-300 dark:border-[#383a40] rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-emerald-500"
                            >
                              {TIME_FILTER_HOURS.map((t) => (
                                <option key={t} value={t}>{toPersianDigits(t)}</option>
                              ))}
                            </select>
                          </div>

                          <span className="text-slate-400 font-bold text-xs mt-4">تا</span>

                          <div className="flex-1">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1">تا ساعت:</span>
                            <select
                              value={timeFilterEnd}
                              onChange={(e) => {
                                setTimeFilterEnd(e.target.value);
                                setTimeFilterError(null);
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#131416] border border-slate-300 dark:border-[#383a40] rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-emerald-500"
                            >
                              {TIME_FILTER_HOURS.map((t) => (
                                <option key={t} value={t}>{toPersianDigits(t)}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {timeFilterError && (
                          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{timeFilterError}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const [startH, startM] = timeFilterStart.split(':').map(Number);
                              const [endH, endM] = timeFilterEnd.split(':').map(Number);
                              if (endH * 60 + endM <= startH * 60 + startM) {
                                setTimeFilterError('ساعت پایان باید بعد از ساعت شروع باشد.');
                                return;
                              }
                              setIsTimeFilterActive(true);
                              setIsTimeFilterOpen(false);
                              setTimeFilterError(null);
                            }}
                            className="flex-1 py-2 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            اعمال بازه زمانی
                          </button>
                          {isTimeFilterActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsTimeFilterActive(false);
                                setIsTimeFilterOpen(false);
                                setTimeFilterError(null);
                              }}
                              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Filter Checkbox Toggles (Hide Conflicting & Hide Warnings) */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                  {/* Hide Conflicting Courses Checkbox */}
                  <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${
                    hideConflictingCourses
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#131416] border-slate-200 dark:border-[#2a2b30] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c1d21]'
                  }`}>
                    <input
                      type="checkbox"
                      checked={hideConflictingCourses}
                      onChange={(e) => handleToggleHideConflicting(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                    />
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className={`w-3.5 h-3.5 ${hideConflictingCourses ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                      <span className="font-bold">پنهان‌سازی دروس دارای تداخل زمانی</span>
                      {conflictingCoursesCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-extrabold">
                          {toPersianDigits(conflictingCoursesCount)}
                        </span>
                      )}
                    </div>
                  </label>

                  {/* Hide Warning Courses Checkbox */}
                  <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${
                    hideWarningCourses
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#131416] border-slate-200 dark:border-[#2a2b30] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c1d21]'
                  }`}>
                    <input
                      type="checkbox"
                      checked={hideWarningCourses}
                      onChange={(e) => handleToggleHideWarnings(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                    />
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className={`w-3.5 h-3.5 ${hideWarningCourses ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                      <span className="font-bold">پنهان‌سازی دروس دارای هشدار (گروه موازی)</span>
                      {warningCoursesCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-extrabold">
                          {toPersianDigits(warningCoursesCount)}
                        </span>
                      )}
                    </div>
                  </label>
                </div>

                {/* Batch Bar & Select All Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-[#1c1d21]">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-emerald-400 transition-colors cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1c1d21]"
                  >
                    {isAllFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-emerald-400" />
                    ) : selectedCourseIds.size > 0 ? (
                      <MinusSquare className="w-4 h-4 text-indigo-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {isAllFilteredSelected 
                        ? 'لغو انتخاب همه دروس' 
                        : `انتخاب همه دروس این لیست (${toPersianDigits(filteredCourses.length)} درس)`
                      }
                    </span>
                  </button>

                  {/* Batch Action Toolbar when 1 or more courses are checked */}
                  {selectedCourseIds.size > 0 && (
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-[#18191d] border border-indigo-200 dark:border-[#2a2b30] px-3 py-1.5 rounded-xl shadow-xs animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-xs font-extrabold text-indigo-950 dark:text-emerald-300 ml-1">
                        {toPersianDigits(selectedCourseIds.size)} درس انتخاب شد:
                      </span>

                      {/* Hide Selected */}
                      <button
                        type="button"
                        onClick={() => handleBatchHide(true)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 hover:bg-amber-200/80 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 rounded-lg transition-colors cursor-pointer"
                        title="پنهان کردن دروس انتخاب شده"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>پنهان کردن</span>
                      </button>

                      {/* Unhide Selected */}
                      <button
                        type="button"
                        onClick={() => handleBatchHide(false)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-800 dark:text-blue-300 bg-blue-100/80 hover:bg-blue-200/80 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer"
                        title="آشکارسازی دروس انتخاب شده"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>آشکارسازی</span>
                      </button>

                      {/* Delete Selected */}
                      <button
                        type="button"
                        onClick={handleBatchDelete}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100/80 hover:bg-rose-200/80 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 rounded-lg transition-colors cursor-pointer"
                        title="حذف کامل از بانک دروس"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>

                      {/* Deselect All */}
                      <button
                        type="button"
                        onClick={() => setSelectedCourseIds(new Set())}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer mr-1"
                        title="لغو انتخاب"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

          {/* Tab 1: Course Catalog Grid (Persisted in DOM to eliminate any remount freeze) */}
          <div className={activeCatalogTab === 'list' ? 'p-4 sm:p-6 pb-20' : 'hidden'}>
                {filteredCourses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 space-y-2 text-center">
                    <Search className="w-10 h-10 opacity-40" />
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-400">هیچ درسی مطابق با فیلترهای انتخاب شده یافت نشد.</p>
                    <p className="text-xs text-slate-400">می‌توانید عبارت جستجو، فیلتر روز، دانشکده یا وضعیت پنهان بودن را تغییر دهید.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {displayedCourses.map(course => {
                      const meta = courseValidationMap.map.get(course.id);
                      const isAdded = meta?.isAdded ?? false;
                      const hasConflict = meta?.hasConflict ?? false;
                      const conflicts = meta?.conflicts ?? [];
                      const hasDuplicateWarning = meta?.hasDuplicateWarning ?? false;
                      const isHidden = meta?.isEffectivelyHidden ?? false;
                      const matchedExistingCourse = isAdded ? existingCourses.find(c => isSameCourse(course, c)) : undefined;
                      const theme = getCourseTheme(course.color);
                      const isChecked = selectedCourseIds.has(course.id);

                      return (
                        <div 
                          key={course.id} 
                          className={`flex flex-col bg-white dark:bg-[#131416] rounded-2xl border transition-all hover:shadow-md relative overflow-hidden ${
                            isChecked
                              ? 'border-indigo-500 dark:border-emerald-500 ring-2 ring-indigo-500/30 dark:ring-emerald-500/30'
                              : isAdded 
                                ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' 
                                : hasConflict 
                                  ? 'border-rose-200 dark:border-rose-900/50 shadow-xs'
                                  : hasDuplicateWarning
                                    ? 'border-amber-300 dark:border-amber-700/70 ring-2 ring-amber-400/20 shadow-xs'
                                    : 'border-slate-200 dark:border-[#2a2b30] shadow-xs'
                          } ${isHidden ? 'opacity-70 dark:opacity-60 bg-slate-50/80 dark:bg-[#0f1013]' : ''}`}
                        >
                          <div className="p-4 sm:p-5 flex-1 space-y-3.5">
                            
                            {/* Card Header with Checkbox and Course Name */}
                            <div className="flex justify-between items-start gap-3">
                              
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                {/* Course Checkbox */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelectCourse(course.id);
                                  }}
                                  className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-emerald-400" />
                                  ) : (
                                    <Square className="w-5 h-5" />
                                  )}
                                </button>

                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-snug">
                                      {course.name}
                                    </h4>

                                    {isHidden && (
                                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 flex items-center gap-1">
                                        <EyeOff className="w-3 h-3" />
                                        <span>پنهان شده</span>
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${theme.lightBg} flex items-center gap-1`}>
                                      <span>کد:</span>
                                      <span dir="ltr">{toPersianDigits(course.code || '')}</span>
                                    </span>
                                    
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#1c1d21] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#2a2b30]">
                                      {toPersianDigits(course.credits)} واحد
                                    </span>

                                    {course.faculty && (
                                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-100 dark:border-purple-800/40 flex items-center gap-1">
                                        <Building2 className="w-3 h-3" />
                                        <span>{course.faculty}</span>
                                      </span>
                                    )}

                                    {/* Gender Badge */}
                                    <GenderBadge gender={course.gender} />

                                    {/* Parallel Group Warning Badge */}
                                    {hasDuplicateWarning && !isAdded && (
                                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                        <span>گروه موازی</span>
                                      </span>
                                    )}

                                    {/* Course Note Badge (Teal Theme - Non-Amber) */}
                                    {meta?.effectiveNote && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewingNoteModal({
                                            courseName: course.name,
                                            note: meta.effectiveNote!
                                          });
                                        }}
                                        className="text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-2.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/40 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                                        title="برای مشاهده متن کامل یادداشت کلیک کنید"
                                      >
                                        <FileText className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                                        <span className="whitespace-nowrap">یادداشت: برای مشاهده کلیک کنید</span>
                                      </button>
                                    )}

                                    {course.capacity && (
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                        ظرفیت: {toPersianDigits(course.capacity)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Single Course Action Icons (Hide / Delete from Catalog) */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleHideSingleCourse(course.id)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isHidden
                                      ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c1d21]'
                                  }`}
                                  title={isHidden ? "آشکارسازی درس" : "پنهان کردن درس از لیست"}
                                >
                                  {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteSingleCourse(course.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                  title="حذف این درس از بانک دروس"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                            </div>

                            {/* Details (Instructor, Sessions, Exam) */}
                            <div className="space-y-2 text-xs">
                              {course.instructor && (
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>استاد: {course.instructor}</span>
                                </div>
                              )}
                              
                              {/* Sessions */}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {course.sessions.map((s, idx) => (
                                  <span key={idx} className="bg-slate-100 dark:bg-[#1c1d21] text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-[#2a2b30]">
                                    {getDayFaName(s.day)}: {toPersianDigits(s.startTime)} الی {toPersianDigits(s.endTime)}
                                  </span>
                                ))}
                              </div>

                              {/* Exam */}
                              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-[#2a2b30]">
                                {course.exam ? (
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">امتحان پایان‌ترم:</span>
                                    <span>{formatExamDate(course.exam.date)}</span>
                                    <span className="text-slate-400">|</span>
                                    <span>ساعت {toPersianDigits(course.exam.startTime)}</span>
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                    این درس فاقد امتحان کتبی پایان‌ترم است
                                  </div>
                                )}
                              </div>

                              {/* Duplicate Group Warning Banner */}
                              {hasDuplicateWarning && !isAdded && (
                                <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span>توجه: گروه دیگری از این درس در برنامه هفتگی شما ثبت شده است.</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Footer Actions & Conflicts */}
                          <div className={`p-3.5 border-t flex flex-col gap-2 ${
                            isAdded 
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' 
                              : hasConflict 
                                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30' 
                                : hasDuplicateWarning
                                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
                                  : 'bg-slate-50/70 dark:bg-[#1c1d21]/50 border-slate-100 dark:border-[#2a2b30]'
                          }`}>
                            
                            {hasConflict && !isAdded && (
                              <div className="text-[11px] text-rose-700 dark:text-rose-300 font-bold space-y-1">
                                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>تداخل زمانی با برنامه فعلی:</span>
                                </div>
                                <ul className="list-disc list-inside pr-3 space-y-0.5 text-[11px] opacity-90 font-medium">
                                  {conflicts.map((c, i) => (
                                    <li key={i} className="leading-relaxed truncate" title={c.reason}>{c.reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1">
                              <div>
                                {isAdded && (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-black">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>در برنامه ثبت شده</span>
                                  </span>
                                )}
                              </div>

                              <div>
                                {isAdded ? (
                                  <button
                                    onClick={() => onRemoveCourse(matchedExistingCourse ? matchedExistingCourse.id : course.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    حذف از برنامه
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (hasConflict) {
                                        const conflictingIds = Array.from(new Set(conflicts.map(c => c.existingCourse.id)));
                                        setConfirmModal({
                                          isOpen: true,
                                          title: 'جایگزینی دروس متداخل',
                                          message: (
                                            <div className="space-y-2.5">
                                              <p className="leading-relaxed">
                                                درس «{course.name}» با دروس موجود در برنامه شما تداخل دارد. آیا مایلید این درس جایگزین دروس متداخل قبلی شود؟
                                              </p>
                                              <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/40 text-[11px] text-rose-800 dark:text-rose-300">
                                                <span className="font-bold block mb-1">موارد تداخل:</span>
                                                <ul className="list-disc list-inside space-y-0.5">
                                                  {conflicts.map((c, i) => (
                                                    <li key={i}>{c.reason}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                            </div>
                                          ),
                                          confirmText: 'بله، جایگزین کن',
                                          cancelText: 'انصراف',
                                          variant: 'primary',
                                          onConfirm: () => {
                                            if (onReplaceCourse) {
                                              onReplaceCourse(course, conflictingIds);
                                            } else {
                                              conflictingIds.forEach(id => onRemoveCourse(id));
                                              onAddCourse(course);
                                            }
                                          },
                                        });
                                      } else {
                                        onAddCourse(course);
                                      }
                                    }}
                                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer ${
                                      hasConflict 
                                        ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                                        : 'bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black'
                                    }`}
                                  >
                                    {hasConflict ? 'افزودن به جای درس متداخل' : '+ افزودن به برنامه'}
                                  </button>
                                )}
                              </div>
                            </div>

                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Infinite Scroll Sentinel & Load More button */}
                {filteredCourses.length > 0 && visibleLimit < filteredCourses.length && (
                  <div ref={loadMoreSentinelRef} className="flex flex-col items-center justify-center pt-6 pb-2">
                    <button
                      type="button"
                      onClick={() => setVisibleLimit(prev => Math.min(prev + CHUNK_SIZE, filteredCourses.length))}
                      className="px-6 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-[#1c1d21] dark:hover:bg-[#25262c] border border-indigo-200 dark:border-[#383a40] text-indigo-700 dark:text-emerald-400 rounded-2xl text-xs font-black transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <span>بارگذاری {toPersianDigits(Math.min(CHUNK_SIZE, filteredCourses.length - visibleLimit))} درس بعدی...</span>
                      <span className="text-[10px] opacity-75">({toPersianDigits(displayedCourses.length)} از {toPersianDigits(filteredCourses.length)})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tab 2: Timetable Grid View (Persisted in DOM for instant 0ms tab switching) */}
              <div className={activeCatalogTab === 'timetable' ? 'p-4 sm:p-6 pb-20 space-y-4' : 'hidden'}>
                <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-emerald-950/30 dark:via-slate-900/50 dark:to-emerald-950/30 border border-indigo-100 dark:border-emerald-800/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-950 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-emerald-400 shrink-0 animate-pulse" />
                    <span className="leading-relaxed font-medium">
                      در این بخش وضعیت فعلی جدول هفتگی خود را مشاهده می‌کنید. می‌توانید با فعال کردن گزینه <strong>«انتخاب از بانک دروس»</strong>، روی هر یک از بازه‌های خالی جدول کلیک کنید تا بلافاصله به فهرست دروس بازگشته و دروس متناسب با آن بازه زمانی فیلتر شوند.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveCatalogTab('list')}
                    className="px-4 py-2 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl font-bold shrink-0 transition-all cursor-pointer text-xs shadow-xs text-center whitespace-nowrap"
                  >
                    بازگشت به فهرست دروس
                  </button>
                </div>

                <TimetableGrid
                  courses={existingCourses}
                  onEditCourse={onEditCourse || (() => {})}
                  onDeleteCourse={onRemoveCourse}
                  onAddCourseAtSlot={() => {}}
                  onSelectGapFromCatalog={(day, startTime, endTime) => {
                    setSelectedDay(day);
                    setTimeFilterStart(startTime);
                    setTimeFilterEnd(endTime);
                    setIsTimeFilterActive(true);
                    setActiveCatalogTab('list');
                  }}
                  showFriday={showFriday ?? false}
                  onToggleFriday={onToggleFriday || (() => {})}
                  isPreviewMode={false}
                />
              </div>

            </div>
          )}
          
        </div>
      </div>

      {/* University Mismatch Modal Popup */}
      {universityMismatchModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white dark:bg-[#18191d] rounded-3xl max-w-md w-full p-6 border border-rose-200 dark:border-rose-900/50 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800/40">
              <ShieldAlert className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-2">
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                عدم امکان ترکیب دروس دانشگاه‌ها
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                بانک دروس فعلی شما مربوط به <strong>«{universityMismatchModal.currentUnivName}»</strong> است، اما فایل انتخابی مربوط به <strong>«{universityMismatchModal.detectedUnivName}»</strong> می‌باشد.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3 rounded-xl text-amber-900 dark:text-amber-200 text-xs font-medium leading-relaxed text-right mt-2">
                💡 امکان ترکیب همزمان دروس دانشگاه‌های مختلف در یک کاتالوگ وجود ندارد. اگر قصد دارید دانشگاه را تغییر دهید، ابتدا از دکمه <strong>«تعویض فایل جدول»</strong> استفاده کنید.
              </div>
            </div>

            <button
              onClick={() => setUniversityMismatchModal(null)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer mt-2"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* Dual Personality / Identity Conflict Easter Egg Modal */}
      {identityConflictModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white dark:bg-[#18191d] rounded-3xl max-w-md w-full p-6 border border-indigo-200 dark:border-indigo-900/50 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800/40 text-2xl">
              🎭
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                بالاخره تو کدوم یک از اینایی؟ دو شخصیتی جذاب (:
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                فایل جدیدی که اضافه کردی متعلق به یک دانشجوی متفاوته! هویت و نام نمایشی شما در سامانه کدوم باشه؟
              </p>
            </div>

            {/* Choice Options */}
            <div className="space-y-2.5">
              
              {/* Option 1: Current Student Identity */}
              <button
                type="button"
                onClick={() => setIdentityConflictModal(prev => prev ? ({ ...prev, selectedChoice: 'current' }) : null)}
                className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  identityConflictModal.selectedChoice === 'current'
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 dark:border-emerald-500 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 dark:bg-[#131416] border-slate-200 dark:border-[#2a2b30] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1c1d21] flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs border border-slate-200 dark:border-[#2a2b30] shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 block truncate">
                      {identityConflictModal.currentStudent.name || 'دانشجوی قبلی'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      شماره دانشجویی: {toPersianDigits(identityConflictModal.currentStudent.id || '-')} (هویت قبلی)
                    </span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                  identityConflictModal.selectedChoice === 'current'
                    ? 'bg-indigo-600 dark:bg-emerald-500 border-indigo-600 dark:border-emerald-500 text-white dark:text-black'
                    : 'border-slate-300 dark:border-slate-700'
                }`}>
                  {identityConflictModal.selectedChoice === 'current' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>

              {/* Option 2: Incoming Student Identity */}
              <button
                type="button"
                onClick={() => setIdentityConflictModal(prev => prev ? ({ ...prev, selectedChoice: 'incoming' }) : null)}
                className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  identityConflictModal.selectedChoice === 'incoming'
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 dark:border-emerald-500 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 dark:bg-[#131416] border-slate-200 dark:border-[#2a2b30] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1c1d21] flex items-center justify-center text-indigo-600 dark:text-emerald-400 shadow-2xs border border-slate-200 dark:border-[#2a2b30] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 block truncate">
                      {identityConflictModal.incomingStudent.name || 'دانشجوی جدید'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      شماره دانشجویی: {toPersianDigits(identityConflictModal.incomingStudent.id || '-')} (فایل جدید)
                    </span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                  identityConflictModal.selectedChoice === 'incoming'
                    ? 'bg-indigo-600 dark:bg-emerald-500 border-indigo-600 dark:border-emerald-500 text-white dark:text-black'
                    : 'border-slate-300 dark:border-slate-700'
                }`}>
                  {identityConflictModal.selectedChoice === 'incoming' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={handleConfirmIdentity}
              className="w-full py-3 bg-indigo-600 dark:bg-[#00B87C] hover:bg-indigo-700 dark:hover:bg-[#00d18d] text-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer mt-2"
            >
              تأیید و ذخیره هویت
            </button>

          </div>
        </div>
      )}

      {/* Note Viewer Modal Popup */}
      {viewingNoteModal && (
        <div 
          className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150" 
          dir="rtl"
          onClick={() => setViewingNoteModal(null)}
        >
          <div 
            className="bg-white dark:bg-[#18191d] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-[#2a2b30] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2a2b30]">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-extrabold text-sm">
                <FileText className="w-4 h-4" />
                <span>یادداشت درس {viewingNoteModal.courseName}</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingNoteModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#25262c] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-teal-50/50 dark:bg-teal-950/20 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/30 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-text max-h-[60vh] overflow-y-auto font-medium">
              {viewingNoteModal.note}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setViewingNoteModal(null)}
                className="px-5 py-2 bg-slate-100 dark:bg-[#25262c] hover:bg-slate-200 dark:hover:bg-[#30323a] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirm Modal for Catalog Actions */}
      <ConfirmModal
        config={confirmModal}
        onClose={() => setConfirmModal(null)}
      />

    </div>
  );
};