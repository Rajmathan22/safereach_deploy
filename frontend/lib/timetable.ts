'use client';

import { apiBaseUrl } from './runtimeConfig';

export type TimetableDay = {
  id: string;
  label: string;
  periods: string[];
};

export type TimetableBreak = {
  id: 'interval1' | 'lunch' | 'interval2' | string;
  label: string;
  afterPeriod: number;
  tone: 'interval' | 'lunch';
};

export type TimetableData = {
  classId?: string;
  sectionId?: string;
  className: string;
  section: string;
  breakAfterPeriod2?: string;
  lunchAfterPeriod4?: string;
  breakAfterPeriod6?: string;
  breaks: TimetableBreak[];
  days: TimetableDay[];
  subjectTeachers?: Record<string, string>;
};

export const STANDARD_SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'Computer Science',
  'Tamil',
  'Hindi',
  'Physical Education',
  'Art & Craft',
  'Library',
  'Music',
  'Value Education',
  'Moral Science',
  'Activity',
  'Revision',
  'Free',
];

export const PERIOD_TIMINGS: Array<{ period: number; time: string }> = [
  { period: 1, time: '08:30 - 09:15' },
  { period: 2, time: '09:15 - 10:00' },
  { period: 3, time: '10:15 - 11:00' },
  { period: 4, time: '11:00 - 11:45' },
  { period: 5, time: '12:30 - 01:15' },
  { period: 6, time: '01:15 - 02:00' },
  { period: 7, time: '02:15 - 03:00' },
  { period: 8, time: '03:00 - 03:45' },
];

export const TIMETABLE_STORAGE_KEY = 'safereach_class_timetable_cache';

export const defaultTimetable: TimetableData = {
  className: 'Class 4',
  section: 'B',
  breakAfterPeriod2: 'Morning Break',
  lunchAfterPeriod4: 'Lunch Break',
  breakAfterPeriod6: 'Afternoon Break',
  breaks: [
    { id: 'interval1', label: 'Morning Break', afterPeriod: 2, tone: 'interval' },
    { id: 'lunch', label: 'Lunch Break', afterPeriod: 4, tone: 'lunch' },
    { id: 'interval2', label: 'Afternoon Break', afterPeriod: 6, tone: 'interval' },
  ],
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((label, index) => ({
    id: label.toLowerCase(),
    label,
    periods: [
      ['English', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'Tamil', 'Activity', 'Library'],
      ['Mathematics', 'Science', 'English', 'Tamil', 'Social Studies', 'Computer Science', 'Physical Education', 'Art & Craft'],
      ['Science', 'English', 'Mathematics', 'Computer Science', 'Tamil', 'Social Studies', 'Library', 'Activity'],
      ['Tamil', 'Mathematics', 'Science', 'English', 'Computer Science', 'Social Studies', 'Art & Craft', 'Physical Education'],
      ['Social Studies', 'English', 'Computer Science', 'Mathematics', 'Science', 'Tamil', 'Activity', 'Library'],
      ['Revision', 'Mathematics', 'Science', 'English', 'Value Education', 'Physical Education', 'Art & Craft', 'Library'],
    ][index],
  })),
  subjectTeachers: {
    English: 'Mr. James Anderson',
    Mathematics: 'Mrs. Sarah Jenkins',
    Science: 'Ms. Anita Roy',
    'Social Studies': 'Mr. David Lee',
    'Computer Science': 'Dr. Meera Patel',
    Tamil: 'Ms. Anita Roy',
    'Physical Education': 'Mr. David Lee',
    'Art & Craft': 'Mrs. Sarah Jenkins',
    Library: 'Counselor Deepa',
  },
};

export function normalizeTimetable(data: TimetableData): TimetableData {
  const periodCount = data.days?.[0]?.periods?.length || 8;
  const sourceBreaks = Array.isArray(data.breaks) && data.breaks.length
    ? data.breaks
    : [
        { id: 'interval1', label: data.breakAfterPeriod2 || 'Morning Break', afterPeriod: 2, tone: 'interval' },
        { id: 'lunch', label: data.lunchAfterPeriod4 || 'Lunch Break', afterPeriod: 4, tone: 'lunch' },
        { id: 'interval2', label: data.breakAfterPeriod6 || 'Afternoon Break', afterPeriod: 6, tone: 'interval' },
      ];
  const breaks = sourceBreaks.map(item => ({
    ...item,
    label: item.label || (item.id === 'lunch' ? 'Lunch Break' : 'Interval'),
    afterPeriod: Math.min(Math.max(Number(item.afterPeriod) || 1, 1), periodCount),
    tone: (item.id === 'lunch' || item.tone === 'lunch' ? 'lunch' : 'interval') as 'interval' | 'lunch',
  }));

  const interval1 = breaks.find(item => item.id === 'interval1')?.label || 'Morning Break';
  const lunch = breaks.find(item => item.id === 'lunch')?.label || 'Lunch Break';
  const interval2 = breaks.find(item => item.id === 'interval2')?.label || 'Afternoon Break';

  return {
    ...data,
    breaks,
    breakAfterPeriod2: interval1,
    lunchAfterPeriod4: lunch,
    breakAfterPeriod6: interval2,
  };
}

export function readCachedTimetable(className = 'Class 4', section = 'B'): TimetableData {
  if (typeof window === 'undefined') return defaultTimetable;
  try {
    const key = `${TIMETABLE_STORAGE_KEY}_${className}_${section}`.replace(/\s+/g, '_');
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '') as TimetableData;
    return parsed?.days?.length ? normalizeTimetable(parsed) : defaultTimetable;
  } catch {
    return defaultTimetable;
  }
}

export function writeCachedTimetable(data: TimetableData) {
  if (typeof window === 'undefined') return;
  const key = `${TIMETABLE_STORAGE_KEY}_${data.className}_${data.section}`.replace(/\s+/g, '_');
  window.localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('safereach-timetable-updated', { detail: data }));
}

export async function fetchTimetableApi(className?: string, section?: string): Promise<TimetableData> {
  const query = new URLSearchParams();
  if (className) query.set('className', className);
  if (section) query.set('section', section);

  try {
    const res = await fetch(`${apiBaseUrl}/timetables?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data && data.days && Array.isArray(data.days) && data.days.length > 0) {
      const normalized = normalizeTimetable(data);
      writeCachedTimetable(normalized);
      return normalized;
    }
  } catch {
    // Fallback to cache
  }
  return readCachedTimetable(className || 'Class 4', section || 'B');
}

export async function saveTimetableApi(data: TimetableData): Promise<TimetableData> {
  const res = await fetch(`${apiBaseUrl}/timetables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.message || `Failed to save timetable (HTTP ${res.status})`);
  }

  const normalized = normalizeTimetable(payload);
  writeCachedTimetable(normalized);
  return normalized;
}

export async function fetchAllClassTimetablesList(): Promise<Array<{
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  total_periods: number;
  total_days: number;
  incharge_name: string;
}>> {
  try {
    const res = await fetch(`${apiBaseUrl}/timetables/all`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch {
    return [];
  }
}
