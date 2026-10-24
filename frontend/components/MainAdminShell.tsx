'use client';

import Link from '@/src/next-link';
import { useState } from 'react';
import LogoutConfirmButton from './LogoutConfirmButton';
import LogoMark from './LogoMark';

type MainAdminShellProps = {
  active: 'dashboard' | 'reports' | 'terms' | 'notifications';
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

const navItems = [
  { id: 'dashboard', label: 'App Control', href: '/main-admin/dashboard', icon: 'admin_panel_settings' },
  { id: 'reports', label: 'All Reports', href: '/main-admin/reports', icon: 'monitoring' },
  { id: 'terms', label: 'Terms & Conditions', href: '/main-admin/terms', icon: 'policy' },
  { id: 'notifications', label: 'Notifications', href: '/main-admin/notifications', icon: 'notifications' },
] as const;

export default function MainAdminShell({ active, title, subtitle, children }: MainAdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const sidebar = (
    <aside className="w-64 h-[100svh] max-h-[100svh] overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] bg-surface border-r border-outline-variant/60 flex flex-col p-3 pb-6 shadow-sm custom-scrollbar">
      <div className="mb-7 rounded-lg bg-surface-container-low px-3 py-3 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <LogoMark className="h-8 w-8 rounded-md" />
          <div>
            <p className="font-headline-md font-extrabold text-on-surface leading-tight">SafeReach</p>
          </div>
        </div>
      </div>
      <nav className="flex flex-col space-y-1 shrink-0">
        {navItems.map(item => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 font-label-md transition-colors ${active === item.id ? 'bg-surface-container text-on-surface font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-4 pt-4 border-t border-outline-variant/60 shrink-0 space-y-1 pb-4">
        <Link href="/school-registration" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-primary hover:bg-surface-container-low font-label-md">
          <span className="material-symbols-outlined text-[20px]">domain_add</span>
          School / College Registration URL
        </Link>
        <LogoutConfirmButton className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-error hover:bg-error-container font-label-md" />
        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-error px-3 py-2.5 font-bold text-on-error transition-transform hover:opacity-90 active:scale-95">
          <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>emergency</span>
          Emergency Alert
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background text-on-surface overflow-x-hidden pt-16">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface border-b border-outline-variant/40 shadow-sm flex items-center justify-between px-container-padding-mobile md:px-container-padding-desktop">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => setMenuOpen(open => !open)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-surface-container" aria-label="Toggle main admin navigation">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="min-w-0">
            <h1 className="font-headline-md text-headline-md text-primary leading-tight truncate">{title}</h1>
            <p className="hidden md:block text-label-sm text-on-surface-variant">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex status-chip bg-primary/10 text-primary">App Owner Access</span>
          <Link href="/main-admin/login" className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center" title="Main admin profile">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </Link>
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-64px)]">
        <div className="hidden lg:block fixed left-0 top-16 z-30">{sidebar}</div>
        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" aria-label="Close main admin navigation" className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <div className="fixed left-0 top-0 z-50">{sidebar}</div>
          </div>
        )}
        <main className="flex-1 min-w-0 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
