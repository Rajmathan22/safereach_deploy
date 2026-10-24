'use client';

import { useEffect, useState } from 'react';
import { apiBaseUrl } from './runtimeConfig';
import { safereachRealtime } from './realtimeApi';

const API_BASE = apiBaseUrl;

export type BackendSchool = {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  status: string;
  /** 'school' | 'college'; absent on legacy rows → treated as 'school'. */
  institution_type?: string;
  school_open_time?: string;
  school_close_time?: string;
  created_at?: string;
};

export type BackendStudent = {
  id: string;
  school_id?: string;
  school_name?: string;
  school_code?: string;
  class_id?: string;
  section_id?: string;
  student_code: string;
  full_name: string;
  roll_no: string;
  gender?: string;
  date_of_birth?: string;
  emergency_notes?: string;
  class_name: string;
  section_name: string;
  guardian_name: string;
  parent_phone: string;
  parent_email?: string;
  parent_id?: string;
  parent_user_id?: string;
  sms_enabled: boolean;
  travel_status: string;
  attendance_status: string;
  travel_updated_at?: string;
  absence_reason?: string;
  absence_sms_sent_at?: string;
};

export type BackendTeacher = {
  id: string;
  school_id?: string;
  school_name?: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  employee_code: string;
  subject: string;
  qualification: string;
  status: string;
  assignments: Array<{ className: string; sectionName: string; assignmentType: string; subject: string }>;
};

export type BackendClass = {
  id: string;
  school_id?: string;
  school_name?: string;
  class_name: string;
  sort_order: number;
  sections: Array<{ id: string; name: string; room: string }>;
};

export type BackendReport = {
  id: string;
  school_id?: string;
  school_name?: string;
  report_title: string;
  safety_score: number;
  alert_count: number;
  attendance_percent: string;
  report_text: string;
  class_name?: string | null;
  section_name?: string | null;
  created_at?: string;
};

export type BackendIncident = {
  id: string;
  school_id?: string;
  school_name?: string;
  incident_code: string;
  incident_type: string;
  level: string;
  priority: string;
  status: string;
  handler_name: string;
  student_name: string;
  class_name: string;
  section_name: string;
  detail: string;
  incident_time?: string;
};

export type BackendAttendance = {
  id: string;
  school_id?: string;
  school_name?: string;
  student_id: string;
  student_code?: string;
  student_name: string;
  class_name?: string;
  section_name?: string;
  attendance_date: string;
  session: string;
  status: string;
  reason?: string;
  locked: boolean;
  created_at?: string;
};

export type BackendApiTest = {
  id: string;
  test_name: string;
  service_name: string;
  status: string;
  detail: string;
  created_at: string;
};

export type BackendAuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload?: any;
  actor_user_id?: string;
  actor_name: string;
  actor_role: string;
  school_id?: string;
  school_name: string;
  created_at: string;
};

export type BackendAcademicResults = {
  exams: Array<{ id: string; school_id: string; class_id: string; section_id: string; name: string; active: boolean; class_name: string; section_name: string }>;
  components: Array<{ id: string; exam_id: string; subject: string; label: string; maximum_marks: string | number; sort_order: number }>;
  marks: Array<{ student_id: string; result_component_id: string; marks_obtained: string | number; updated_at: string }>;
};

export type BackendBootstrap = {
  schools: BackendSchool[];
  classes: BackendClass[];
  teachers: BackendTeacher[];
  students: BackendStudent[];
  attendance: BackendAttendance[];
  reports: BackendReport[];
  incidents: BackendIncident[];
  apiTests: BackendApiTest[];
  timetable: {
    className: string;
    section: string;
    breaks: Array<{ id: string; label: string; afterPeriod: number; tone: string }>;
    days: Array<{ id: string; label: string; periods: string[] }>;
  };
  academicResults: BackendAcademicResults;
  auditLogs?: BackendAuditLog[];
};

