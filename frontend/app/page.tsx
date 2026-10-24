'use client';

import Link from '@/src/next-link';
import LogoMark from '@/components/LogoMark';

const statusChips = [
  { label: 'Reached School', icon: 'school', cls: 'bg-green-500/20 text-green-100 border-green-300/40' },
  { label: 'Attendance Marked', icon: 'task_alt', cls: 'bg-blue-500/20 text-blue-100 border-blue-300/40' },
  { label: 'Parent SMS Sent', icon: 'sms', cls: 'bg-cyan-500/20 text-cyan-100 border-cyan-300/40' },
  { label: 'Emergency Ready', icon: 'emergency_home', cls: 'bg-red-500/20 text-red-100 border-red-300/40' },
];

const portalLinks = [
  { title: 'Teacher', href: '/login/teacher', icon: 'school', body: 'Track class attendance, send parent SMS alerts, manage students, and review travel status.' },
  { title: 'Parent', href: '/login/parent', icon: 'family_restroom', body: 'Monitor child travel status, attendance, messages, reports, and safety updates.' },
];

const flowSteps = [
  ['directions_bus', 'Ready to Send', 'Parent starts the daily travel cycle from home.'],
  ['pin_drop', 'Reached School', 'Teacher confirms arrival and class attendance.'],
  ['sms', 'Absent / Late', 'Parent receives SMS and can send a reason.'],
  ['logout', 'Go Out', 'Teacher marks students leaving school.'],
  ['home_pin', 'Reached Home', 'Parent confirms safe arrival at home.'],
];

const analytics = [
  ['2,482', 'Student records'],
  ['Live', 'Travel status'],
  ['SMS', 'Parent alerts'],
  ['RBAC', 'Role access'],
];

const backendReady = [
  ['database', 'MongoDB Planning', 'Student, school, attendance, reports, and audit data model.'],
  ['lock', 'Privacy Controls', 'Terms, consent, RBAC, and secure data handling workflows.'],
  ['notifications', 'Notification Layer', 'SMS, email, push, and future WebSocket event delivery.'],
  ['monitoring', 'Operations', 'Dashboards, health checks, logs, metrics, and deployment readiness.'],
];

