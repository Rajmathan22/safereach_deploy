'use client';

import Link from '@/src/next-link';
import { useState } from 'react';
import {
  useParentActiveChild,
  useStudentTravelState,
  travelStatusClass,
  travelStatusIcon,
  travelStatusLabel,
} from '@/lib/studentTravel';

export default function ParentStudentsPage() {
  const { children, activeChild, activeChildId, selectChild, actions } = useParentActiveChild();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  function showToast(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  }

  async function handleStartTrip(studentId: string, name: string) {
    setActionLoading(studentId);
    try {
      await actions.readyToSend(studentId);
      showToast(`🎉 Trip started! ${name} is now Tracking to School.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to start trip');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmReachedHome(studentId: string, name: string) {
    setActionLoading(studentId);
    try {
      await actions.markReachedHome(studentId);
      showToast(`✅ Safe arrival recorded! ${name} is safely at home.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to confirm arrival');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="px-container-padding-mobile md:px-container-padding-desktop py-stack-lg space-y-6 max-w-7xl mx-auto">
      {notice && (
        <div className="bg-primary text-on-primary px-4 py-3 rounded-xl shadow-md font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">notifications_active</span>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice('')} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-primary">My Children</h1>
          <p className="text-label-md text-on-surface-variant">
            Live travel safety monitoring and academic records for your enrolled children.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full w-fit">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          {children.length} Enrolled {children.length === 1 ? 'Child' : 'Children'} Linked
        </div>
      </div>

      {/* Children List */}
      <div className="space-y-6">
        {children.map(child => {
          const isSelected = child.id === activeChildId;
          const isLoading = actionLoading === child.id;

          return (
            <div
              key={child.id}
              className={`bg-white rounded-3xl shadow-sm border transition-all overflow-hidden ${
                isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant/40'
              }`}
            >
              {/* Card Banner */}
              <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-on-primary">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-extrabold text-2xl border-2 border-white/30 text-white shrink-0">
                      {child.avatar || child.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-headline-md font-bold text-white">{child.name}</h2>
                        {isSelected && (
                          <span className="px-2.5 py-0.5 rounded-full bg-white text-primary font-bold text-xs shadow-sm">
                            Active Monitor
                          </span>
                        )}
                      </div>
                      <p className="text-white/85 text-label-md mt-0.5">
                        {child.className} - Section {child.section} • Roll No: <span className="font-bold">{child.roll}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm ${travelStatusClass(child.status)}`}>
                          <span className="material-symbols-outlined text-[15px]">{travelStatusIcon(child.status)}</span>
                          {travelStatusLabel(child.status, 'parent')}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
                          Attendance: {child.attendance === 'present' ? 'Present Today' : child.attendance === 'absent' ? 'Absent Today' : child.attendance === 'late' ? 'Late Today' : 'Pending Check-in'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isSelected && (
                      <button
                        type="button"
                        onClick={() => {
                          selectChild(child.id);
                          showToast(`Active monitoring switched to ${child.name}`);
                        }}
                        className="px-4 py-2 bg-white/20 hover:bg-white text-white hover:text-primary font-bold rounded-xl text-xs transition-all border border-white/30"
                      >
                        Set as Active
                      </button>
                    )}

                    {child.status === 'at_home' && (
                      <button
                        type="button"
                        onClick={() => handleStartTrip(child.id, child.name)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white text-primary font-bold rounded-xl text-xs shadow-md hover:bg-white/90 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">directions_walk</span>
                        {isLoading ? 'Starting...' : 'Start Trip to School'}
                      </button>
                    )}

                    {child.status === 'going_home' && (
                      <button
                        type="button"
                        onClick={() => handleConfirmReachedHome(child.id, child.name)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">home_pin</span>
                        {isLoading ? 'Confirming...' : 'Confirm Reached Home'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Details Grid */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-surface-container/40 rounded-2xl p-4 border border-outline-variant/30">
                    <p className="text-label-sm text-on-surface-variant mb-1">Current Location</p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[20px]">location_on</span>
                      <p className="text-body-md font-bold text-on-surface">{child.location || 'SafeReach Campus'}</p>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">Updated: {child.updatedAt}</p>
                  </div>

                  <div className="bg-surface-container/40 rounded-2xl p-4 border border-outline-variant/30">
                    <p className="text-label-sm text-on-surface-variant mb-1">Class Teacher / Incharge</p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                      <p className="text-body-md font-bold text-on-surface">{child.teacherName || 'Sarah Jenkins'}</p>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">Incharge for {child.className}-{child.section}</p>
                  </div>

                  <div className="bg-surface-container/40 rounded-2xl p-4 border border-outline-variant/30">
                    <p className="text-label-sm text-on-surface-variant mb-1">Parent / Guardian</p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">family_restroom</span>
                      <p className="text-body-md font-bold text-on-surface">{child.parentName}</p>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">{child.parentPhone}</p>
                  </div>

                  <div className="bg-surface-container/40 rounded-2xl p-4 border border-outline-variant/30">
                    <p className="text-label-sm text-on-surface-variant mb-1">Safety Status</p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-600 text-[20px]">verified</span>
                      <p className="text-body-md font-bold text-on-surface">
                        {child.absenceReasonRequested ? 'Absence reason requested' : 'Secure & Monitored'}
                      </p>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">SafeReach ID: {child.roll}</p>
                  </div>
                </div>

                {/* Action Links */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    href="/parent/messages"
                    className="flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold bg-primary text-on-primary rounded-xl hover:opacity-90 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    Message Incharge
                  </Link>

                  <Link
                    href="/parent/attendance"
                    className="flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold border border-outline-variant bg-surface hover:bg-surface-container rounded-xl text-primary transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                    Attendance History
                  </Link>

                  <Link
                    href="/parent/reports"
                    className="flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold border border-outline-variant bg-surface hover:bg-surface-container rounded-xl text-secondary transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                    Exam Results
                  </Link>

                  <Link
                    href="/parent/timetable"
                    className="flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold border border-outline-variant bg-surface hover:bg-surface-container rounded-xl text-tertiary transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    Timetable
                  </Link>

                  <Link
                    href="/parent/children/records"
                    className="py-2.5 px-4 text-xs font-bold border border-outline-variant bg-surface hover:bg-surface-container rounded-xl text-on-surface-variant transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">id_card</span>
                    Full Records
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {children.length === 0 && (
          <div className="bg-surface-container-lowest p-12 rounded-3xl text-center border border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant text-[48px] mb-3">child_care</span>
            <h3 className="font-headline-md text-primary mb-1">No Linked Children Found</h3>
            <p className="text-body-md text-on-surface-variant max-w-md mx-auto">
              No student records are currently associated with your parent account. Please contact your school administrator to link your student.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

