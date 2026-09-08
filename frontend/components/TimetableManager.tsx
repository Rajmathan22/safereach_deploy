'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from '@/src/next-link';
import {
  type TimetableBreak,
  type TimetableData,
  type TimetableDay,
  PERIOD_TIMINGS,
  STANDARD_SUBJECTS,
  defaultTimetable,
  fetchTimetableApi,
  saveTimetableApi,
  normalizeTimetable,
} from '@/lib/timetable';
import { useBackendBootstrap } from '@/lib/backendData';
import { useParentActiveChild } from '@/lib/studentTravel';
import LoadingRing from '@/components/LoadingRing';

type TimetableManagerProps = {
  mode: 'admin' | 'teacher' | 'parent';
  editMode?: boolean;
  requestedClassName?: string;
  requestedSection?: string;
};

export default function TimetableManager({
  mode,
  editMode = false,
  requestedClassName = '',
  requestedSection = '',
}: TimetableManagerProps) {
  const { data: bootstrap, loading: bootstrapLoading } = useBackendBootstrap();
  const { children, activeChild, activeChildId, selectChild } = useParentActiveChild();

  const isParent = mode === 'parent';
  const canEdit = mode !== 'parent';
  const [isEditing, setIsEditing] = useState(canEdit && editMode);

  // Available classes & sections from bootstrap
  const classList = useMemo(() => {
    const list: Array<{ className: string; sectionName: string }> = [];
    bootstrap.classes.forEach(c => {
      if (c.sections && c.sections.length > 0) {
        c.sections.forEach(s => {
          list.push({ className: c.class_name, sectionName: s.name });
        });
      } else {
        list.push({ className: c.class_name, sectionName: 'A' });
      }
    });
    if (list.length === 0) {
      list.push({ className: 'Class 4', sectionName: 'A' });
      list.push({ className: 'Class 4', sectionName: 'B' });
    }
    return list;
  }, [bootstrap.classes]);

  // Selected Class & Section
  const [selectedClass, setSelectedClass] = useState(requestedClassName || 'Class 4');
  const [selectedSection, setSelectedSection] = useState(requestedSection || 'B');

  // Timetable State
  const [timetable, setTimetable] = useState<TimetableData>(defaultTimetable);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Teachers list for subject assignment
  const teacherOptions = useMemo(() => {
    const fromBoot = bootstrap.teachers.map(t => t.full_name).filter(Boolean);
    if (fromBoot.length > 0) return Array.from(new Set(fromBoot));
    return [
      'Mrs. Sarah Jenkins',
      'Mr. James Anderson',
      'Ms. Anita Roy',
      'Mr. David Lee',
      'Dr. Meera Patel',
      'Counselor Deepa',
    ];
  }, [bootstrap.teachers]);

  // Detect current day of week (e.g. "monday")
  const todayDayId = useMemo(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  }, []);

  // Update selected class if parent switches child
  useEffect(() => {
    if (isParent && activeChild) {
      setSelectedClass(activeChild.className || 'Class 4');
      setSelectedSection(activeChild.section || 'A');
    }
  }, [isParent, activeChild]);

  // Load Timetable from Backend API whenever selected class/section changes
  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchTimetableApi(selectedClass, selectedSection)
      .then(data => {
        if (!active) return;
        setTimetable(data);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setTimetable(defaultTimetable);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedClass, selectedSection]);

  function showToast(text: string, type: 'success' | 'error' | 'info' = 'success') {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  }

  // Extract unique subjects in current timetable
  const uniqueSubjects = useMemo(() => {
    const ignored = new Set(['', '-', 'free', 'interval', 'lunch', 'break']);
    const list = timetable.days
      .flatMap(d => d.periods)
      .map(p => p.trim())
      .filter(p => p && !ignored.has(p.toLowerCase()));
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [timetable.days]);

  // Period management
  const periodCount = timetable.days[0]?.periods.length || 8;

  function updatePeriod(dayId: string, periodIndex: number, value: string) {
    setTimetable(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === dayId
          ? {
              ...d,
              periods: d.periods.map((p, idx) => (idx === periodIndex ? value : p)),
            }
          : d
      ),
    }));
  }

  function addDay() {
    const allStandardDays = [
      { id: 'monday', label: 'Monday' },
      { id: 'tuesday', label: 'Tuesday' },
      { id: 'wednesday', label: 'Wednesday' },
      { id: 'thursday', label: 'Thursday' },
      { id: 'friday', label: 'Friday' },
      { id: 'saturday', label: 'Saturday' },
      { id: 'sunday', label: 'Sunday' },
    ];
    const existingIds = new Set(timetable.days.map(d => d.id.toLowerCase()));
    const nextDay = allStandardDays.find(d => !existingIds.has(d.id)) || {
      id: `day-${timetable.days.length + 1}`,
      label: `Day ${timetable.days.length + 1}`,
    };

    const newDay: TimetableDay = {
      id: nextDay.id,
      label: nextDay.label,
      periods: Array.from({ length: periodCount }, () => 'Free'),
    };

    setTimetable(prev => ({
      ...prev,
      days: [...prev.days, newDay],
    }));
    showToast(`Added ${nextDay.label} to timetable`, 'info');
  }

  function removeDay(dayId: string, label: string) {
    if (!window.confirm(`Delete ${label} from timetable?`)) return;
    setTimetable(prev => ({
      ...prev,
      days: prev.days.filter(d => d.id !== dayId),
    }));
    showToast(`Removed ${label}`, 'info');
  }

  function addPeriodColumn() {
    setTimetable(prev => ({
      ...prev,
      days: prev.days.map(d => ({
        ...d,
        periods: [...d.periods, 'Free'],
      })),
    }));
    showToast(`Added Period ${periodCount + 1}`, 'info');
  }

  function removePeriodColumn() {
    if (periodCount <= 1) return;
    if (!window.confirm(`Delete Period ${periodCount} column from all days?`)) return;
    setTimetable(prev => ({
      ...prev,
      days: prev.days.map(d => ({
        ...d,
        periods: d.periods.slice(0, -1),
      })),
    }));
    showToast(`Removed Period ${periodCount}`, 'info');
  }

  function updateBreak(breakId: string, patch: Partial<TimetableBreak>) {
    setTimetable(prev => ({
      ...prev,
      breaks: prev.breaks.map(b => (b.id === breakId ? { ...b, ...patch } : b)),
    }));
  }

  function updateSubjectTeacher(subject: string, teacherName: string) {
    setTimetable(prev => ({
      ...prev,
      subjectTeachers: {
        ...(prev.subjectTeachers || {}),
        [subject]: teacherName,
      },
    }));
  }

  async function handleSaveTimetable() {
    setSaving(true);
    try {
      const payload: TimetableData = {
        ...timetable,
        className: selectedClass,
        section: selectedSection,
      };
      const saved = await saveTimetableApi(payload);
      setTimetable(saved);
      showToast(`🎉 Timetable for ${selectedClass}-${selectedSection} saved successfully to database!`, 'success');
      setIsEditing(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save timetable', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleResetTemplate() {
    if (!window.confirm(`Reset ${selectedClass}-${selectedSection} timetable to standard school template?`)) return;
    setTimetable({
      ...defaultTimetable,
      className: selectedClass,
      section: selectedSection,
    });
    showToast('Reset to standard school template. Remember to click "Save Timetable".', 'info');
  }

  function breaksAfter(periodNo: number) {
    return (timetable.breaks || []).filter(b => b.afterPeriod === periodNo);
  }

  return (
    <div className="p-container-padding-mobile md:p-container-padding-desktop space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {notice && (
        <div
          className={`p-4 rounded-2xl font-bold shadow-md flex items-center justify-between animate-fadeIn ${
            notice.type === 'success'
              ? 'bg-emerald-600 text-white'
              : notice.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-primary text-on-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">
              {notice.type === 'success' ? 'check_circle' : notice.type === 'error' ? 'error' : 'info'}
            </span>
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-2xl shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[32px]">calendar_month</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-headline-lg font-headline-lg text-primary">Class Timetable</h1>
                <span className="px-3 py-1 bg-primary text-on-primary font-bold text-xs rounded-full shadow-sm">
                  {selectedClass} - Section {selectedSection}
                </span>
                {isEditing && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-full animate-pulse">
                    ● Edit Mode
                  </span>
                )}
              </div>
              <p className="text-label-md text-on-surface-variant mt-1">
                Weekly period bell schedule, subject allocations, and break timings.
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Parent Child Switcher */}
            {isParent && children.length > 1 && (
              <div className="flex items-center gap-2 bg-surface-container rounded-2xl p-1 border border-outline-variant">
                {children.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectChild(c.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      c.id === activeChildId
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {c.name} ({c.className}-{c.section})
                  </button>
                ))}
              </div>
            )}

            {/* Admin/Teacher Class Selector */}
            {!isParent && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-on-surface-variant hidden sm:inline">Class:</label>
                <select
                  value={`${selectedClass}|${selectedSection}`}
                  onChange={e => {
                    const [cName, sName] = e.target.value.split('|');
                    setSelectedClass(cName);
                    setSelectedSection(sName);
                  }}
                  className="bg-surface-container border border-outline-variant rounded-xl px-3.5 py-2.5 font-bold text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary shadow-sm"
                >
                  {classList.map(item => (
                    <option key={`${item.className}-${item.sectionName}`} value={`${item.className}|${item.sectionName}`}>
                      {item.className} - Section {item.sectionName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container font-bold text-xs text-on-surface transition-all shadow-sm"
              title="Print Timetable"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Edit / Save Actions */}
            {canEdit && (
              <>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Edit Timetable
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2.5 rounded-xl border border-outline-variant font-bold text-xs text-on-surface hover:bg-surface-container"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveTimetable}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-md disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {saving ? 'Saving...' : 'Save Timetable'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Edit Toolbar Sub-strip */}
        {isEditing && (
          <div className="mt-6 pt-4 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={addDay}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-secondary/10 text-secondary border border-secondary/30 font-bold text-xs rounded-xl hover:bg-secondary/20 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                Add Day
              </button>
              <button
                type="button"
                onClick={addPeriodColumn}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 text-primary border border-primary/30 font-bold text-xs rounded-xl hover:bg-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">view_column</span>
                Add Period
              </button>
              <button
                type="button"
                onClick={removePeriodColumn}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl hover:bg-rose-100 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete Last Period
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetTemplate}
              className="text-xs font-bold text-on-surface-variant hover:text-primary underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Reset to Standard Template
            </button>
          </div>
        )}
      </div>

      {/* Break & Interval Timing Settings (in Edit Mode) */}
      {isEditing && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-6 shadow-sm">
          <h3 className="font-headline-md text-headline-md text-primary mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">schedule</span>
            Break & Lunch Interval Positions
          </h3>
          <p className="text-label-sm text-on-surface-variant mb-5">
            Configure which period each interval and lunch break follows in the school bell schedule.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {timetable.breaks.map(brk => (
              <div
                key={brk.id}
                className={`p-4 rounded-2xl border ${
                  brk.tone === 'lunch'
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/60 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                    {brk.id === 'interval1' ? 'Morning Interval' : brk.id === 'lunch' ? 'Lunch Break' : 'Afternoon Interval'}
                  </span>
                  <span className="material-symbols-outlined text-[20px]">
                    {brk.tone === 'lunch' ? 'restaurant' : 'free_breakfast'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">Break Label</label>
                    <input
                      type="text"
                      value={brk.label}
                      onChange={e => updateBreak(brk.id, { label: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-outline-variant/60 font-bold text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">Placement (After Period)</label>
                    <select
                      value={brk.afterPeriod}
                      onChange={e => updateBreak(brk.id, { afterPeriod: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-outline-variant/60 font-bold text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    >
                      {Array.from({ length: periodCount }, (_, i) => i + 1).map(p => (
                        <option key={p} value={p}>After Period {p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Timetable Matrix */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center items-center">
            <LoadingRing size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left border-collapse">
              {/* Header: Periods & Timing */}
              <thead className="bg-primary text-on-primary text-center select-none">
                <tr>
                  <th className="p-4 w-32 font-extrabold text-left border-r border-white/20">Day</th>
                  {Array.from({ length: periodCount }, (_, pIdx) => {
                    const pNo = pIdx + 1;
                    const breaks = breaksAfter(pNo);
                    const timing = PERIOD_TIMINGS.find(t => t.period === pNo)?.time;

                    return (
                      <Fragment key={`head-p-${pNo}`}>
                        <th className="p-3.5 min-w-[130px] border-r border-white/10">
                          <span className="block font-black text-base">Period {pNo}</span>
                          {timing && (
                            <span className="block text-[11px] font-medium text-white/80 mt-0.5">{timing}</span>
                          )}
                        </th>
                        {breaks.map(b => (
                          <th
                            key={`head-brk-${b.id}`}
                            className={`p-2 w-14 font-extrabold text-[11px] uppercase tracking-wider text-center ${
                              b.tone === 'lunch' ? 'bg-emerald-800 text-emerald-100' : 'bg-amber-800 text-amber-100'
                            }`}
                          >
                            <span className="block">{b.label}</span>
                          </th>
                        ))}
                      </Fragment>
                    );
                  })}
                  {isEditing && <th className="p-4 w-20 text-center font-bold">Action</th>}
                </tr>
              </thead>

              {/* Rows: Daily Timetable */}
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {timetable.days.map(day => {
                  const isToday = day.id.toLowerCase() === todayDayId;

                  return (
                    <tr
                      key={day.id}
                      className={`transition-colors ${
                        isToday ? 'bg-primary/5 font-bold border-l-4 border-l-primary' : 'hover:bg-surface-container-lowest'
                      }`}
                    >
                      {/* Day Label */}
                      <td className="p-4 font-extrabold text-primary border-r border-outline-variant/30">
                        <div className="flex items-center gap-2">
                          <span>{day.label}</span>
                          {isToday && (
                            <span className="text-[10px] uppercase font-black bg-primary text-on-primary px-2 py-0.5 rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Periods & Breaks */}
                      {day.periods.map((subject, pIdx) => {
                        const pNo = pIdx + 1;
                        const breaks = breaksAfter(pNo);
                        const assignedTeacher = timetable.subjectTeachers?.[subject.trim()];

                        return (
                          <Fragment key={`${day.id}-p-${pNo}`}>
                            {/* Subject Period Cell */}
                            <td className="p-2.5 text-center align-middle border-r border-outline-variant/20 min-w-[130px]">
                              {isEditing ? (
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={subject}
                                    onChange={e => updatePeriod(day.id, pIdx, e.target.value)}
                                    list="standard-subjects"
                                    className="w-full px-2.5 py-2 bg-white rounded-xl border border-outline-variant font-bold text-center text-xs sm:text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none shadow-sm"
                                  />
                                </div>
                              ) : (
                                <div className="p-2 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 min-h-[56px] flex flex-col justify-center items-center">
                                  <p className="font-extrabold text-on-surface text-xs sm:text-sm leading-tight">
                                    {subject || '—'}
                                  </p>
                                  {assignedTeacher && subject && subject !== '-' && subject !== 'Free' && (
                                    <p className="text-[10px] text-on-surface-variant font-medium mt-1 truncate max-w-[120px]" title={assignedTeacher}>
                                      {assignedTeacher}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Break Column */}
                            {breaks.map(b => (
                              <td
                                key={`${day.id}-brk-${b.id}`}
                                className={`p-1 text-center align-middle ${
                                  b.tone === 'lunch'
                                    ? 'bg-emerald-50 text-emerald-900 border-x border-emerald-200/60'
                                    : 'bg-amber-50 text-amber-900 border-x border-amber-200/60'
                                }`}
                              >
                                <span className="text-[11px] font-extrabold uppercase tracking-tight block py-2 opacity-75">
                                  {b.tone === 'lunch' ? '🍱' : '☕'}
                                </span>
                              </td>
                            ))}
                          </Fragment>
                        );
                      })}

                      {/* Action Cell (in Edit Mode) */}
                      {isEditing && (
                        <td className="p-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => removeDay(day.id, day.label)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all font-bold text-xs"
                            title={`Delete ${day.label}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subject Teacher Mapping Section */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 mb-6">
          <div>
            <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person_outline</span>
              Subject Teacher Allocations
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              Assigned teachers will see their corresponding periods allocated on their teacher dashboard.
            </p>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={handleSaveTimetable}
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 shadow-sm transition-all"
            >
              {saving ? 'Saving...' : 'Save Allocations'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueSubjects.map(subject => {
            const currentTeacher = timetable.subjectTeachers?.[subject] || '';

            return (
              <div
                key={subject}
                className="p-4 rounded-2xl border border-outline-variant/40 bg-surface flex flex-col justify-between gap-2 shadow-xs"
              >
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">Subject</span>
                  <p className="font-extrabold text-on-surface text-base">{subject}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Assigned Teacher</label>
                  {isEditing ? (
                    <select
                      value={currentTeacher}
                      onChange={e => updateSubjectTeacher(subject, e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-xl font-bold text-xs text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="">— Select Teacher —</option>
                      {teacherOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-bold text-sm text-primary">
                      {currentTeacher || <span className="text-on-surface-variant font-normal">Not assigned</span>}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {uniqueSubjects.length === 0 && (
            <p className="col-span-full text-center text-on-surface-variant p-6">
              No subjects found in timetable yet. Add subjects to assign teachers.
            </p>
          )}
        </div>
      </div>

      {/* HTML5 Datalist for Standard Subjects in Edit Mode */}
      <datalist id="standard-subjects">
        {STANDARD_SUBJECTS.map(s => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
