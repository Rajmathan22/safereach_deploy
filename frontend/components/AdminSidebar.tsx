'use client';

import Link from '@/src/next-link';
import LogoutConfirmButton from './LogoutConfirmButton';
import { downloadTextFile } from '@/lib/downloadFile';
import LogoMark from './LogoMark';

export type AdminActiveItem = 'analytics' | 'students' | 'teachers' | 'timetable' | 'messages' | 'incident' | 'reports' | 'results' | 'access' | 'audit';
type Variant = 'analytics' | 'hub';

interface AdminSidebarProps {
  activeItem: AdminActiveItem;
  variant?: Variant;
  className?: string;
  onNavigate?: () => void;
}

const activeClass = 'flex items-center gap-3 rounded-xl bg-primary text-on-primary font-bold px-3.5 py-2.5 shadow-sm transition-all';
const inactiveClass = 'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-on-surface-variant font-medium transition-colors hover:bg-surface-container hover:text-on-surface';

export default function AdminSidebar({ activeItem, variant = 'analytics', className, onNavigate }: AdminSidebarProps) {
  function exportGlobalData() {
    const csv = [
      'module,total,active,pending',
      'Students,2480,2301,18',
      'Teachers,86,82,4',
      'Incidents,24,8,5',
      'Reports,47,42,5',
    ].join('\n');
    downloadTextFile('safereach-global-data.csv', csv, 'text/csv');
  }

  const navLinks = [
    { id: 'analytics', label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
    { id: 'students', label: 'Student Roster', href: '/admin/students', icon: 'groups' },
    { id: 'teachers', label: 'Staff Management', href: '/admin/teachers', icon: 'badge' },
    { id: 'timetable', label: 'Class Timetable', href: '/admin/timetable', icon: 'calendar_month' },
    { id: 'messages', label: 'Parent Messages', href: '/admin/messages', icon: 'chat' },
    { id: 'incident', label: 'Incident Logs', href: '/admin/incidents', icon: 'warning' },
    { id: 'reports', label: 'Safety Reports', href: '/admin/reports', icon: 'bar_chart' },
    { id: 'results', label: 'Results Setup', href: '/admin/results', icon: 'grade' },
    { id: 'access', label: 'Industry Menus', href: '/admin/access', icon: 'tune' },
    { id: 'audit', label: 'System Audit', href: '/admin/account', icon: 'security' },
  ] as const;

  if (variant === 'hub') {
    return (
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-[100svh] max-h-[100svh] overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] bg-surface border-r border-outline-variant/60 w-64 z-50 p-3 pb-6 shadow-sm custom-scrollbar">
        <div className="mb-4 rounded-xl bg-surface-container-low px-3 py-3 border border-outline-variant/40 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <LogoMark className="h-8 w-8 rounded-lg" />
            <div>
              <h2 className="text-label-md font-bold text-primary leading-tight">SafeReach</h2>
              <p className="text-[11px] text-on-surface-variant font-medium">School Administrator</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 shrink-0">
          {navLinks.map(link => (
            <Link
              key={link.id}
              href={link.href}
              onClick={onNavigate}
              className={activeItem === link.id ? activeClass : inactiveClass}
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              <span className="text-label-md">{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-4 pt-4 border-t border-outline-variant/60 shrink-0 space-y-1 pb-4">
          <Link href="/admin/support" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-on-surface-variant hover:bg-surface-container text-label-md font-medium">
            <span className="material-symbols-outlined text-[20px]">help</span>
            Support & Help
          </Link>
          <LogoutConfirmButton label="Sign Out" className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-on-surface-variant transition-colors hover:bg-surface-container text-label-md" />
          <button className="mt-3 w-full bg-error text-on-error py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-xs shadow-sm">
            <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>emergency</span>
            Emergency Alert
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`${className ?? 'hidden lg:flex fixed left-0 top-16 h-[calc(100svh-64px)]'} flex-col w-64 max-h-[calc(100svh-64px)] bg-surface border-r border-outline-variant/60 p-3 pb-6 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] z-50 custom-scrollbar`}>
      <div className="mb-3 px-2 shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">School Navigation</h2>
      </div>
      <nav className="flex flex-col gap-1 shrink-0">
        {navLinks.map(link => (
          <Link
            key={link.id}
            href={link.href}
            onClick={onNavigate}
            className={activeItem === link.id ? activeClass : inactiveClass}
          >
            <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
            <span className="text-label-md">{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-4 pt-3 border-t border-outline-variant/60 shrink-0 space-y-1 pb-4">
        <button onClick={exportGlobalData} className="mb-1.5 w-full py-2 bg-secondary/10 border border-secondary/20 text-secondary rounded-xl font-label-md font-bold hover:bg-secondary/20 transition-all flex items-center justify-center gap-2 text-xs">
          <span className="material-symbols-outlined text-[16px]">download</span>
          Export Global Data
        </button>
        <Link href="/admin/support" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2 text-on-surface-variant hover:bg-surface-container text-label-md font-medium text-xs">
          <span className="material-symbols-outlined text-[18px]">help</span>
          Support & Help
        </Link>
        <LogoutConfirmButton className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-on-surface-variant hover:bg-surface-container text-label-md text-xs" />
        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-error px-3 py-2 font-bold text-on-error transition-transform hover:opacity-90 active:scale-95 text-xs shadow-sm">
          <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>emergency</span>
          Emergency Alert
        </button>
      </div>
    </aside>
  );
}
