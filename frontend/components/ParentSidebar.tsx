'use client';

import Link from '@/src/next-link';
import LogoutConfirmButton from './LogoutConfirmButton';
import LogoMark from './LogoMark';

type ActiveItem = 'dashboard' | 'students' | 'attendance' | 'messages' | 'reports' | 'timetable';

interface ParentSidebarProps {
  activeItem: ActiveItem;
  className?: string;
  onNavigate?: () => void;
}

const activeClass = 'flex items-center gap-3 rounded-xl bg-primary text-on-primary font-bold px-3.5 py-2.5 shadow-sm transition-all';
const inactiveClass = 'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-on-surface-variant font-medium transition-colors hover:bg-surface-container hover:text-on-surface';

export default function ParentSidebar({ activeItem, className = 'hidden md:flex', onNavigate }: ParentSidebarProps) {
  const navLinks = [
    { id: 'dashboard', label: 'Safety Dashboard', href: '/parent/dashboard', icon: 'dashboard' },
    { id: 'students', label: 'My Children', href: '/parent/students', icon: 'child_care' },
    { id: 'attendance', label: 'Attendance', href: '/parent/attendance', icon: 'how_to_reg' },
    { id: 'timetable', label: 'Class Timetable', href: '/parent/timetable', icon: 'calendar_month' },
    { id: 'messages', label: 'School Messages', href: '/parent/messages', icon: 'chat' },
    { id: 'reports', label: 'Exam Results', href: '/parent/reports', icon: 'description' },
  ] as const;

  return (
    <aside className={`${className} flex-col h-[100svh] max-h-[100svh] w-64 fixed left-0 top-0 z-50 border-r border-outline-variant/60 bg-surface px-3 py-4 pb-6 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] custom-scrollbar`}>
      <div className="mb-4 rounded-xl bg-surface-container-low px-3 py-3 border border-outline-variant/40 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <LogoMark className="h-8 w-8 rounded-lg" />
          <div>
            <h1 className="font-headline-md text-headline-md font-extrabold text-primary leading-tight">SafeReach</h1>
            <p className="text-[11px] text-on-surface-variant font-medium">Parent Portal</p>
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
      <div className="mt-4 pt-3 border-t border-outline-variant/60 shrink-0 flex flex-col gap-1 pb-4">
        <Link href="/parent/support" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-on-surface-variant transition-colors hover:bg-surface-container text-xs font-medium">
          <span className="material-symbols-outlined text-[18px]">help</span>
          <span className="text-label-md">Help Center</span>
        </Link>
        <LogoutConfirmButton label="Sign Out" className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-on-surface-variant transition-colors hover:bg-surface-container text-xs" />
        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-error px-3 py-2 font-bold text-on-error transition-transform hover:opacity-90 active:scale-95 text-xs shadow-sm">
          <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>emergency</span>
          Emergency Alert
        </button>
      </div>
    </aside>
  );
}