const emptyBootstrap: BackendBootstrap = {
  schools: [],
  classes: [],
  teachers: [],
  students: [],
  attendance: [],
  reports: [],
  incidents: [],
  apiTests: [],
  timetable: { className: '', section: '', breaks: [], days: [] },
  academicResults: { exams: [], components: [], marks: [] },
  auditLogs: [],
};

type TravelUpdate = {
  student_id: string;
  status: string;
  attendance_status?: string;
  last_event_at?: string;
};

function applyTravelUpdates(current: BackendBootstrap, updates: TravelUpdate[]) {
  if (updates.length === 0) return current;
  const byStudentId = new Map(updates.map(update => [update.student_id, update]));
  return {
    ...current,
    students: current.students.map(student => {
      const update = byStudentId.get(student.id);
      if (!update) return student;
      return {
        ...student,
        travel_status: update.status,
        attendance_status: update.attendance_status ?? student.attendance_status,
        travel_updated_at: update.last_event_at ?? student.travel_updated_at,
      };
    }),
    attendance: current.attendance.map(record => {
      const update = byStudentId.get(record.student_id);
      if (!update || !update.attendance_status) return record;
      return { ...record, status: update.attendance_status };
    }),
  };
}

export function useBackendBootstrap() {
  const [data, setData] = useState<BackendBootstrap>(emptyBootstrap);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/bootstrap`, { cache: 'no-store' })
      .then(async response => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const message = payload && typeof payload.message === 'string'
            ? payload.message
            : `Backend returned ${response.status}`;
          throw new Error(message);
        }
        return payload as BackendBootstrap;
      })
      .then(payload => {
        if (!active) return;
        setData(payload);
        setError('');
      })
      .catch(reason => {
        if (!active) return;
        setData(emptyBootstrap);
        setError(reason instanceof Error ? reason.message : 'Backend data unavailable');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const updateFromPayload = (payload: unknown) => {
      const candidate = payload as Partial<TravelUpdate> & { records?: TravelUpdate[] };
      const updates: TravelUpdate[] = Array.isArray(candidate.records)
        ? candidate.records
        : typeof candidate.student_id === 'string' ? [candidate as TravelUpdate] : [];
      if (updates.length > 0) setData(current => applyTravelUpdates(current, updates));
    };
    const updateFromTravelSnapshot = (event: Event) => {
      if (!(event instanceof CustomEvent) || !Array.isArray(event.detail)) return;
      const updates = event.detail
        .filter((record: unknown): record is { id: string; status: string; attendance: string; updatedAt?: string } =>
          Boolean(record) && typeof (record as { id?: unknown }).id === 'string'
        )
        .map(record => ({
          student_id: record.id,
          status: record.status,
          attendance_status: record.attendance,
          last_event_at: record.updatedAt,
        }));
      setData(current => applyTravelUpdates(current, updates));
    };
    const refreshAcademicResults = () => {
      fetch(`${API_BASE}/academic-results`, { cache: 'no-store' })
        .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to refresh results')))
        .then(academicResults => setData(current => ({ ...current, academicResults })))
        .catch(() => undefined);
    };

    safereachRealtime.connect();
    const unsubscribe = safereachRealtime.subscribe(event => {
      if (event.type === 'results.updated') {
        refreshAcademicResults();
        return;
      }
      if (event.type !== 'student.status.changed' && event.type !== 'attendance.marked') return;
      updateFromPayload(event.payload);
    });
    window.addEventListener('safereach-travel-state-updated', updateFromTravelSnapshot);
    window.addEventListener('safereach-results-updated', refreshAcademicResults);
    return () => {
      unsubscribe();
      window.removeEventListener('safereach-travel-state-updated', updateFromTravelSnapshot);
      window.removeEventListener('safereach-results-updated', refreshAcademicResults);
    };
  }, []);

  return { data, loading, error };
}

export function statusLabel(status: string) {
  return status.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
