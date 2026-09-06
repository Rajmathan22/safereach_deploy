'use client';

import Link from '@/src/next-link';
import { useEffect, useState } from 'react';
import { useSafetyProtocols } from '@/lib/safetyProtocols';
import {
  useParentActiveChild,
  travelStatusClass,
  travelStatusIcon,
  travelStatusLabel,
} from '@/lib/studentTravel';

export default function ParentDashboardPage() {
  const { children, activeChild, activeChildId, selectChild, actions } = useParentActiveChild();
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const {
    protocols,
    loading: protocolsLoading,
    update: updateProtocol,
    submit: submitProtocolRows,
  } = useSafetyProtocols('parent');
  const [checkedProtocolIds, setCheckedProtocolIds] = useState<string[]>([]);

  useEffect(() => {
    setCheckedProtocolIds(protocols.filter(p => p.checked).map(p => p.id));
  }, [protocols]);

  function showNotice(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  }

  async function handleStartTrip() {
    if (!activeChild) return;
    setActionLoading(true);
    try {
      await actions.readyToSend(activeChild.id);
      showNotice(`🎉 Trip started! ${activeChild.name} is now Tracking to School.`);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmReachedHome() {
    if (!activeChild) return;
    setActionLoading(true);
    try {
      await actions.markReachedHome(activeChild.id);
      showNotice(`✅ Safe arrival recorded! ${activeChild.name} is safely at home.`);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Failed to confirm arrival');
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleProtocol(id: string) {
    const next = checkedProtocolIds.includes(id)
      ? checkedProtocolIds.filter(itemId => itemId !== id)
      : [...checkedProtocolIds, id];
    setCheckedProtocolIds(next);
    try {
      await submitProtocolRows(next);
    } catch {
      // Keep optimistic UI
    }
  }

  const child = activeChild;

  return (
    <div className="p-container-padding-mobile md:p-container-padding-desktop space-y-6 max-w-7xl mx-auto">
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

      {/* Multi-Child Quick Switch Bar if multiple children */}
      {children.length > 1 && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">family_restroom</span>
              Your Enrolled Children ({children.length})
            </h3>
            <span className="text-label-sm text-on-surface-variant">Tap to switch active monitor</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {children.map(c => {
              const isSelected = c.id === activeChildId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChild(c.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                      : 'border-outline-variant bg-surface hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-primary'
                    }`}>
                      {c.avatar || c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-body-md">{c.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{c.className} - Sec {c.section}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${travelStatusClass(c.status)}`}>
                    <span className="material-symbols-outlined text-[14px]">{travelStatusIcon(c.status)}</span>
                    {travelStatusLabel(c.status)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Hero: Student Safety Journey for Reaching School */}
      {child ? (
        <div className="bg-gradient-to-br from-primary-container/20 via-surface-container-lowest to-surface-container-low rounded-3xl border border-primary/20 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-outline-variant/30">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0">
                {child.avatar || child.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-headline-lg font-headline-lg text-primary">{child.name}</h1>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm ${travelStatusClass(child.status)}`}>
                    <span className="material-symbols-outlined text-[16px]">{travelStatusIcon(child.status)}</span>
                    {travelStatusLabel(child.status)}
                  </span>
                </div>
                <p className="text-label-md text-on-surface-variant mt-1">
                  Roll No: <span className="font-bold text-on-surface">{child.roll}</span> • Standard: <span className="font-bold text-on-surface">{child.className}-{child.section}</span> • Incharge: <span className="font-bold text-primary">{child.teacherName}</span>
                </p>
              </div>
            </div>

            {/* Main Safety Reaching Action Button */}
            <div className="flex flex-wrap items-center gap-3">
              {child.status === 'at_home' && (
                <button
                  type="button"
                  onClick={handleStartTrip}
                  disabled={actionLoading}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-primary text-on-primary font-bold text-body-md rounded-2xl hover:opacity-95 active:scale-95 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined">directions_walk</span>
                  {actionLoading ? 'Starting Trip...' : 'Start Trip to School'}
                </button>
              )}

              {child.status === 'to_school' && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-2xl">
                  <span className="inline-block w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
                  <div>
                    <p className="text-xs font-bold text-amber-900">In Transit to School</p>
                    <p className="text-label-sm text-amber-700">Awaiting Teacher Attendance Check-in</p>
                  </div>
                </div>
              )}

              {(child.status === 'reached_school' || child.status === 'present') && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-2xl text-emerald-900 shadow-sm">
                  <span className="material-symbols-outlined text-emerald-600 text-[26px]">verified</span>
                  <div>
                    <p className="font-bold text-body-md">Reached School Safely</p>
                    <p className="text-label-sm text-emerald-700">Class in session • Verified by Incharge</p>
                  </div>
                </div>
              )}

              {child.status === 'going_home' && (
                <button
                  type="button"
                  onClick={handleConfirmReachedHome}
                  disabled={actionLoading}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-emerald-700 text-white font-bold text-body-md rounded-2xl hover:bg-emerald-800 active:scale-95 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined">home_pin</span>
                  {actionLoading ? 'Confirming...' : 'Confirm Reached Home Safely'}
                </button>
              )}

              {child.status === 'reached_home' && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl text-emerald-900 font-bold">
                  <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                  <span>Safe at Home for Today</span>
                </div>
              )}
            </div>
          </div>

          {/* 4-Step Visual Student Reaching Timeline */}
          <div className="mt-8">
            <h4 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-4">
              Today's Daily Safety Reaching Timeline
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  step: '1. Departure',
                  title: 'Ready to School',
                  desc: 'Trip started from home',
                  icon: 'home',
                  active: child.status !== 'at_home',
                  current: child.status === 'to_school',
                },
                {
                  step: '2. Transit Check',
                  title: 'Safe Transit',
                  desc: 'En route / Bus GPS tracking',
                  icon: 'directions_bus',
                  active: child.status !== 'at_home',
                  current: child.status === 'to_school',
                },
                {
                  step: '3. School Gate',
                  title: 'Reached School',
                  desc: 'Attendance marked Present',
                  icon: 'school',
                  active: ['reached_school', 'present', 'going_home', 'reached_home'].includes(child.status),
                  current: child.status === 'reached_school' || child.status === 'present',
                },
                {
                  step: '4. Departure',
                  title: 'Reached Home',
                  desc: 'Parent safe arrival confirmed',
                  icon: 'home_pin',
                  active: child.status === 'reached_home',
                  current: child.status === 'going_home' || child.status === 'reached_home',
                },
              ].map(stage => (
                <div
                  key={stage.step}
                  className={`p-4 rounded-2xl border transition-all ${
                    stage.current
                      ? 'bg-primary/10 border-primary shadow-sm'
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
                  <p className="text-label-sm text-on-surface-variant mt-0.5">{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest p-8 rounded-2xl text-center border border-outline-variant">
          <p className="text-on-surface-variant">No child profile currently selected.</p>
        </div>
      )}

      {/* Quick Navigation Cards: Attendance, Marks, Timetable, Messages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/parent/attendance"
          className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 hover:border-primary hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">calendar_month</span>
          </div>
          <h3 className="font-bold text-headline-sm text-primary mb-1">Attendance Record</h3>
          <p className="text-label-sm text-on-surface-variant">View monthly presence calendar & submit absence reasons</p>
        </Link>

        <Link
          href="/parent/reports"
          className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 hover:border-primary hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
          </div>
          <h3 className="font-bold text-headline-sm text-secondary mb-1">Academic Marks</h3>
          <p className="text-label-sm text-on-surface-variant">View quarterly exam results, internal scores & performance card</p>
        </Link>

        <Link
          href="/parent/timetable"
          className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 hover:border-primary hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">schedule</span>
          </div>
          <h3 className="font-bold text-headline-sm text-tertiary mb-1">Class Timetable</h3>
          <p className="text-label-sm text-on-surface-variant">Daily periods, subjects, interval & lunch bell schedule</p>
        </Link>

        <Link
          href="/parent/messages"
          className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 hover:border-primary hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">forum</span>
          </div>
          <h3 className="font-bold text-headline-sm text-indigo-900 mb-1">Teacher Chat</h3>
          <p className="text-label-sm text-on-surface-variant">Direct channel with Class Incharge {child?.teacherName || 'Sarah Jenkins'}</p>
        </Link>
      </div>

      {/* Safety Protocols & Checklist Section */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">security</span>
              Daily Safety Protocol Checklist
            </h3>
            <p className="text-label-sm text-on-surface-variant">Verify morning departure preparations for student safety</p>
          </div>
          <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">
            {checkedProtocolIds.length}/{protocols.length} Completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {protocols.map(p => {
            const isChecked = checkedProtocolIds.includes(p.id);
            return (
              <label
                key={p.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                    : 'bg-surface border-outline-variant/50 hover:bg-surface-container-low'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleProtocol(p.id)}
                  className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
                />
                <span className="text-body-md">{p.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
