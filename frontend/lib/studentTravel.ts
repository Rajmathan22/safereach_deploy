'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type BackendSchool, type BackendStudent, useBackendBootstrap } from '@/lib/backendData';
import { safereachRealtime } from './realtimeApi';
import { apiBaseUrl } from './runtimeConfig';
import { getCurrentTeacherAssignment } from './teacherAssignment';
import { institutionWording, normalizeInstitutionType, type InstitutionType } from './institutionType';

export type StudentTravelStatus =
  | 'at_home'
  | 'to_school'
  | 'reached_school'
  | 'present'
  | 'absent'
  | 'going_home'
  | 'reached_home';

export type AttendanceMark = 'pending' | 'present' | 'absent' | 'late' | 'reached_school' | 'going_home' | 'reached_home';
export type TeacherSmsStatus = 'reached_school' | 'going_home' | 'reached_home' | 'to_school' | 'present' | 'absent' | 'late';

export type StudentSmsLog = {
  id: string;
  status: TeacherSmsStatus;
  message: string;
  phone: string;
  sentAt: string;
  sentBy: string;
};

export type Db3RealtimeEvent = {
  id: string;
  table: 'students_status' | 'teacher_events' | 'parent_events' | 'travel_events' | 'sms_events';
  studentId: string;
  studentName: string;
  actor: 'parent' | 'teacher' | 'system';
  event: string;
  status: StudentTravelStatus | AttendanceMark | TeacherSmsStatus;
  detail: string;
  createdAt: string;
};

export type StudentTravelRecord = {
  id: string;
  /** Owning institution; used to adapt school/college wording per record. */
  schoolId?: string;
  name: string;
  roll: string;
  className: string;
  section: string;
  parentName: string;
  parentPhone: string;
  teacherName: string;
  avatar: string;
  location: string;
  isParentChild: boolean;
  status: StudentTravelStatus;
  attendance: AttendanceMark;
  absenceReason: string;
  absenceReasonRequested: boolean;
  absenceSmsSentAt: string;
  smsHistory: StudentSmsLog[];
  updatedAt: string;
};

export const TRAVEL_STORAGE_KEY = 'safereach_student_travel_attendance';
export const DB3_REALTIME_STORAGE_KEY = 'safereach_db3_realtime_events';
const TRAVEL_EVENT = 'safereach-travel-state-updated';

const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let backendBaseRecords: StudentTravelRecord[] = [];
let backendSchoolsList: BackendSchool[] = [];

/** Resolve school vs college wording for a record's institution. */
function institutionTypeForSchool(schoolId?: string, schools: BackendSchool[] = backendSchoolsList): InstitutionType {
  const match = (schoolId && schools.find(item => item.id === schoolId)) || schools[0];
  return normalizeInstitutionType(match?.institution_type);
}

export function getTravelStage(status: StudentTravelStatus): number {
  switch (status) {
    case 'at_home': return 0;
    case 'to_school': return 1;
    case 'reached_school':
    case 'present': return 2;
    case 'going_home': return 3;
    case 'reached_home': return 4;
    default: return 0;
  }
}

