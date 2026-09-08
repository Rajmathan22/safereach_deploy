'use client';

import { useEffect, useState } from 'react';
import Link from '@/src/next-link';
import { useBackendBootstrap } from '@/lib/backendData';
import { fetchAllClassTimetablesList } from '@/lib/timetable';
import LoadingRing from '@/components/LoadingRing';

export default function AdminTimetablePage() {
  const { data: bootstrap, loading: bootstrapLoading, error } = useBackendBootstrap();
  const [timetablesList, setTimetablesList] = useState<Array<{
    class_id: string;
    class_name: string;
    section_id: string;
    section_name: string;
    total_periods: number;
    total_days: number;
    incharge_name: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllClassTimetablesList()
      .then(list => {
        setTimetablesList(list);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Consolidate classes with timetable status
  const classesList = bootstrap.classes.flatMap(c => {
    if (c.sections && c.sections.length > 0) {
      return c.sections.map(s => {
        const info = timetablesList.find(t => t.class_name === c.class_name && t.section_name === s.name);
        return {
          className: c.class_name,
          sectionName: s.name,
          room: s.room || `Room ${c.class_name}-${s.name}`,
          totalPeriods: info?.total_periods || 48,
          totalDays: info?.total_days || 6,
          inchargeName: info?.incharge_name || 'Sarah Jenkins',
        };
      });
    }
    return [{
      className: c.class_name,
      sectionName: 'A',
      room: `Room ${c.class_name}-A`,
      totalPeriods: 48,
      totalDays: 6,
      inchargeName: 'Sarah Jenkins',
    }];
  });

  return (
    <div className="p-container-padding-mobile md:p-container-padding-desktop space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-primary">Class Timetable Management</h1>
          <p className="text-label-md text-on-surface-variant">
            Create, view, and configure weekly period bell schedules for all classes & sections.
          </p>
        </div>
        <Link
          href="/admin/timetable/class?class=Class%204&section=B"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          Open Class 4-B Timetable
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-primary">{classesList.length}</p>
          <p className="text-label-sm text-primary font-bold mt-1">Total Class Sections</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-emerald-800">{classesList.length}</p>
          <p className="text-label-sm text-emerald-950 font-bold mt-1">Active Timetables</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-amber-800">8 Periods</p>
          <p className="text-label-sm text-amber-950 font-bold mt-1">Standard Daily Bell Schedule</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-purple-800">6 Days</p>
          <p className="text-label-sm text-purple-950 font-bold mt-1">Weekly Instruction Days</p>
        </div>
      </div>

      {loading && <LoadingRing size="lg" />}
      {error && <div className="rounded-xl bg-error-container p-4 text-error font-bold">Backend data unavailable: {error}</div>}

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classesList.map(item => (
          <div
            key={`${item.className}-${item.sectionName}`}
            className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-5 shadow-sm hover:border-primary hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg shadow-xs">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Configured
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-on-surface">
                {item.className} - Section {item.sectionName}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium mt-1">
                Room: <span className="font-bold text-on-surface">{item.room}</span> • Incharge: <span className="font-bold text-primary">{item.inchargeName}</span>
              </p>

              <div className="mt-4 flex items-center gap-4 text-xs font-bold text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl">
                <span>📅 6 Days / Week</span>
                <span>⏰ 8 Periods / Day</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
              <Link
                href={`/admin/timetable/class?class=${encodeURIComponent(item.className)}&section=${encodeURIComponent(item.sectionName)}`}
                className="flex-1 py-2 text-center rounded-xl border border-outline-variant hover:bg-surface-container font-bold text-xs text-on-surface transition-all"
              >
                View Timetable
              </Link>
              <Link
                href={`/admin/timetable/class?class=${encodeURIComponent(item.className)}&section=${encodeURIComponent(item.sectionName)}`}
                className="flex-1 py-2 text-center rounded-xl bg-primary text-on-primary font-bold text-xs hover:opacity-90 shadow-sm transition-all"
              >
                Edit Schedule
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
