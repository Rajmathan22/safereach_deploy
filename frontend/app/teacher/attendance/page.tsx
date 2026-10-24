'use client';

import { useState } from 'react';
import {
  travelStatusClass,
  travelStatusIcon,
  travelStatusLabel,
  useStudentTravelState,
} from '@/lib/studentTravel';
import { institutionWording } from '@/lib/institutionType';

type TabFilter = 'all' | 'to_school' | 'reached_school' | 'going_home' | 'reached_home';

export default function TeacherAttendancePage() {
  const { classStudents, counts, actions, institutionType } = useStudentTravelState();
  const w = institutionWording(institutionType);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [notice, setNotice] = useState('');

  function showNotice(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  }

  const filteredStudents = classStudents.filter(student => {
    // Tab filter
    if (activeTab === 'to_school' && student.status !== 'to_school') return false;
    if (activeTab === 'reached_school' && student.status !== 'reached_school' && student.status !== 'present') return false;
    if (activeTab === 'going_home' && student.status !== 'going_home') return false;
    if (activeTab === 'reached_home' && student.status !== 'reached_home') return false;

    // Search filter
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [
      student.roll,
      student.name,
      student.className,
      student.section,
      student.parentName,
      student.parentPhone,
      travelStatusLabel(student.status, 'teacher', institutionType),
    ].some(v => v.toLowerCase().includes(q));
  });

  // Action: Mark Reached School (Stage 2)
  async function handleMarkReachedSchool(studentId: string, studentName: string) {
    setActionLoadingId(studentId);
    try {
      await actions.markReachedSchool(studentId);
      showNotice(`🏫 ${studentName} marked as ${w.reached}.`);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Action: Mark Out of School (Stage 3)
  async function handleMarkOutOfSchool(studentId: string, studentName: string) {
    setActionLoadingId(studentId);
    try {
      await actions.markOutOfSchool([studentId]);
      showNotice(`🚌 ${studentName} marked as ${w.outOf}.`);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Bulk Actions
  async function handleMarkAllArrived() {
    const pendingArrival = classStudents
      .filter(s => s.status === 'to_school' || s.status === 'at_home')
      .map(s => s.id);
    if (pendingArrival.length === 0) {
      showNotice('All students are already marked as reached.');
      return;
    }
    setBulkLoading(true);
    try {
      await actions.markAllReachedSchool(pendingArrival);
      showNotice(`✅ Marked ${pendingArrival.length} student(s) as ${w.reached}.`);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleMarkAllOutOfSchool() {
    const atSchool = classStudents
      .filter(s => s.status === 'reached_school' || s.status === 'present')
      .map(s => s.id);
    if (atSchool.length === 0) {
      showNotice(`No students currently in ${w.nounLower} to mark out.`);
      return;
    }
    setBulkLoading(true);
    try {
      await actions.markAllOutOfSchool(atSchool);
      showNotice(`🚌 Marked ${atSchool.length} student(s) as ${w.outOf}.`);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="p-container-padding-mobile md:p-container-padding-desktop space-y-6 max-w-7xl mx-auto">
      {/* Notification Toast */}
      {notice && (
        <div className="bg-primary text-on-primary px-4 py-3 rounded-xl shadow-md font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">notifications_active</span>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice('')} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-primary">Student Travel & Presence Tracker</h1>
          <p className="text-label-md text-on-surface-variant">
            Live 4-Stage tracking: {w.departedFromHome} ➡️ {w.reached} ➡️ {w.outOf} ➡️ {w.reachedHome}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={bulkLoading}
            onClick={handleMarkAllArrived}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Mark All Arrived
          </button>
          <button
            type="button"
            disabled={bulkLoading}
            onClick={handleMarkAllOutOfSchool}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Mark All Out of {w.noun}
          </button>
        </div>
      </div>

      {/* 4-Stage Overview Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'to_school' ? 'all' : 'to_school')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'to_school'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-surface-container-lowest border-outline-variant/40 hover:bg-amber-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center material-symbols-outlined">
              directions_walk
            </span>
            <span className="text-headline-md font-headline-md text-amber-800">{counts.toSchool}</span>
          </div>
          <p className="font-bold text-on-surface text-body-sm">1. Departed Home</p>
          <p className="text-label-sm text-on-surface-variant">On travel to {w.nounLower}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'reached_school' ? 'all' : 'reached_school')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'reached_school'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-surface-container-lowest border-outline-variant/40 hover:bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center material-symbols-outlined">
              school
            </span>
            <span className="text-headline-md font-headline-md text-emerald-800">{counts.present}</span>
          </div>
          <p className="font-bold text-on-surface text-body-sm">2. {w.reached}</p>
          <p className="text-label-sm text-on-surface-variant">At {w.nounLower} campus</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'going_home' ? 'all' : 'going_home')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'going_home'
              ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
              : 'bg-surface-container-lowest border-outline-variant/40 hover:bg-sky-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center material-symbols-outlined">
              directions_bus
            </span>
            <span className="text-headline-md font-headline-md text-sky-800">{counts.goingHome}</span>
          </div>
          <p className="font-bold text-on-surface text-body-sm">3. {w.outOf}</p>
          <p className="text-label-sm text-on-surface-variant">On travel home</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'reached_home' ? 'all' : 'reached_home')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'reached_home'
              ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm'
              : 'bg-surface-container-lowest border-outline-variant/40 hover:bg-primary/5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-10 h-10 rounded-xl bg-primary-container text-primary flex items-center justify-center material-symbols-outlined">
              home_pin
            </span>
            <span className="text-headline-md font-headline-md text-primary">{counts.reachedHome}</span>
          </div>
          <p className="font-bold text-on-surface text-body-sm">4. Reached Home</p>
          <p className="text-label-sm text-on-surface-variant">Parent confirmed safe</p>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students by roll, name, or parent..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-outline-variant text-label-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All Students', count: classStudents.length },
            { key: 'to_school', label: 'On Travel', count: counts.toSchool },
            { key: 'reached_school', label: `In ${w.noun}`, count: counts.present },
            { key: 'going_home', label: w.outOf, count: counts.goingHome },
            { key: 'reached_home', label: 'Safe at Home', count: counts.reachedHome },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabFilter)}
              className={`px-3 py-1.5 rounded-lg text-label-sm font-bold shrink-0 transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface hover:bg-surface-container text-on-surface-variant border border-outline-variant/50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Student Travel Table */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-surface-container text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 w-16">Roll</th>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Current Stage</th>
                <th className="px-5 py-3.5 text-center">Stage 2: Arrival</th>
                <th className="px-5 py-3.5 text-center">Stage 3: Departure</th>
                <th className="px-5 py-3.5 text-right">Stage 4: Home Status</th>              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredStudents.map(student => {
                const isLoading = actionLoadingId === student.id;
                const isAtSchool = student.status === 'reached_school' || student.status === 'present';
                const isOut = student.status === 'going_home';
                const isHome = student.status === 'reached_home';
                const isDepartedFromHome = student.status === 'to_school';

                return (
                  <tr key={student.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4 font-bold text-on-surface-variant text-label-md">{student.roll}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                          {student.avatar || student.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface text-body-md">{student.name}</p>
                          <p className="text-label-sm text-on-surface-variant">{student.parentName} • {student.parentPhone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Current Stage Badge */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-bold border ${travelStatusClass(student.status)}`}>
                        <span className="material-symbols-outlined text-[16px]">{travelStatusIcon(student.status)}</span>
                        {travelStatusLabel(student.status, 'teacher', institutionType)}
                      </span>
                      {student.updatedAt && (
                        <p className="text-[11px] text-on-surface-variant mt-1 pl-1">{student.updatedAt}</p>
                      )}
                    </td>

                    {/* Stage 2 Action: Mark Reached School */}
                    <td className="px-5 py-4 text-center">
                      {isAtSchool ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-label-sm border border-emerald-200">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          In {w.noun}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoading || isOut || isHome}
                          onClick={() => handleMarkReachedSchool(student.id, student.name)}
                          className={`px-3.5 py-1.5 rounded-xl font-bold text-label-sm transition-all shadow-sm ${
                            isDepartedFromHome
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 animate-pulse'
                              : 'bg-surface-container-high text-on-surface-variant hover:bg-emerald-600 hover:text-white border border-outline-variant'
                          } disabled:opacity-40 disabled:pointer-events-none`}
                        >
                          {isLoading ? 'Saving...' : 'Mark Reached'}
                        </button>
                      )}
                    </td>

                    {/* Stage 3 Action: Mark Out of School */}
                    <td className="px-5 py-4 text-center">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 font-bold text-label-sm border border-sky-200">
                          <span className="material-symbols-outlined text-[16px]">directions_bus</span>
                          {w.outOf}
                        </span>
                      ) : isHome ? (
                        <span className="text-label-sm text-on-surface-variant/60 font-medium">Completed</span>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoading || !isAtSchool}
                          onClick={() => handleMarkOutOfSchool(student.id, student.name)}
                          className="px-3.5 py-1.5 rounded-xl font-bold text-label-sm bg-surface-container-high text-on-surface-variant hover:bg-sky-600 hover:text-white border border-outline-variant transition-all shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                        >
                          {isLoading ? 'Saving...' : 'Mark Out'}
                        </button>
                      )}
                    </td>

                    {/* Stage 4: Parent Reached Home Confirmation */}
                    <td className="px-5 py-4 text-right">
                      {isHome ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-label-sm border border-emerald-300">
                          <span className="material-symbols-outlined text-[16px]">home_pin</span>
                          Safe at Home
                        </span>
                      ) : isOut ? (
                        <span className="text-label-sm text-amber-700 font-bold animate-pulse">
                          Awaiting Parent...
                        </span>
                      ) : (
                        <span className="text-label-sm text-on-surface-variant/50">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-on-surface-variant">
                    No students match your filter or search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