export const seedTravelRecords: StudentTravelRecord[] = [
  {
    id: 'st-leo-thompson',
    name: 'Leo Thompson',
    roll: '01',
    className: 'Class 4',
    section: 'A',
    parentName: 'Sarah Thompson',
    parentPhone: '+91 98765 22221',
    teacherName: 'Sarah Jenkins',
    avatar: 'LT',
    location: 'Home',
    isParentChild: true,
    status: 'at_home',
    attendance: 'pending',
    absenceReason: '',
    absenceReasonRequested: false,
    absenceSmsSentAt: '',
    smsHistory: [],
    updatedAt: 'Demo start',
  },
  {
    id: 'st-maya-thompson',
    name: 'Maya Thompson',
    roll: '02',
    className: 'Class 4',
    section: 'A',
    parentName: 'Sarah Thompson',
    parentPhone: '+91 98765 22221',
    teacherName: 'Sarah Jenkins',
    avatar: 'MT',
    location: 'Home',
    isParentChild: true,
    status: 'at_home',
    attendance: 'pending',
    absenceReason: '',
    absenceReasonRequested: false,
    absenceSmsSentAt: '',
    smsHistory: [],
    updatedAt: 'Demo start',
  },
  {
    id: 'st-priya-nair',
    name: 'Priya Nair',
    roll: '05',
    className: 'Class 4',
    section: 'B',
    parentName: 'Sunita Nair',
    parentPhone: '+1 (555) 100-2104',
    teacherName: 'Mr. James Anderson',
    avatar: 'PN',
    location: 'Home',
    isParentChild: false,
    status: 'at_home',
    attendance: 'pending',
    absenceReason: '',
    absenceReasonRequested: false,
    absenceSmsSentAt: '',
    smsHistory: [],
    updatedAt: 'Demo start',
  },
  {
    id: 'st-rohan-gupta',
    name: 'Rohan Gupta',
    roll: '06',
    className: 'Class 4',
    section: 'B',
    parentName: 'Meera Gupta',
    parentPhone: '+1 (555) 100-2105',
    teacherName: 'Mr. James Anderson',
    avatar: 'RG',
    location: 'Home',
    isParentChild: false,
    status: 'at_home',
    attendance: 'pending',
    absenceReason: '',
    absenceReasonRequested: false,
    absenceSmsSentAt: '',
    smsHistory: [],
    updatedAt: 'Demo start',
  },
];

function normalizeRecords(records: StudentTravelRecord[], baseRecords: StudentTravelRecord[] = backendBaseRecords) {
  const stored = new Map(records.map(record => [record.id, record]));
  return baseRecords.map(seed => {
    const saved = stored.get(seed.id);
    if (!saved) return seed;
    const savedTime = statusTimestamp(saved.updatedAt);
    const seedTime = statusTimestamp(seed.updatedAt);
    const savedHasLiveState = savedTime > 0 || saved.status !== seed.status || saved.attendance !== seed.attendance;
    const savedIsCurrent = savedHasLiveState && (seedTime === 0 || savedTime === 0 || savedTime >= seedTime);
    return {
      ...seed,
      ...(savedIsCurrent ? {
        status: saved.status,
        attendance: saved.attendance,
        location: saved.location,
        updatedAt: saved.updatedAt,
      } : {}),
      absenceReason: saved.absenceReason,
      absenceReasonRequested: seed.absenceReasonRequested || saved.absenceReasonRequested,
      absenceSmsSentAt: saved.absenceSmsSentAt,
      smsHistory: saved.smsHistory ?? [],
    };
  });
}

function statusTimestamp(value: string) {
  if (!value) return 0;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;
  const normalized = Date.parse(value.replace(' ', 'T'));
  return Number.isNaN(normalized) ? 0 : normalized;
}

function safeStatus(status: string): StudentTravelStatus {
  const allowed: StudentTravelStatus[] = ['at_home', 'to_school', 'reached_school', 'present', 'absent', 'going_home', 'reached_home'];
  return allowed.includes(status as StudentTravelStatus) ? status as StudentTravelStatus : 'at_home';
}

function safeAttendance(status: string): AttendanceMark {
  const statusMap: Record<StudentTravelStatus, AttendanceMark> = {
    at_home: 'absent',
    to_school: 'present',
    reached_school: 'reached_school',
    present: 'present',
    absent: 'absent',
    going_home: 'going_home',
    reached_home: 'reached_home',
  };
  return statusMap[status as StudentTravelStatus] || 'pending';
}

function locationForStatus(status: StudentTravelStatus, type: InstitutionType = 'school') {
  const w = institutionWording(type);
  const labels: Record<StudentTravelStatus, string> = {
    at_home: 'Home',
    to_school: w.trackingTo,
    reached_school: w.reachedLocation,
    present: w.atLocation,
    absent: w.notReached,
    going_home: 'Tracking to home',
    reached_home: 'SafeReach at home',
  };
  return labels[status];
}

function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'SR';
}

