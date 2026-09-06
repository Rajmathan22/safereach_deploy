'use client';

import { usePathname } from '@/src/next-navigation';
import Link from '@/src/next-link';
import { useState } from 'react';
import AdminSidebar, { type AdminActiveItem } from '@/components/AdminSidebar';
import LogoMark from '@/components/LogoMark';

function getSidebar(p: string): AdminActiveItem {
  if (p.includes('/access')) return 'access';
  if (p.includes('/results')) return 'results';
  if (p.includes('/incidents')) return 'incident';
  if (p.includes('/reports')) return 'reports';
  if (p.includes('/timetable')) return 'timetable';
  if (p.includes('/account') || p.includes('/audit') || p.includes('/security')) return 'audit';
  if (p.includes('/messages')) return 'messages';
  if (p.includes('/teachers')) return 'teachers';
  if (p.includes('/students')) return 'students';
  return 'analytics';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="bg-background text-on-surface min-h-screen overflow-x-hidden pt-16">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant/50 bg-surface px-4 md:px-6">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMobileMenuOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-surface-container lg:hidden" aria-label="Open admin menu"><span className="material-symbols-outlined">menu</span></button>
          <LogoMark className="h-8 w-8 rounded-md" /><span className="font-headline-md font-extrabold text-on-surface">SafeReach</span>
        </div>
        <Link href="/admin/profile" title="Profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary"><span className="material-symbols-outlined text-[20px]">person</span></Link>
      </header>
      <div className="flex min-h-[calc(100vh-64px)]">
        <AdminSidebar activeItem={getSidebar(pathname)} />
        {mobileMenuOpen && <button type="button" aria-label="Close admin menu" onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-on-surface/20 lg:hidden" />}
        <AdminSidebar activeItem={getSidebar(pathname)} onNavigate={() => setMobileMenuOpen(false)} className={`fixed left-0 top-16 z-50 flex h-[calc(100svh-64px)] max-h-[calc(100svh-64px)] w-64 flex-col bg-surface border-r border-outline-variant/60 p-3 pb-4 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] transition-transform duration-200 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} />
        <div key={pathname} className="admin-page-enter flex-1 min-w-0 lg:ml-64">
          {children}
        </div>
      </div>
    </div>
  );
}
