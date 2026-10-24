'use client';

import { useState } from 'react';
import { useRouter } from '@/src/next-navigation';
import Link from '@/src/next-link';
import LogoMark from '@/components/LogoMark';

const PARENT_EMAIL = 'parent@demo.safereach.edu';
const PARENT_PASSWORD = 'Parent@2025';

export default function ParentLoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    router.push('/parent/dashboard');
  }

  return (
    <main className="min-h-screen bg-[#fff7ed] flex">
      <section className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-20 py-12 max-w-xl w-full mx-auto lg:mx-0">
        <Link href="/" className="inline-flex items-center gap-1 text-[#92400e] text-label-md hover:underline mb-10">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to SafeReach
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <LogoMark className="h-10 w-10 rounded-xl" />
          <div>
            <h1 className="font-headline-md text-headline-md text-[#92400e] font-bold leading-tight">SafeReach Parent Portal</h1>
            <p className="text-label-sm text-on-surface-variant">Guardian access for linked children</p>
          </div>
        </div>

        <div className="bg-white border border-orange-200 rounded-xl p-4 mb-6 shadow-sm">
          <p className="text-label-sm font-bold text-[#92400e] flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-[14px]">info</span>
            Default Parent Access
          </p>
          <div className="space-y-2 text-label-sm">
            <div className="rounded-lg bg-orange-50 px-3 py-2">
              <span className="block text-orange-700">Email</span>
              <span className="block min-w-0 break-all font-mono text-[13px] font-bold text-orange-950 sm:text-label-sm">{PARENT_EMAIL}</span>
            </div>
            <div className="rounded-lg bg-orange-50 px-3 py-2">
              <span className="block text-orange-700">Password</span>
              <span className="block min-w-0 break-all font-mono font-bold text-orange-950">{PARENT_PASSWORD}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant/40 p-6 shadow-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Parent Sign In</h2>
          <p className="text-body-md text-on-surface-variant mb-6">Use this page to view child travel, attendance, messages, timetable, reports, and safety updates.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-label-md text-on-surface-variant font-medium">Email Address</span>
              <input required type="email" defaultValue={PARENT_EMAIL} className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-[#92400e] focus:ring-1 focus:ring-[#92400e] outline-none" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-label-md text-on-surface-variant font-medium">Password</span>
              <div className="relative">
                <input required type={showPwd ? 'text' : 'password'} defaultValue={PARENT_PASSWORD} className="w-full px-4 py-3 pr-12 bg-surface-container border border-outline-variant rounded-xl focus:border-[#92400e] focus:ring-1 focus:ring-[#92400e] outline-none" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-[#92400e]" aria-label="Toggle password visibility">
                  <span className="material-symbols-outlined text-[20px]">{showPwd ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-label-md text-on-surface-variant">
                <input type="checkbox" className="w-4 h-4 rounded border-outline-variant" />
                Remember me
              </label>
              <Link href="/login/forgot-password?role=parent" className="text-label-sm text-[#92400e] hover:underline">Forgot?</Link>
            </div>
            <button type="submit" className="w-full h-12 bg-[#92400e] text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all">
              Sign Into Parent Portal
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-label-sm text-on-surface-variant flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          Secure &middot; Encrypted &middot; COPPA Compliant
        </p>
      </section>

      <section className="hidden lg:flex flex-1 bg-gradient-to-br from-[#4b1c00] via-[#7c2d12] to-[#92400e] flex-col items-center justify-center p-16 text-white relative overflow-hidden">
        <div className="relative z-10 text-center max-w-md">
          <span className="material-symbols-outlined text-[84px] text-white/30 mb-6 block">family_restroom</span>
          <h2 className="font-headline-lg text-headline-lg font-bold mb-4">Parent access is child-specific.</h2>
          <p className="text-white/80 text-body-md leading-relaxed">Work: view child travel, attendance, messages, timetable, reports, and campus safety updates for your school or college. Access: linked child records only, with no access to other students or admin screens. Policy: use information for child safety and keep the account private.</p>
        </div>
      </section>
    </main>
  );
}