function backendStudentToTravelRecord(student: BackendStudent, schools: BackendSchool[] = backendSchoolsList): StudentTravelRecord {
  const status = safeStatus(student.travel_status);
  const schoolId = student.school_id || undefined;
  const institutionType = normalizeInstitutionType(
    (schools.find(item => item.id === student.school_id) || schools[0])?.institution_type
  );
  const isThompson = (student.guardian_name || '').toLowerCase().includes('thompson')
    || (student.full_name || '').toLowerCase().includes('thompson')
    || student.id.includes('thompson')
    || (student.student_code || '').includes('SAFE-4A-01')
    || (student.student_code || '').includes('SAFE-4A-02');
  return {
    id: student.id,
    schoolId,
    name: student.full_name,
    roll: student.roll_no,
    className: student.class_name,
    section: student.section_name,
    parentName: student.guardian_name || 'Sarah Thompson',
    parentPhone: student.parent_phone || '+910000000000',
    teacherName: 'Sarah Jenkins',
    avatar: initials(student.full_name),
    location: locationForStatus(status, institutionType),
    isParentChild: isThompson,
    status,
    attendance: safeAttendance(student.attendance_status),
    absenceReason: student.absence_reason || '',
    absenceReasonRequested: Boolean(student.absence_sms_sent_at) && !student.absence_reason,
    absenceSmsSentAt: student.absence_sms_sent_at || '',
    smsHistory: [],
    updatedAt: student.travel_updated_at || 'DB stored record',
  };
}

export function readTravelRecords(baseRecords: StudentTravelRecord[] = backendBaseRecords) {
  if (typeof window === 'undefined') return baseRecords;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TRAVEL_STORAGE_KEY) ?? '[]') as StudentTravelRecord[];
    return normalizeRecords(Array.isArray(parsed) ? parsed : [], baseRecords);
  } catch {
    return baseRecords;
  }
}

function writeTravelRecords(records: StudentTravelRecord[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TRAVEL_STORAGE_KEY, JSON.stringify(records));
  // Share the exact next snapshot with every mounted role view immediately.
  // Reading from storage again here could merge a stale bootstrap response back
  // over the teacher or parent action that was just clicked.
  window.dispatchEvent(new CustomEvent<StudentTravelRecord[]>(TRAVEL_EVENT, { detail: records }));
}

function appendDb3RealtimeEvent(record: StudentTravelRecord, event: Omit<Db3RealtimeEvent, 'id' | 'studentId' | 'studentName' | 'createdAt'>) {
  if (typeof window === 'undefined') return;
  const createdAt = nowLabel();
  const nextEvent: Db3RealtimeEvent = {
    ...event,
    id: `${record.id}-${event.table}-${Date.now()}`,
    studentId: record.id,
    studentName: record.name,
    createdAt,
  };
  try {
    const existing = JSON.parse(window.localStorage.getItem(DB3_REALTIME_STORAGE_KEY) ?? '[]') as Db3RealtimeEvent[];
    const next = [nextEvent, ...(Array.isArray(existing) ? existing : [])].slice(0, 200);
    window.localStorage.setItem(DB3_REALTIME_STORAGE_KEY, JSON.stringify(next));
  } catch {
    window.localStorage.setItem(DB3_REALTIME_STORAGE_KEY, JSON.stringify([nextEvent]));
  }
}

function updateRecords(updater: (records: StudentTravelRecord[]) => StudentTravelRecord[]) {
  const updated = updater(readTravelRecords());
  writeTravelRecords(updated);
  return updated;
}

function updateOne(studentId: string, patch: Partial<StudentTravelRecord>) {
  return updateRecords(records =>
    records.map(record => record.id === studentId ? { ...record, ...patch, updatedAt: nowLabel() } : record)
  );
}

function smsStatusLabel(status: TeacherSmsStatus, type: InstitutionType = 'school') {
  const w = institutionWording(type);
  const labels: Record<TeacherSmsStatus, string> = {
    to_school: w.onTravelTo,
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    reached_school: w.reached,
    going_home: 'Go Out / Going Home',
    reached_home: 'Reached Home',
  };
  return labels[status];
}

