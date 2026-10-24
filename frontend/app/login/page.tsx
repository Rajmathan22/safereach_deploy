'use client';

import Link from '@/src/next-link';
import LogoMark from '@/components/LogoMark';

const roles = [
  {
    key: 'parent',
    title: 'Parent / Guardian',
    description: 'Track child travel status, attendance, messages, reports, and safety updates.',
    icon: 'family_restroom',
    gradient: 'from-[#4b1c00] to-[#92400e]',
    accent: 'border-orange-200',
    href: '/login/parent',
    email: 'parent@demo.safereach.edu',
    password: 'Parent@2025',
    extra: null,
  },
  {
    key: 'teacher',
    title: 'Class Teacher',
    description: 'Mark attendance, manage assigned students, message parents, and file reports.',
    icon: 'school',
    gradient: 'from-[#006b5f] to-[#047857]',
    accent: 'border-green-200',
    href: '/login/teacher',
    email: 'teacher@demo.safereach.edu',
    password: 'Teacher@2025',
    extra: null,
  },
];

export default function LoginRoleSelectorPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="text-center mb-10">
        <div className="inline-flex mb-4 shadow-lg rounded-2xl">
          <LogoMark className="h-14 w-14 rounded-2xl" />
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary font-extrabold tracking-tight">SafeReach Login</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Choose your role to continue</p>
      </div>

      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map(role => (
          <div key={role.key} className={`bg-white rounded-2xl shadow-md border ${role.accent} overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-200`}>
            <div className={`bg-gradient-to-br ${role.gradient} p-6 text-white`}>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-white text-[28px]">{role.icon}</span>
              </div>
              <h2 className="font-headline-md text-headline-md font-bold">{role.title}</h2>
              <p className="text-white/80 text-label-md mt-1 leading-relaxed">{role.description}</p>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5 flex-1">
                <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">key</span>
                  Demo Credentials
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Email</p>
                    <p className="font-mono text-label-md text-on-surface font-bold break-all">{role.email}</p>
                  </div>
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Password</p>
                    <p className="font-mono text-label-md text-on-surface font-bold">{role.password}</p>
                  </div>
                  {role.extra && (
                    <div className="pt-1 border-t border-slate-200 mt-1">
                      <p className="text-label-sm text-on-surface-variant">2FA Code</p>
                      <p className="font-mono text-label-md text-primary font-bold">{role.extra}</p>
                    </div>
                  )}
                </div>
              </div>

              <Link href={role.href} className={`w-full py-3 rounded-xl font-bold text-label-md text-center text-white bg-gradient-to-r ${role.gradient} hover:opacity-90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2`}>
                <span>Login as {role.title}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link href="/sub-main" className="text-primary font-bold hover:underline">School Administrator / Sub Admin login</Link>
        <Link href="/main-admin/login" className="text-primary font-bold hover:underline">Main Admin login</Link>
        <Link href="/school-registration" className="text-primary font-bold hover:underline">Register a school or college admin account</Link>
        <p className="text-label-sm text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
          SafeReach demo environment
        </p>
      </div>
    </main>
  );
}

