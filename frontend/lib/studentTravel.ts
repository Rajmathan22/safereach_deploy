'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type BackendStudent, useBackendBootstrap } from '@/lib/backendData';
import { safereachRealtime } from '@/lib/realtimeApi';
import { apiBaseUrl } from './runtimeConfig';
import { getCurrentTeacherAssignment } from './teacherAssignment';

export type StudentTravelStatus =
  | 'at_home'
  | 'to_school'
  | 'reached_school'
  | 'present'
  | 'absent'
  | 'going_home'
  | 'reached_home';

export type AttendanceMark = 'pending' | 'present' | 'absent' | 'late';
export type TeacherSmsStatus = 'present' | 'absent' | 'late' | 'reached_school' | 'going_home' | 'reached_home';

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

const nowLabel = () => new Date().toLocaleString();
let backendBaseRecords: StudentTravelRecord[] = [];

export const seedTravelRecords: StudentTravelRecord[] = [
  {
    id: 'st-leo-thompson',
    name: 'Leo Thompson',
    roll: '01',
    className: 'Class 4',
    section: 'B',
    parentName: 'Sarah Thompson',
    parentPhone: '+1 (555) 100-2101',
    teacherName: 'Mr. James Anderson',
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
    section: 'B',
    parentName: 'Sarah Thompson',
    parentPhone: '+1 (555) 100-2101',
    teacherName: 'Mr. James Anderson',
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
    id: 'st-aarav-sharma',
    name: 'Aarav Sharma',
    roll: '03',
    className: 'Class 4',
    section: 'B',
    parentName: 'Nisha Sharma',
    parentPhone: '+1 (555) 100-2102',
    teacherName: 'Mr. James Anderson',
    avatar: 'AS',
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
    id: 'st-ananya-patel',
    name: 'Ananya Patel',
    roll: '04',
    className: 'Class 4',
    section: 'B',
    parentName: 'Ravi Patel',
    parentPhone: '+1 (555) 100-2103',
    teacherName: 'Mr. James Anderson',
    avatar: 'AP',
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
  const allowed: AttendanceMark[] = ['pending', 'present', 'absent', 'late'];
  return allowed.includes(status as AttendanceMark) ? status as AttendanceMark : 'pending';
}

function locationForStatus(status: StudentTravelStatus) {
  const labels: Record<StudentTravelStatus, string> = {
    at_home: 'Home',
    to_school: 'Tracking to school',
    reached_school: 'Reached school campus',
    present: 'SafeReach at school',
    absent: 'Not reached school',
    going_home: 'Tracking to home',
    reached_home: 'SafeReach at home',
  };
  return labels[status];
}

function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'SR';
}

function backendStudentToTravelRecord(student: BackendStudent): StudentTravelRecord {
  const status = safeStatus(student.travel_status);
  const isThompson = (student.guardian_name || '').toLowerCase().includes('thompson')
    || (student.full_name || '').toLowerCase().includes('thompson')
    || student.id.includes('thompson')
    || (student.student_code || '').includes('SAFE-4A-01')
    || (student.student_code || '').includes('SAFE-4A-02');
  return {
    id: student.id,
    name: student.full_name,
    roll: student.roll_no,
    className: student.class_name,
    section: student.section_name,
    parentName: student.guardian_name || 'Sarah Thompson',
    parentPhone: student.parent_phone || '+910000000000',
    teacherName: 'Sarah Jenkins',
    avatar: initials(student.full_name),
    location: locationForStatus(status),
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

function smsStatusLabel(status: TeacherSmsStatus) {
  const labels: Record<TeacherSmsStatus, string> = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    reached_school: 'Reached School',
    going_home: 'Go Out / Going Home',
    reached_home: 'Reached Home',
  };
  return labels[status];
}

function buildSmsMessage(student: StudentTravelRecord, status: TeacherSmsStatus) {
  const base = `SafeReach: ${student.name} (${student.className}-${student.section})`;
  const messages: Record<TeacherSmsStatus, string> = {
    present: `${base} is marked Present and reached school safely. - ${student.teacherName}`,
    absent: `${base} is marked Absent today. Please send the absence reason to school. - ${student.teacherName}`,
    late: `${base} reached school Late. Attendance has been updated. - ${student.teacherName}`,
    reached_school: `${base} has Reached School. Attendance confirmation will follow. - ${student.teacherName}`,
    going_home: `${base} has left school and is Going Home. Please confirm when reached home. - ${student.teacherName}`,
    reached_home: `${base} is recorded as Reached Home. Thank you. - ${student.teacherName}`,
  };
  return messages[status];
}

function createSmsLog(student: StudentTravelRecord, status: TeacherSmsStatus): StudentSmsLog {
  const sentAt = nowLabel();
  return {
    id: `${student.id}-${status}-${Date.now()}`,
    status,
    message: buildSmsMessage(student, status),
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
      location: locationForStatus(status),
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
      location: patch.location ?? locationForStatus(status),
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
      location: patch.location ?? locationForStatus(status),
      updatedAt: patch.updatedAt ?? nowLabel(),
    };
  });
}