function buildSmsMessage(student: StudentTravelRecord, status: TeacherSmsStatus, type: InstitutionType = 'school') {
  const w = institutionWording(type);
  const base = `SafeReach: ${student.name} (${student.className}-${student.section})`;
  const messages: Record<TeacherSmsStatus, string> = {
    to_school: `${base} has departed and is on travel to ${w.nounLower}. - ${student.teacherName}`,
    present: `${base} is marked Present and reached ${w.nounLower} safely. - ${student.teacherName}`,
    absent: `${base} is marked Absent today. Please send the absence reason to ${w.nounLower}. - ${student.teacherName}`,
    late: `${base} reached ${w.nounLower} Late. Attendance has been updated. - ${student.teacherName}`,
    reached_school: `${base} has Reached ${w.noun}. Attendance confirmation will follow. - ${student.teacherName}`,
    going_home: `${base} has left ${w.nounLower} and is Going Home. Please confirm when reached home. - ${student.teacherName}`,
    reached_home: `${base} is recorded as Reached Home. Thank you. - ${student.teacherName}`,
  };
  return messages[status];
}

function createSmsLog(student: StudentTravelRecord, status: TeacherSmsStatus): StudentSmsLog {
  const sentAt = nowLabel();
  return {
    id: `${student.id}-${status}-${Date.now()}`,
    status,
    message: buildSmsMessage(student, status, institutionTypeForSchool(student.schoolId)),
    phone: student.parentPhone,
    sentAt,
    sentBy: student.teacherName,
  };
}

function updateOneWithSms(studentId: string, status: TeacherSmsStatus, patch: Partial<StudentTravelRecord>) {
  return updateRecords(records =>
    records.map(record => {
      if (record.id !== studentId) return record;
      const sms = createSmsLog(record, status);
      appendDb3RealtimeEvent(record, {
        table: status === 'going_home' || status === 'reached_home' ? 'travel_events' : 'teacher_events',
        actor: status === 'reached_home' ? 'parent' : 'teacher',
        event: smsStatusLabel(status),
        status,
        detail: sms.message,
      });
      appendDb3RealtimeEvent(record, {
        table: 'sms_events',
        actor: 'system',
        event: 'SMS preview generated',
        status,
        detail: sms.message,
      });
      return {
        ...record,
        ...patch,
        smsHistory: [sms, ...(record.smsHistory ?? [])].slice(0, 20),
        updatedAt: sms.sentAt,
      };
    })
  );
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || `Backend returned ${response.status}`);
  }
  return payload as T;
}

async function realtimeRequest<T>(eventName: string, payload: object, fallbackPath: string, fallbackInit: RequestInit): Promise<T> {
  try {
    return await safereachRealtime.request<object, T>(eventName, payload, 8000);
  } catch {
    return apiRequest<T>(fallbackPath, fallbackInit);
  }
}

type BackendTravelPayload = {
  student_id: string;
  status: string;
  attendance_status?: string;
  event?: string;
  last_event_at?: string;
};

type AbsenceReasonPayload = {
  student_id: string;
  body: string;
  created_at?: string;
};

type AbsenceNotificationPayload = {
  notifications?: Array<{
    student_id: string;
    message?: { created_at?: string };
    sms?: { status?: string };
  }>;
};

function applyBackendTravelPayload(records: StudentTravelRecord[], payload: BackendTravelPayload) {
  return records.map(record => {
    if (record.id !== payload.student_id) return record;
    const backendUpdatedAt = payload.last_event_at || '';
    const localTime = statusTimestamp(record.updatedAt);
    const backendTime = statusTimestamp(backendUpdatedAt);
    // Socket broadcasts can arrive out of order. Do not replace the optimistic
    // click result with an older status; accept the matching/newer server event.
    if (backendTime > 0 && localTime > backendTime) return record;
    const status = safeStatus(payload.status);
    return {
      ...record,
      status,
      attendance: safeAttendance(payload.attendance_status || record.attendance),
      location: locationForStatus(status, institutionTypeForSchool(record.schoolId)),
      // An absence prompt is created only by the final attendance submission,
      // not when a teacher merely stages the Absent status.
      absenceReasonRequested: record.absenceReasonRequested,
      updatedAt: backendUpdatedAt || nowLabel(),
    };
  });
}

