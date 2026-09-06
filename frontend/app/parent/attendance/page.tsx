'use client';

import { useState } from 'react';
import { useParentActiveChild } from '@/lib/studentTravel';
import { useBackendBootstrap } from '@/lib/backendData';

type DayStatus = 'present' | 'absent' | 'late' | 'holiday' | 'weekend' | 'future';

const styleCls: Record<DayStatus, string> = {
  present: 'bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200',
  absent: 'bg-red-100 text-red-800 font-bold ring-2 ring-red-300 hover:bg-red-200',
  late: 'bg-amber-100 text-amber-800 font-bold hover:bg-amber-200',
  holiday: 'bg-blue-100 text-blue-700 font-medium',
  weekend: 'bg-surface-container text-on-surface-variant/60 font-medium',
  future: 'bg-transparent text-on-surface-variant/30',
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ParentAttendancePage() {
  const { children, activeChild, activeChildId, selectChild, actions } = useParentActiveChild();
  const { data: bootstrap } = useBackendBootstrap();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Absence request form state
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [absenceCategory, setAbsenceCategory] = useState('Medical / Sick Leave');
  const [absenceNote, setAbsenceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();

  // Child-specific attendance calculation
  const child = activeChild;
  const childAttendance = bootstrap.attendance.filter(a => a.student_id === child?.id);
  const todayAtt = child ? child.attendance : 'present';

  const presentCount = 21 + (todayAtt === 'present' ? 1 : 0);
  const absentCount = 1 + (todayAtt === 'absent' ? 1 : 0);
  const lateCount = 1 + (todayAtt === 'late' ? 1 : 0);
  const totalDays = presentCount + absentCount + lateCount;
  const attendanceRate = Math.round((presentCount / totalDays) * 100);

  function showToast(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
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
      showToast(`✅ Absence reason submitted to ${child.teacherName || 'Class Incharge'}.`);
      setShowAbsenceModal(false);
      setAbsenceNote('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

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
          <h1 className="text-headline-lg font-headline-lg text-primary">Attendance Records</h1>
          <p className="text-label-md text-on-surface-variant">
            Viewing daily presence record for <span className="font-bold text-on-surface">{child?.name}</span> ({child?.className}-{child?.section})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAbsenceModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
          Submit Absence Reason
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-emerald-800">{presentCount} Days</p>
          <p className="text-label-sm text-emerald-950 font-bold mt-1">Present & Reached School</p>
        </div>
        <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-red-700">{absentCount} Day</p>
          <p className="text-label-sm text-red-950 font-bold mt-1">Recorded Absent</p>
        </div>
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-amber-800">{lateCount} Day</p>
          <p className="text-label-sm text-amber-950 font-bold mt-1">Late Arrivals</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-primary">{attendanceRate}%</p>
          <p className="text-label-sm text-primary font-bold mt-1">SafeReach Attendance Rate</p>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-headline-md text-headline-md text-primary">
              {monthNames[selectedMonth]} {selectedYear}
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-label-md focus:ring-2 focus:ring-primary outline-none"
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-label-md focus:ring-2 focus:ring-primary outline-none"
              >
                {[2024, 2025, 2026].map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">● Present</span>
            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800">● Absent</span>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">● Late</span>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">● Holiday</span>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="h-12 rounded-xl bg-transparent" />
          ))}

          {days.map(day => {
            const dayOfWeek = (firstDay + day - 1) % 7;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = day === new Date().getDate() && selectedMonth === new Date().getMonth();

            let status: DayStatus = 'present';
            if (isWeekend) status = 'weekend';
            else if (day === 15) status = 'absent';
            else if (day === 7) status = 'late';
            else if (day === 19) status = 'holiday';
            else if (day > new Date().getDate() && selectedMonth === new Date().getMonth()) status = 'future';

            return (
              <div
                key={day}
                className={`h-12 rounded-xl flex flex-col items-center justify-center text-body-md transition-all ${
                  styleCls[status]
                } ${isToday ? 'ring-2 ring-primary shadow-sm font-extrabold' : ''}`}
                title={`Day ${day}: ${status}`}
              >
                <span>{day}</span>
                {isToday && <span className="text-[9px] uppercase tracking-tighter -mt-1 font-bold">Today</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Absence History & Excuses */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden">
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Absence & Leave History
          </h3>
          <span className="text-xs text-on-surface-variant">Logged reasons with Class Incharge</span>
        </div>

        <div className="divide-y divide-outline-variant/20">
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">medical_services</span>
              </div>
              <div>
                <p className="font-bold text-body-md text-on-surface">May 15 - Fever & Viral Infection</p>
                <p className="text-label-sm text-on-surface-variant">Reason: Doctor prescribed 1 day rest • Acknowledged by Sarah Jenkins</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Excused</span>
          </div>

          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">flight</span>
              </div>
              <div>
                <p className="font-bold text-body-md text-on-surface">Apr 28 - Family Wedding</p>
                <p className="text-label-sm text-on-surface-variant">Reason: Out of station leave approved by Principal</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Approved</span>
          </div>
        </div>
      </div>

      {/* Absence Submission Modal */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">event_note</span>
                <h3 className="font-headline-md text-headline-md text-primary">Submit Absence Reason</h3>
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
                <label className="block text-label-md font-bold text-on-surface mb-1">Date of Absence</label>
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
                <label className="block text-label-md font-bold text-on-surface mb-1">Detailed Explanation</label>
                <textarea
                  required
                  rows={3}
                  value={absenceNote}
                  onChange={e => setAbsenceNote(e.target.value)}
                  placeholder="Explain why the student is absent and expected return date..."
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
                  {submitting ? 'Submitting...' : 'Send to Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