export default function SafeReachLandingPage() {
  return (
    <main className="min-h-screen bg-[#06142b] text-white">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 hero-motion-bg landing-dynamic-bg" aria-hidden="true">
          <div className="campus-grid" />
          <div className="landing-map-stage">
            <div className="landing-map-path" />
            <div className="landing-map-pin landing-pin-a" />
            <div className="landing-map-pin landing-pin-b" />
            <div className="landing-map-pin landing-pin-c" />
            <div className="landing-map-pin landing-pin-d landing-pin-alert" />
            <div className="landing-map-label landing-label-a">Home Start</div>
            <div className="landing-map-label landing-label-b">Reached School</div>
            <div className="landing-map-label landing-label-c">Attendance</div>
            <div className="landing-map-label landing-label-d">Emergency Ready</div>
          </div>
          <div className="route-line route-line-one" />
          <div className="route-line route-line-two" />
          <div className="route-line route-line-three" />
          <div className="pulse-dot pulse-a" />
          <div className="pulse-dot pulse-b" />
          <div className="pulse-dot pulse-c" />
          <div className="hero-panel hero-panel-a">
            <span>Attendance</span>
            <strong>98%</strong>
          </div>
          <div className="hero-panel hero-panel-b">
            <span>SMS Alerts</span>
            <strong>Sent</strong>
          </div>
          <div className="hero-panel hero-panel-c">
            <span>Travel</span>
            <strong>Live</strong>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#06142b]/96 via-[#06285c]/78 to-[#031b2f]/34" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#07111f] to-transparent" />

        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0a1b34]/80 px-5 py-4 backdrop-blur-xl md:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="h-11 w-11 rounded-xl shadow-lg" />
            <div>
              <p className="text-xl font-black tracking-tight">SafeReach</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/70">School safety platform</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-bold text-white/80 md:flex">
            <a href="#flow" className="hover:text-white">Safety Flow</a>
            <a href="#portals" className="hover:text-white">Portals</a>
            <a href="#reports" className="hover:text-white">Reports</a>
          </nav>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-5 pb-16 pt-28 md:px-10">
          <div className="max-w-4xl landing-copy-enter">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100 backdrop-blur">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              Real-time school safety, attendance, and travel monitoring
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              SafeReach
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/85 md:text-2xl">
              Give schools, teachers, and parents a live safety picture from home departure to school arrival, attendance, dismissal, and safe return.
            </p>
            <div className="mt-8 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
              <Link href="/login" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-center font-black text-primary shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50">
                Login
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <Link href="/school-registration" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-4 text-center font-black text-white backdrop-blur transition hover:bg-white/20">
                Register School / College
                <span className="material-symbols-outlined text-[20px]">domain_add</span>
              </Link>
            </div>
            <div className="mt-8 flex max-w-3xl flex-wrap gap-3">
              {statusChips.map(chip => (
                <span key={chip.label} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold backdrop-blur ${chip.cls}`}>
                  <span className="material-symbols-outlined text-[17px]">{chip.icon}</span>
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#eef8f6] px-5 py-16 text-[#0f2f3a] md:px-10" id="flow">
        <div className="absolute inset-0 landing-light-grid" aria-hidden="true" />
        <div className="mx-auto max-w-6xl">
          <div className="relative mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#008a72]">Daily safety lifecycle</p>
              <h2 className="mt-2 text-3xl font-black md:text-5xl">From home to school and back to home.</h2>
            </div>
            <p className="max-w-xl text-[#49636d]">SafeReach turns everyday student movement into a visible, auditable, role-based workflow.</p>
          </div>
          <div className="relative grid gap-5 md:grid-cols-5">
            {flowSteps.map(([icon, title, body], index) => (
              <div key={title} className="landing-flow-card rounded-full border border-white bg-white p-5 text-center shadow-xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00236f] text-white shadow-lg">
                  <span className="material-symbols-outlined text-[34px]">{icon}</span>
                </div>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[#008a72]">Step {index + 1}</span>
                <h3 className="mt-2 text-lg font-black text-[#00236f]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#49636d]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#e8fbf6] to-[#dff3ff] px-5 py-16 text-[#0f2f3a] md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#008a72]">Role-based dashboards</p>
            <h2 className="mt-2 text-3xl font-black text-[#00236f] md:text-5xl">Operations view for every user.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-[#49636d]">The landing page now reflects the actual SafeReach admin, teacher, parent, registration, SMS, travel, and report workflows.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1fr_260px] lg:items-center">
            <div className="landing-dashboard-screen rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between rounded-2xl bg-[#00236f] p-4 text-white">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Live operations</p>
                  <h3 className="text-2xl font-black">Safety Analytics</h3>
                </div>
                <span className="material-symbols-outlined text-[34px]">monitoring</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#eef8f6] p-4">
                  <p className="text-sm font-bold text-[#49636d]">Attendance</p>
                  <div className="mt-4 flex h-32 items-end gap-3">
                    {[56, 92, 72, 118, 86].map((height, index) => (
                      <div key={index} className="landing-chart-bar flex-1 rounded-t-lg bg-[#00a77f]" style={{ height }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-[#eef4ff] p-4">
                  <p className="text-sm font-bold text-[#49636d]">Student Travel</p>
                  <div className="mt-4 space-y-3">
                    {['Out of Home', 'Reached School', 'Going Home'].map((item, index) => (
                      <div key={item} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                        <span className="font-bold text-[#00236f]">{item}</span>
                        <span className={`h-3 w-3 rounded-full ${index === 1 ? 'bg-green-500' : 'bg-cyan-500'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="landing-phone rounded-[36px] bg-[#101828] p-4 shadow-2xl">
              <div className="h-full rounded-[28px] bg-[#f4fffb] p-5 text-center text-[#0f2f3a]">
                <p className="font-black text-[#00236f]">Parent App</p>
                <div className="mx-auto my-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#00a77f] text-white landing-phone-pulse">
                  <span className="material-symbols-outlined text-[42px]">notifications_active</span>
                </div>
                <p className="text-sm font-bold text-[#49636d]">Live Status</p>
                <p className="mt-1 text-xl font-black text-[#00236f]">Reached School</p>
                <Link href="/login/parent" className="mt-6 inline-flex rounded-full bg-[#00a77f] px-5 py-3 font-black text-white">View Alert</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-10" id="portals">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {portalLinks.map(portal => (
            <Link key={portal.title} href={portal.href} className="group rounded-md border border-white/15 bg-[#12233d] p-8 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:border-cyan-200/50 hover:bg-[#172a47]">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-md bg-white text-primary shadow-sm">
                <span className="material-symbols-outlined text-[28px]">{portal.icon}</span>
              </div>
              <h3 className="text-3xl font-black tracking-tight">{portal.title}</h3>
              <p className="mt-3 min-h-14 text-lg leading-7 text-blue-100/72">{portal.body}</p>
              <span className="mt-7 inline-flex items-center gap-2 border-b border-cyan-200/60 pb-1 font-black text-cyan-200">
                Open portal
                <span className="material-symbols-outlined text-[18px] transition group-hover:translate-x-1">arrow_forward</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 md:px-10" id="reports">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.1] to-white/[0.04] p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-green-300">Reports, alerts, and future WebSocket readiness</p>
              <h2 className="mt-2 text-3xl font-black md:text-5xl">Built for live operations, not static records.</h2>
              <p className="mt-4 max-w-2xl text-blue-100/75">Incident logs, safety reports, attendance history, parent SMS alerts, and audit records are organized for a future real-time backend while the current demo stays frontend-only.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {analytics.map(([value, label]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-[#06142b]/70 p-5 text-center">
                  <p className="text-3xl font-black text-white">{value}</p>
                  <p className="mt-1 text-sm font-bold text-blue-100/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eef8f6] px-5 py-16 text-[#0f2f3a] md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#008a72]">Future backend ready</p>
            <h2 className="mt-2 text-3xl font-black text-[#00236f] md:text-5xl">Planned for scalable real-world deployment.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {backendReady.map(([icon, title, body]) => (
              <div key={title} className="landing-flow-card rounded-full border border-white bg-white p-5 text-center shadow-xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00a77f] text-white">
                  <span className="material-symbols-outlined text-[34px]">{icon}</span>
                </div>
                <h3 className="text-lg font-black text-[#00236f]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#49636d]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#06142b] px-5 py-8 text-blue-100/75 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10 rounded-xl" />
            <div>
              <p className="font-black text-white">SafeReach</p>
              <p className="text-sm">School safety platform for daily travel, attendance, and alerts.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-bold">
            <a href="#flow" className="hover:text-white">Safety Flow</a>
            <a href="#portals" className="hover:text-white">Portals</a>
            <a href="#reports" className="hover:text-white">Reports</a>
            <Link href="/sub-main" className="hover:text-white">Sub Admin</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