function applyLocalTravelPatch(records: StudentTravelRecord[], studentId: string, patch: Partial<StudentTravelRecord>) {
  return records.map(record => {
    if (record.id !== studentId) return record;
    const status = patch.status ?? record.status;
    return {
      ...record,
      ...patch,
      status,
      location: patch.location ?? locationForStatus(status, institutionTypeForSchool(record.schoolId)),
      updatedAt: patch.updatedAt ?? nowLabel(),
    };
  });
}

function applyLocalTravelPatchMany(records: StudentTravelRecord[], studentIds: string[], patch: Partial<StudentTravelRecord>) {
  const selectedIds = new Set(studentIds);
  return records.map(record => {
    if (!selectedIds.has(record.id)) return record;
    const status = patch.status ?? record.status;
    return {
      ...record,
      ...patch,
      status,
      location: patch.location ?? locationForStatus(status, institutionTypeForSchool(record.schoolId)),
      updatedAt: patch.updatedAt ?? nowLabel(),
    };
  });
}

function persistAndReturn(records: StudentTravelRecord[]) {
  writeTravelRecords(records);
  return records;
}

export function travelStatusLabel(status: StudentTravelStatus, audience: 'parent' | 'teacher' = 'parent', type: InstitutionType = 'school') {
  const w = institutionWording(type);
  if (audience === 'parent') {
    if (status === 'at_home') return 'At Home';
    if (status === 'to_school') return 'Departed Home (On Travel)';
    if (status === 'reached_school' || status === 'present') return w.reachedSafely;
    if (status === 'going_home') return `Out of ${w.noun} (Going Home)`;
    if (status === 'reached_home') return 'Safe at Home';
  }
  const labels: Record<StudentTravelStatus, string> = {
    at_home: 'At Home',
    to_school: w.onTravelTo,
    reached_school: w.reached,
    present: w.reached,
    absent: 'Not Arrived',
    going_home: w.outOf,
    reached_home: 'Reached Home',
  };
  return labels[status] || 'At Home';
}

export function travelStatusIcon(status: StudentTravelStatus) {
  const icons: Record<StudentTravelStatus, string> = {
    at_home: 'home',
    to_school: 'directions_walk',
    reached_school: 'school',
    present: 'school',
    absent: 'help_outline',
    going_home: 'directions_bus',
    reached_home: 'home_pin',
  };
  return icons[status] || 'home';
}

export function travelStatusClass(status: StudentTravelStatus) {
  const classes: Record<StudentTravelStatus, string> = {
    at_home: 'bg-surface-container text-on-surface-variant border-outline-variant/50',
    to_school: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    reached_school: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    present: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    absent: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    going_home: 'bg-sky-100 text-sky-800 border-sky-300 font-bold',
    reached_home: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
  };
  return classes[status] || 'bg-surface-container text-on-surface-variant';
}

