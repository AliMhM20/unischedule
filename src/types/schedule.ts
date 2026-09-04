export type DayOfWeek = 
  | 'saturday' 
  | 'sunday' 
  | 'monday' 
  | 'tuesday' 
  | 'wednesday' 
  | 'thursday' 
  | 'friday';

export interface ClassSession {
  id: string;
  day: DayOfWeek;
  startTime: string; // HH:mm (e.g. "08:00")
  endTime: string;   // HH:mm (e.g. "10:00")
}

export interface ExamInfo {
  date: string;       // e.g. "1404/10/18"
  dateType: 'shamsi' | 'gregorian';
  startTime: string;  // HH:mm (e.g. "09:00")
  endTime: string;    // HH:mm (e.g. "11:00")
  notes?: string;
}

export interface Course {
  id: string;
  name: string;
  code?: string;
  instructor?: string;
  credits: number;     // e.g. 3
  color: string;       // Hex or Tailwind color class key
  sessions: ClassSession[];
  exam?: ExamInfo;
  notes?: string;
  faculty?: string;
  department?: string;
  capacity?: number;
  location?: string;
  gender?: 'mixed' | 'men' | 'women';
  isHidden?: boolean;
  createdAt: number;
}

export interface ScheduleConflict {
  type: 'class' | 'exam';
  existingCourse: Course;
  conflictingSession?: ClassSession;
  incomingSession?: ClassSession;
  reason: string;
}

export interface SchedulePlan {
  id: string;
  name: string;
  courses: Course[];
  createdAt: number;
}

export interface PassedCourse {
  code: string;            // base course code e.g. "3108053"
  name: string;            // e.g. "مبانی هوش محاسباتی"
  credits?: number;        // e.g. 3
  termName?: string;       // e.g. "ترم اول 06-05"
  group?: string;          // e.g. "01"
  courseType?: string;     // e.g. "تخصصی"
  status?: string;         // e.g. "ثبت نهایی" / "پاس شده"
  grade?: string;          // e.g. "17.5"
  passedAt: number;
}