function persistAndReturn(records: StudentTravelRecord[]) {
  writeTravelRecords(records);
  return records;
}

export function travelStatusLabel(status: StudentTravelStatus, audience: 'parent' | 'teacher' = 'parent') {
  if (audience === 'teacher' && status === 'present') return 'Present';
  if (audience === 'parent' && (status === 'present' || status === 'reached_school' || status === 'reached_home')) return 'SafeReach';
  if (audience === 'teacher' && status === 'reached_home') return 'SafeReach';
  const labels: Record<StudentTravelStatus, string> = {
    at_home: 'At Home',
    to_school: 'Tracking to School',
    reached_school: 'Reached School',
    present: 'Reached School',
    absent: 'Absent',
    going_home: 'Tracking to Home',
    reached_home: 'Reached Home',
  };
  return labels[status];
}

export function travelStatusIcon(status: StudentTravelStatus) {
  const icons: Record<StudentTravelStatus, string> = {
    at_home: 'home',
    to_school: 'directions_walk',
    reached_school: 'school',
    present: 'task_alt',
    absent: 'sms_failed',
    going_home: 'directions_bus',
    reached_home: 'home_pin',
  };
  return icons[status];
}

export function travelStatusClass(status: StudentTravelStatus) {
  const classes: Record<StudentTravelStatus, string> = {
    at_home: 'bg-surface-container text-on-surface-variant',
    to_school: 'bg-yellow-100 text-yellow-700',
    reached_school: 'bg-green-100 text-green-700',
    present: 'bg-green-100 text-green-700',
    absent: 'bg-error-container text-error',
    going_home: 'bg-yellow-100 text-yellow-700',
    reached_home: 'bg-green-100 text-green-700',
  };
  return classes[status];
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
    backendBaseRecords = backend.students.map(backendStudentToTravelRecord);
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
    async readyToSend(studentId: string) {
      commitRecords(current => applyLocalTravelPatch(current, studentId, {
        status: 'to_school',
        attendance: 'pending',
        absenceReason: '',
        absenceReasonRequested: false,
        absenceSmsSentAt: '',
      }));
      const requestPayload = { studentId, actorUserId: null };
      const payload = await realtimeRequest<BackendTravelPayload>('student.ready_to_school', requestPayload, `/student-travel/${encodeURIComponent(studentId)}/ready-to-school`, {
        method: 'POST',
        body: JSON.stringify({ actorUserId: null }),
      });
      const existingRecord = recordsRef.current.find(item => item.id === studentId);
      commitRecords(current => applyBackendTravelPayload(current, payload).map(record =>
          record.id === studentId
            ? { ...record, attendance: 'pending', absenceReason: '', absenceReasonRequested: false, absenceSmsSentAt: '' }
            : record
      ));
      const record = existingRecord ? { ...existingRecord, status: 'to_school' as const } : recordsRef.current.find(item => item.id === studentId);
      if (record) {
        appendDb3RealtimeEvent(record, {
          table: 'parent_events',
          actor: 'parent',
          event: 'Ready to Send',
          status: 'to_school',
          detail: `${record.name} is now Tracking to School.`,
        });
        appendDb3RealtimeEvent(record, {
          table: 'students_status',
          actor: 'system',
          event: 'Student travel status update',
          status: 'to_school',
          detail: 'Parent started school trip tracking.',
        });
      }
    },
    async markPresent(studentId: string) {
      commitRecords(current => applyLocalTravelPatch(current, studentId, {
        status: 'present',
        attendance: 'present',
        absenceReasonRequested: false,
      }));
      const requestPayload = { studentId, status: 'present', actorUserId: null };
      const payload = await realtimeRequest<BackendTravelPayload>('attendance.submit', requestPayload, `/student-travel/${encodeURIComponent(studentId)}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ status: 'present', actorUserId: null }),
      });
      commitRecords(current => applyBackendTravelPayload(current, payload).map(record =>
        record.id === studentId ? { ...record, absenceReasonRequested: false } : record
      ));
    },
    async markLate(studentId: string) {
      commitRecords(current => applyLocalTravelPatch(current, studentId, {
        status: 'reached_school',
        attendance: 'late',
        absenceReasonRequested: false,
      }));
      const requestPayload = { studentId, status: 'late', actorUserId: null };
      const payload = await realtimeRequest<BackendTravelPayload>('attendance.submit', requestPayload, `/student-travel/${encodeURIComponent(studentId)}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ status: 'late', actorUserId: null }),
      });
      commitRecords(current => applyBackendTravelPayload(current, payload).map(record =>
        record.id === studentId ? { ...record, absenceReasonRequested: false } : record
      ));
    },
    async markReachedSchool(studentId: string) {
      commitRecords(current => applyLocalTravelPatch(current, studentId, {
        status: 'present',
        attendance: 'present',
        absenceReasonRequested: false,
      }));
      const requestPayload = { studentId, status: 'present', actorUserId: null };
      const payload = await realtimeRequest<BackendTravelPayload>('attendance.submit', requestPayload, `/student-travel/${encodeURIComponent(studentId)}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ status: 'present', actorUserId: null }),
      });
      commitRecords(current => applyBackendTravelPayload(current, payload).map(record =>
        record.id === studentId ? { ...record, absenceReasonRequested: false } : record
      ));
    },
    async markAbsent(studentId: string) {
      commitRecords(current => applyLocalTravelPatch(current, studentId, {
        status: 'absent',
        attendance: 'absent',
        absenceReason: '',
        absenceReasonRequested: false,
        absenceSmsSentAt: '',
      }));
      const requestPayload = { studentId, status: 'absent', actorUserId: null };
      const payload = await realtimeRequest<BackendTravelPayload>('attendance.submit', requestPayload, `/student-travel/${encodeURIComponent(studentId)}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ status: 'absent', actorUserId: null }),
      });
      commitRecords(current => applyBackendTravelPayload(current, payload).map(record =>
        record.id === studentId ? { ...record, absenceReasonRequested: false, absenceSmsSentAt: '' } : record
      ));
    },
    async submitAbsenceReason(studentId: string, reason: string) {
      const cleanReason = reason.trim();
      const payload = await realtimeRequest<AbsenceReasonPayload, AbsenceReasonPayload>(
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
      const payload = await realtimeRequest<AbsenceNotificationPayload, AbsenceNotificationPayload>(
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
    async markLeavingSchool(studentIds: string[]) {
      commitRecords(current => applyLocalTravelPatchMany(current, studentIds, {
        status: 'going_home',
      }));
      const requestPayload = { studentIds, actorUserId: null };
      const payload = await realtimeRequest<{ ok: boolean; records: BackendTravelPayload[] }>('travel.go_out', requestPayload, '/student-travel/go-out', {
        method: 'POST',
        body: JSON.stringify({ studentIds, actorUserId: null }),
      });
      commitRecords(current => payload.records.reduce((next, recordPayload) => applyBackendTravelPayload(next, recordPayload), current));
    },
    async markReachedHome(studentId: string) {
      commitRecords(current => applyLocalTravelPatch(current, studentId, {
        status: 'reached_home',
      }));
      const requestPayload = { studentId, actorUserId: null };
      const payload = await realtimeRequest<BackendTravelPayload>('parent.reached_home', requestPayload, `/student-travel/${encodeURIComponent(studentId)}/reached-home`, {
        method: 'POST',
        body: JSON.stringify({ actorUserId: null }),
      });
      commitRecords(current => applyBackendTravelPayload(current, payload));
    },
    sendStatusSms(studentId: string, status: TeacherSmsStatus) {
      setRecords(updateOneWithSms(studentId, status, {}));
    },
    resetDemo() {
      writeTravelRecords(backendBaseRecords);
      setRecords(backendBaseRecords);
    },
  }), [commitRecords]);


  const teacherAssignment = getCurrentTeacherAssignment(backend);
  const classStudents = records.filter(record =>
    record.className === teacherAssignment.className && record.section === teacherAssignment.sectionName
  );

  const parentChildren = records.filter(record => record.isParentChild);

  return {
    records,
    parentChildren,
    classStudents,
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