export function useStudentTravelState() {
  const { data: backend } = useBackendBootstrap();
  const [records, setRecords] = useState<StudentTravelRecord[]>([]);
  const recordsRef = useRef<StudentTravelRecord[]>([]);

  const commitRecords = useCallback((updater: (current: StudentTravelRecord[]) => StudentTravelRecord[]) => {
    const source = recordsRef.current.length > 0 ? recordsRef.current : readTravelRecords(backendBaseRecords);
    const next = updater(source);
    recordsRef.current = next;
    setRecords(next);
    writeTravelRecords(next);
    return next;
  }, []);

  useEffect(() => {
    backendSchoolsList = backend.schools ?? [];
    backendBaseRecords = backend.students.map(student => backendStudentToTravelRecord(student, backendSchoolsList));
    const initialRecords = readTravelRecords(backendBaseRecords);
    recordsRef.current = initialRecords;
    setRecords(initialRecords);
    const refresh = (event?: Event) => {
      const next = event instanceof CustomEvent && Array.isArray(event.detail)
        ? event.detail as StudentTravelRecord[]
        : readTravelRecords(backendBaseRecords);
      recordsRef.current = next;
      setRecords(next);
    };
    window.addEventListener('storage', refresh);
    window.addEventListener(TRAVEL_EVENT, refresh);
    safereachRealtime.connect();
    const unsubscribe = safereachRealtime.subscribe(event => {
      if (event.type === 'student.status.changed' || event.type === 'attendance.marked') {
        const payload = event.payload as BackendTravelPayload | { records?: BackendTravelPayload[] };
        const recordsPayload = 'records' in payload && Array.isArray(payload.records) ? payload.records : [payload as BackendTravelPayload];
        commitRecords(current => recordsPayload.reduce((next, recordPayload) => applyBackendTravelPayload(next, recordPayload), current));
        return;
      }
      if (event.type === 'absence.reason.submitted') {
        const payload = event.payload as AbsenceReasonPayload;
        if (!payload.student_id) return;
        commitRecords(current => applyLocalTravelPatch(current, payload.student_id, {
          absenceReason: payload.body,
          absenceReasonRequested: false,
          updatedAt: payload.created_at || nowLabel(),
        }));
        return;
      }
      if (event.type === 'attendance.absence.notified') {
        const payload = event.payload as AbsenceNotificationPayload;
        const ids = (payload.notifications ?? []).map(item => item.student_id).filter(Boolean);
        if (ids.length === 0) return;
        commitRecords(current => applyLocalTravelPatchMany(current, ids, {
          absenceReasonRequested: true,
          absenceSmsSentAt: nowLabel(),
        }));
      }
    });
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(TRAVEL_EVENT, refresh);
      unsubscribe();
    };
  }, [backend.students, commitRecords]);

  const actions = useMemo(() => ({
    // Stage 1 (Parent): Mark Departed from Home
    async markDepartedHome(studentId: string) {
      commitRecords(current => applyLocalTravelPatch(current, studentId, {
        status: 'to_school',
        attendance: safeAttendance('to_school'),
        absenceReason: '',
        absenceReasonRequested: false,
        absenceSmsSentAt: '',
      }));
      const requestPayload = { studentId, actorUserId: null };
      const payload = await realtimeRequest<BackendTravelPayload>('student.ready_to_school', requestPayload, `/student-travel/${encodeURIComponent(studentId)}/depart-home`, {
        method: 'POST',
        body: JSON.stringify({ actorUserId: null }),
      });
      const existingRecord = recordsRef.current.find(item => item.id === studentId);
      commitRecords(current => applyBackendTravelPayload(current, payload).map(record =>
          record.id === studentId
            ? { ...record, status: 'to_school', attendance: safeAttendance('to_school') }
            : record
      ));
      if (existingRecord) {
        const w = institutionWording(institutionTypeForSchool(existingRecord.schoolId));
        appendDb3RealtimeEvent(existingRecord, {
          table: 'parent_events',
          actor: 'parent',
          event: 'Departed from Home',
          status: 'to_school',
          detail: `${existingRecord.name} has departed from home and is on travel to ${w.nounLower}.`,
        });
      }
    },
    // Alias for backward compatibility
    async readyToSend(studentId: string) {
      return this.markDepartedHome(studentId);
    },

    // Stage 2 (Teacher): Mark Reached School
    async markReachedSchool(studentId: string) {
      commitRecords(current => applyLocalTravelPatch(current, studentId, {
        status: 'reached_school',
        attendance: 'reached_school',
      }));
      const requestPayload = { studentId, actorUserId: null };
      const payload = await realtimeRequest<BackendTravelPayload>('student.reached_school', requestPayload, `/student-travel/${encodeURIComponent(studentId)}/reached-school`, {
        method: 'POST',
        body: JSON.stringify({ actorUserId: null }),
      });
      commitRecords(current => applyBackendTravelPayload(current, payload).map(record =>
        record.id === studentId ? { ...record, status: 'reached_school', attendance: 'reached_school' } : record
      ));
      const existingRecord = recordsRef.current.find(item => item.id === studentId);
      if (existingRecord) {
        const w = institutionWording(institutionTypeForSchool(existingRecord.schoolId));
        appendDb3RealtimeEvent(existingRecord, {
          table: 'teacher_events',
          actor: 'teacher',
          event: w.reached,
          status: 'reached_school',
          detail: `${existingRecord.name} has safely arrived at ${w.nounLower}.`,
        });
      }
    },
    async markAllReachedSchool(studentIds?: string[]) {
      const targetIds = studentIds ?? recordsRef.current.map(s => s.id);
      await Promise.all(targetIds.map(id => this.markReachedSchool(id)));
    },
    async markPresent(studentId: string) {
      return this.markReachedSchool(studentId);
    },
    async markLate(studentId: string) {
      return this.markReachedSchool(studentId);
    },
    async markAbsent(studentId: string) {
      commitRecords(current => applyLocalTravelPatch(current, studentId, {
        status: 'at_home',
        attendance: safeAttendance('at_home'),
      }));
    },

    // Stage 3 (Teacher): Mark Out of School (Going Home)
    async markOutOfSchool(studentIds: string[]) {
      commitRecords(current => applyLocalTravelPatchMany(current, studentIds, {
        status: 'going_home',
        attendance: 'going_home',
      }));
      const requestPayload = { studentIds, actorUserId: null };
      const payload = await realtimeRequest<{ ok: boolean; records: BackendTravelPayload[] }>('travel.go_out', requestPayload, '/student-travel/out-of-school', {
        method: 'POST',
        body: JSON.stringify({ studentIds, actorUserId: null }),
      });
      commitRecords(current => payload.records.reduce((next, recordPayload) => applyBackendTravelPayload(next, recordPayload), current));
      studentIds.forEach(id => {
        const student = recordsRef.current.find(s => s.id === id);
        if (student) {
          const w = institutionWording(institutionTypeForSchool(student.schoolId));
          appendDb3RealtimeEvent(student, {
            table: 'teacher_events',
            actor: 'teacher',
            event: w.outOf,
            status: 'going_home',
            detail: `${student.name} is dismissed and on travel home.`,
          });
        }
      });
    },
    async markLeavingSchool(studentIds: string[]) {
      return this.markOutOfSchool(studentIds);
    },
    async markAllOutOfSchool(studentIds?: string[]) {
      const targetIds = studentIds ?? recordsRef.current.filter(s => s.status === 'reached_school' || s.status === 'present').map(s => s.id);
      if (targetIds.length > 0) {
        await this.markOutOfSchool(targetIds);
      }
    },

    // Stage 4 (Parent): Confirm Reached Home
    async markReachedHome(studentId: string) {
      commitRecords(current => applyLocalTravelPatch(current, studentId, {
        status: 'reached_home',
        attendance: 'reached_home',
      }));
      const requestPayload = { studentId, actorUserId: null };
      const payload = await realtimeRequest<BackendTravelPayload>('parent.reached_home', requestPayload, `/student-travel/${encodeURIComponent(studentId)}/reached-home`, {
        method: 'POST',
        body: JSON.stringify({ actorUserId: null }),
      });
      commitRecords(current => applyBackendTravelPayload(current, payload));
      const student = recordsRef.current.find(s => s.id === studentId);
      if (student) {
        appendDb3RealtimeEvent(student, {
          table: 'parent_events',
          actor: 'parent',
          event: 'Reached Home',
          status: 'reached_home',
          detail: `${student.name} has safely reached home.`,
        });
      }
    },

    // Reset Day Flow for demo / testing
    resetDayFlow() {
      commitRecords(current => current.map(record => ({
        ...record,
        status: 'at_home' as const,
        attendance: 'pending' as const,
        location: 'Home',
        updatedAt: nowLabel(),
      })));
    },
    resetDemo() {
      this.resetDayFlow();
    },

    async submitAbsenceReason(studentId: string, reason: string) {
      const cleanReason = reason.trim();
      const payload = await realtimeRequest<AbsenceReasonPayload>(
        'absence.reason.submit',
        { studentId, reason: cleanReason, actorUserId: null },
        '/messages/absence-reason',
        { method: 'POST', body: JSON.stringify({ studentId, reason: cleanReason, actorUserId: null }) },
      );
      commitRecords(current => applyLocalTravelPatch(current, studentId, {
        absenceReason: payload.body || cleanReason,
        absenceReasonRequested: false,
        updatedAt: payload.created_at || nowLabel(),
      }));
      return payload;
    },
    async sendParentChat(studentId: string, body: string) {
      return realtimeRequest(
        'message.send',
        { studentId, body: body.trim(), actorUserId: null },
        '/messages',
        { method: 'POST', body: JSON.stringify({ studentId, body: body.trim(), actorUserId: null }) },
      );
    },
    async notifyAbsentParents(studentIds: string[]) {
      const payload = await realtimeRequest<AbsenceNotificationPayload>(
        'attendance.absence.notify',
        { studentIds, actorUserId: null },
        '/attendance/absence-notifications',
        { method: 'POST', body: JSON.stringify({ studentIds, actorUserId: null }) },
      );
      const ids = (payload.notifications ?? []).map(item => item.student_id).filter(Boolean);
      if (ids.length > 0) {
        commitRecords(current => applyLocalTravelPatchMany(current, ids, {
          absenceReasonRequested: true,
          absenceSmsSentAt: nowLabel(),
        }));
      }
      return payload;
    },
    sendStatusSms(studentId: string, status: TeacherSmsStatus) {
      setRecords(updateOneWithSms(studentId, status, {}));
    },
  }), [commitRecords]);


  const teacherAssignment = getCurrentTeacherAssignment(backend);
  const classStudents = records.filter(record =>
    record.className === teacherAssignment.className && record.section === teacherAssignment.sectionName
  );

  const parentChildren = records.filter(record => record.isParentChild);

  // School or college wording context for whichever records this view shows.
  // Read straight from the current bootstrap payload so the first render after
  // data arrives already uses the right wording.
  const institutionType = institutionTypeForSchool(
    classStudents[0]?.schoolId ?? parentChildren[0]?.schoolId ?? records[0]?.schoolId,
    backend.schools,
  );

  return {
    records,
    parentChildren,
    classStudents,
    institutionType,
    counts: {
      toSchool: classStudents.filter(record => record.status === 'to_school').length,
      present: classStudents.filter(record => record.status === 'present' || record.status === 'reached_school').length,
      absent: classStudents.filter(record => record.status === 'absent').length,
      goingHome: classStudents.filter(record => record.status === 'going_home').length,
      reachedHome: classStudents.filter(record => record.status === 'reached_home').length,
    },
    smsLogs: records.flatMap(record => (record.smsHistory ?? []).map(log => ({ ...log, studentName: record.name, parentName: record.parentName })))
      .sort((a, b) => b.id.localeCompare(a.id)),
    smsStatusLabel,
    actions,
  };
}

