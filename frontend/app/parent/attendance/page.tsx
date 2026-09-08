'use client';

import { useState } from 'react';
import {
  useParentActiveChild,
  travelStatusLabel,
  travelStatusIcon,
  travelStatusClass,
} from '@/lib/studentTravel';
import { useBackendBootstrap } from '@/lib/backendData';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ParentAttendancePage() {
  const { children, activeChild, activeChildId, selectChild, actions } = useParentActiveChild();
  const { data: bootstrap } = useBackendBootstrap();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Stay-at-home / Leave notice state
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [absenceCategory, setAbsenceCategory] = useState('Medical / Sick Leave');
  const [absenceNote, setAbsenceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const child = activeChild;

  function showToast(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  }

  async function handleStartTrip() {
    if (!child) return;
    setActionLoading(true);
    try {
      await actions.markDepartedHome(child.id);
      showToast(`🚗 Departed from Home! ${child.name} is now On Travel to School.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to mark departure');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmReachedHome() {
    if (!child) return;
    setActionLoading(true);
    try {
      await actions.markReachedHome(child.id);
      showToast(`🏡 Safe Arrival Recorded! ${child.name} has safely reached home.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to confirm arrival');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSubmitAbsence(e: React.FormEvent) {
    e.preventDefault();
    if (!child) return;
    if (!absenceNote.trim()) {
      showToast('Please provide a reason or note for the teacher.');
      return;
    }
    setSubmitting(true);
    const fullReason = `[${absenceCategory} - ${absenceDate}]: ${absenceNote.trim()}`;
    try {
      await actions.submitAbsenceReason(child.id, fullReason);
      showToast(`✅ Leave notice submitted to ${child.teacherName || 'Class Incharge'}.`);
      setShowAbsenceModal(false);
      setAbsenceNote('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  // Generate historical daily travel rows for the selected month
  const today = new Date().getDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

  const sampleDays = [
    { day: 22, dayName: 'Monday', departed: '07:45 AM', reachedSchool: '08:15 AM', outSchool: '03:30 PM', reachedHome: '04:05 PM', status: 'Completed' },
    { day: 21, dayName: 'Friday', departed: '07:42 AM', reachedSchool: '08:12 AM', outSchool: '03:30 PM', reachedHome: '04:02 PM', status: 'Completed' },
    { day: 20, dayName: 'Thursday', departed: '07:48 AM', reachedSchool: '08:18 AM', outSchool: '03:30 PM', reachedHome: '04:10 PM', status: 'Completed' },
    { day: 19, dayName: 'Wednesday', departed: '07:40 AM', reachedSchool: '08:10 AM', outSchool: '03:30 PM', reachedHome: '04:00 PM', status: 'Completed' },
    { day: 18, dayName: 'Tuesday', departed: '07:44 AM', reachedSchool: '08:14 AM', outSchool: '03:30 PM', reachedHome: '04:08 PM', status: 'Completed' },
    { day: 17, dayName: 'Monday', departed: '07:46 AM', reachedSchool: '08:16 AM', outSchool: '03:30 PM', reachedHome: '04:05 PM', status: 'Completed' },
    { day: 14, dayName: 'Friday', departed: '07:45 AM', reachedSchool: '08:15 AM', outSchool: '03:30 PM', reachedHome: '04:03 PM', status: 'Completed' },
    { day: 13, dayName: 'Thursday', departed: '—', reachedSchool: '—', outSchool: '—', reachedHome: '—', status: 'Medical Leave' },
    { day: 12, dayName: 'Wednesday', departed: '07:43 AM', reachedSchool: '08:11 AM', outSchool: '03:30 PM', reachedHome: '04:01 PM', status: 'Completed' },
    { day: 11, dayName: 'Tuesday', departed: '07:45 AM', reachedSchool: '08:15 AM', outSchool: '03:30 PM', reachedHome: '04:04 PM', status: 'Completed' },
  ];

  return (
    <div className="px-container-padding-mobile md:px-container-padding-desktop py-stack-lg space-y-6 max-w-7xl mx-auto">
      {notice && (
        <div className="bg-primary text-on-primary px-4 py-3 rounded-xl shadow-md font-bold flex items-center justify-between animate-fadeIn">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-primary">Student Travel & Presence Tracker</h1>
          <p className="text-label-md text-on-surface-variant">
            4-Stage Daily Journey & Presence Record for <span className="font-bold text-on-surface">{child?.name}</span> ({child?.className}-{child?.section})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAbsenceModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-surface-container border border-outline-variant font-bold text-primary rounded-xl shadow-sm hover:bg-surface-container-high active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">event_busy</span>
          Submit Stay-at-Home Notice
        </button>
      </div>

      {/* Child Switcher Tabs if parent has multiple children */}
      {children.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {children.map(c => (
            <button
              key={c.id}
              onClick={() => selectChild(c.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                c.id === activeChildId
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span>{c.name}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                c.id === activeChildId ? 'bg-white/20 text-white' : travelStatusClass(c.status)
              }`}>
                {travelStatusLabel(c.status)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Live Today's 4-Stage Travel Lifecycle Card */}
      {child && (
        <div className="bg-gradient-to-br from-primary-container/20 via-surface-container-lowest to-surface-container-low rounded-3xl border border-primary/20 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-outline-variant/30">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0">
                {child.avatar || child.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-headline-md font-headline-md text-primary">{child.name}</h2>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm ${travelStatusClass(child.status)}`}>
                    <span className="material-symbols-outlined text-[16px]">{travelStatusIcon(child.status)}</span>
                    {travelStatusLabel(child.status)}
                  </span>
                </div>
                <p className="text-label-md text-on-surface-variant mt-1">
                  Roll No: <span className="font-bold text-on-surface">{child.roll}</span> • Standard: <span className="font-bold text-on-surface">{child.className}-{child.section}</span> • Teacher Incharge: <span className="font-bold text-primary">{child.teacherName}</span>
                </p>
              </div>
            </div>

            {/* Live Parent Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {(child.status === 'at_home' || child.status === 'reached_home') && (
                <button
                  type="button"
                  onClick={handleStartTrip}
                  disabled={actionLoading}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-primary text-on-primary font-bold text-body-md rounded-2xl hover:opacity-95 active:scale-95 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined">directions_walk</span>
                  {actionLoading ? 'Updating...' : 'Mark Departed from Home'}
                </button>
              )}

              {child.status === 'to_school' && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-5 py-3 rounded-2xl text-amber-900 shadow-sm">
                  <span className="inline-block w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
                  <div>
                    <p className="text-sm font-bold">On Travel to School</p>
                    <p className="text-xs text-amber-700">Awaiting Teacher Arrival Confirmation</p>
                  </div>
                </div>
              )}

              {(child.status === 'reached_school' || child.status === 'present') && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-2xl text-emerald-900 shadow-sm">
                  <span className="material-symbols-outlined text-emerald-600 text-[26px]">verified</span>
                  <div>
                    <p className="font-bold text-sm">Reached School Safely</p>
                    <p className="text-xs text-emerald-700">In class • Verified by Teacher</p>
                  </div>
                </div>
              )}

              {child.status === 'going_home' && (
                <button
                  type="button"
                  onClick={handleConfirmReachedHome}
                  disabled={actionLoading}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-emerald-700 text-white font-bold text-body-md rounded-2xl hover:bg-emerald-800 active:scale-95 transition-all shadow-md animate-pulse"
                >
                  <span className="material-symbols-outlined">home_pin</span>
                  {actionLoading ? 'Confirming...' : 'Confirm Reached Home'}
                </button>
              )}
            </div>
          </div>

          {/* 4-Stage Travel Lifecycle Stepper */}
          <div className="mt-8">
            <h4 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-4">
              4-Stage Travel & Presence Workflow
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  step: 'Stage 1',
                  title: 'Departed Home',
                  actor: 'Parent Action',
                  desc: 'Marked on departure to school',
                  icon: 'directions_walk',
                  active: child.status !== 'at_home',
                  current: child.status === 'to_school',
                },
                {
                  step: 'Stage 2',
                  title: 'Reached School',
                  actor: 'Teacher Action',
                  desc: 'Verified arrival at school',
                  icon: 'school',
                  active: ['reached_school', 'present', 'going_home', 'reached_home'].includes(child.status),
                  current: child.status === 'reached_school' || child.status === 'present',
                },
                {
                  step: 'Stage 3',
                  title: 'Out of School',
                  actor: 'Teacher Action',
                  desc: 'Marked dismissal going home',
                  icon: 'directions_bus',
                  active: ['going_home', 'reached_home'].includes(child.status),
                  current: child.status === 'going_home',
                },
                {
                  step: 'Stage 4',
                  title: 'Reached Home',
                  actor: 'Parent Action',
                  desc: 'Confirmed safe arrival at home',
                  icon: 'home_pin',
                  active: child.status === 'reached_home',
                  current: child.status === 'reached_home',
                },
              ].map(stage => (
                <div
                  key={stage.step}
                  className={`p-4 rounded-2xl border transition-all ${
                    stage.current
                      ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm'
                      : stage.active
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-surface border-outline-variant/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-75">{stage.step}</span>
                    <span className={`material-symbols-outlined text-[20px] ${
                      stage.active ? 'text-emerald-700' : 'text-on-surface-variant'
                    }`}>{stage.icon}</span>
                  </div>
                  <p className="font-bold text-body-md text-on-surface">{stage.title}</p>
                  <span className="inline-block text-[11px] font-bold text-primary mt-0.5">{stage.actor}</span>
                  <p className="text-label-sm text-on-surface-variant mt-1">{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-emerald-800">22 Days</p>
          <p className="text-label-sm text-emerald-950 font-bold mt-1">Safe Journeys Completed</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-primary">100%</p>
          <p className="text-label-sm text-primary font-bold mt-1">Safe Reached Rate</p>
        </div>
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-blue-800">07:44 AM</p>
          <p className="text-label-sm text-blue-950 font-bold mt-1">Avg Departure Time</p>
        </div>
        <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-purple-800">04:04 PM</p>
          <p className="text-label-sm text-purple-950 font-bold mt-1">Avg Home Arrival</p>
        </div>
      </div>

      {/* Monthly Journey & Presence Log Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden">
        <div className="p-6 bg-surface-container-low border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">timeline</span>
              Daily Travel & Presence History
            </h3>
            <p className="text-label-sm text-on-surface-variant">Complete record of departure, school arrival, dismissal & home arrival</p>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-label-md focus:ring-2 focus:ring-primary outline-none font-bold text-on-surface"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-label-md focus:ring-2 focus:ring-primary outline-none font-bold text-on-surface"
            >
              {[2024, 2025, 2026].map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-surface-container text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">1. Departed Home</th>
                <th className="p-4">2. Reached School</th>
                <th className="p-4">3. Out of School</th>
                <th className="p-4">4. Reached Home</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {/* Today's live row */}
              {isCurrentMonth && (
                <tr className="bg-primary/5 font-bold border-l-4 border-l-primary">
                  <td className="p-4 text-primary">
                    Today ({monthNames[selectedMonth].slice(0, 3)} {today})
                  </td>
                  <td className="p-4 text-on-surface">
                    {child?.status !== 'at_home' ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Departed (Logged)
                      </span>
                    ) : (
                      <span className="text-on-surface-variant font-normal">Pending departure</span>
                    )}
                  </td>
                  <td className="p-4 text-on-surface">
                    {['reached_school', 'present', 'going_home', 'reached_home'].includes(child?.status || '') ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Verified (In Class)
                      </span>
                    ) : child?.status === 'to_school' ? (
                      <span className="text-amber-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        On Travel
                      </span>
                    ) : (
                      <span className="text-on-surface-variant font-normal">—</span>
                    )}
                  </td>
                  <td className="p-4 text-on-surface">
                    {['going_home', 'reached_home'].includes(child?.status || '') ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Dismissed
                      </span>
                    ) : (
                      <span className="text-on-surface-variant font-normal">—</span>
                    )}
                  </td>
                  <td className="p-4 text-on-surface">
                    {child?.status === 'reached_home' ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Safe at Home
                      </span>
                    ) : child?.status === 'going_home' ? (
                      <span className="text-amber-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        On Travel Home
                      </span>
                    ) : (
                      <span className="text-on-surface-variant font-normal">—</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${travelStatusClass(child?.status || 'at_home')}`}>
                      {travelStatusLabel(child?.status || 'at_home')}
                    </span>
                  </td>
                </tr>
              )}

              {/* Historical rows */}
              {sampleDays.map(row => (
                <tr key={row.day} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4 font-bold text-on-surface">
                    {monthNames[selectedMonth].slice(0, 3)} {row.day}, {selectedYear} ({row.dayName})
                  </td>
                  <td className="p-4 text-on-surface-variant">{row.departed}</td>
                  <td className="p-4 text-on-surface-variant">{row.reachedSchool}</td>
                  <td className="p-4 text-on-surface-variant">{row.outSchool}</td>
                  <td className="p-4 text-on-surface-variant">{row.reachedHome}</td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                      row.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {row.status === 'Completed' ? 'Safe Journey' : row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stay-at-Home / Leave Notice Modal */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">event_busy</span>
                <h3 className="font-headline-md text-headline-md text-primary">Submit Stay-at-Home Notice</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAbsenceModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAbsence} className="space-y-4">
              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Student</label>
                <input
                  disabled
                  value={`${child?.name} (${child?.className}-${child?.section})`}
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl font-bold text-on-surface"
                />
              </div>

              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={absenceDate}
                  onChange={e => setAbsenceDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Reason Category</label>
                <select
                  value={absenceCategory}
                  onChange={e => setAbsenceCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                >
                  <option>Medical / Sick Leave</option>
                  <option>Doctor Appointment</option>
                  <option>Family Emergency</option>
                  <option>Pre-planned Family Event</option>
                  <option>Transportation Issue</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Detailed Note</label>
                <textarea
                  required
                  rows={3}
                  value={absenceNote}
                  onChange={e => setAbsenceNote(e.target.value)}
                  placeholder="Inform the teacher why student is staying home and expected return date..."
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAbsenceModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant font-bold text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:opacity-95 active:scale-95 transition-all shadow-md"
                >
                  {submitting ? 'Submitting...' : 'Send Notice to Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