export const ACTIVE_CHILD_KEY = 'safereach_parent_active_child_id';
export const ACTIVE_CHILD_EVENT = 'safereach-parent-active-child-changed';

export function useParentActiveChild() {
  const { parentChildren, actions } = useStudentTravelState();
  const [activeChildId, setActiveChildIdState] = useState<string>('');

  useEffect(() => {
    const readActiveId = () => {
      if (typeof window === 'undefined') return '';
      const stored = window.localStorage.getItem(ACTIVE_CHILD_KEY);
      if (stored && parentChildren.some(c => c.id === stored)) {
        return stored;
      }
      const firstId = parentChildren[0]?.id || '';
      if (firstId) {
        window.localStorage.setItem(ACTIVE_CHILD_KEY, firstId);
      }
      return firstId;
    };

    setActiveChildIdState(readActiveId());

    const handleChildChange = (e: Event) => {
      if (e instanceof CustomEvent && typeof e.detail === 'string') {
        setActiveChildIdState(e.detail);
      } else {
        setActiveChildIdState(readActiveId());
      }
    };

    window.addEventListener(ACTIVE_CHILD_EVENT, handleChildChange);
    window.addEventListener('storage', handleChildChange);
    return () => {
      window.removeEventListener(ACTIVE_CHILD_EVENT, handleChildChange);
      window.removeEventListener('storage', handleChildChange);
    };
  }, [parentChildren]);

  const selectChild = useCallback((childId: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_CHILD_KEY, childId);
      window.dispatchEvent(new CustomEvent<string>(ACTIVE_CHILD_EVENT, { detail: childId }));
    }
    setActiveChildIdState(childId);
  }, []);

  const activeChild = useMemo(() => {
    return parentChildren.find(c => c.id === activeChildId) || parentChildren[0] || null;
  }, [parentChildren, activeChildId]);

  return {
    children: parentChildren,
    activeChild,
    activeChildId: activeChild?.id || '',
    selectChild,
    actions,
  };
}
