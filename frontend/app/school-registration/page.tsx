'use client';

import Link from '@/src/next-link';
import { useEffect, useState } from 'react';
import { readTermsState, termsSummary, type TermsState } from '@/lib/terms';
import { apiBaseUrl } from '@/lib/runtimeConfig';

type InstitutionType = 'school' | 'college';

type SchoolRequest = {
  id: string;
  institutionType: InstitutionType;
  schoolName: string;
  board: string;
  city: string;
  address: string;
  adminName: string;
  email: string;
  phone: string;
  password: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  requestedAt: string;
  termsAcceptedAt: string;
  termsVersion: string;
};

const REQUEST_KEY = 'safereach_school_requests';

function readRequests(): SchoolRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(REQUEST_KEY) ?? '[]') as SchoolRequest[];
    // Normalise legacy records saved before institution type existed.
    return stored.map(request => ({ ...request, institutionType: request.institutionType ?? 'school' }));
  } catch {
    return [];
  }
}

const BOARD_OPTIONS: Record<InstitutionType, { label: string; options: string[] }> = {
  school: {
    label: 'Board / Curriculum',
    options: ['CBSE', 'ICSE', 'State Board', 'International'],
  },
  college: {
    label: 'University / Affiliation',
    options: ['Affiliated University', 'Autonomous Institution', 'Deemed-to-be University', 'Open University'],
  },
};

export default function SchoolRegistrationPage() {
  const [submitted, setSubmitted] = useState<SchoolRequest | null>(null);
  const [terms, setTerms] = useState<TermsState>(() => readTermsState());
  const [showTerms, setShowTerms] = useState(false);
  const [termsViewed, setTermsViewed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [agreementError, setAgreementError] = useState('');
  const [institutionType, setInstitutionType] = useState<InstitutionType>('school');

  const isCollege = institutionType === 'college';
  const affiliationField = BOARD_OPTIONS[institutionType];

  useEffect(() => {
    setTerms(readTermsState());
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!termsAccepted) {
      setAgreementError('Please review and accept the SafeReach terms and conditions before sending the registration request.');
      return;
    }

    const form = new FormData(event.currentTarget);
    const acceptedAt = new Date().toLocaleString();
    const request: SchoolRequest = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      institutionType,
      schoolName: String(form.get('schoolName') ?? ''),
      board: String(form.get('board') ?? ''),
      city: String(form.get('city') ?? ''),
      address: String(form.get('address') ?? ''),
      adminName: String(form.get('adminName') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      password: String(form.get('password') ?? ''),
      status: 'Pending',
      requestedAt: acceptedAt,
      termsAcceptedAt: acceptedAt,
      termsVersion: terms.version,
    };
    window.localStorage.setItem(REQUEST_KEY, JSON.stringify([request, ...readRequests()]));
    setSubmitted(request);
    setTermsAccepted(false);
    setTermsViewed(false);
    setAgreementError('');
    event.currentTarget.reset();

    // Also persist to the PHP backend (MySQL) when reachable. The localStorage
    // record above keeps the main-admin demo panel working offline; failures
    // here must never block the visible confirmation.
    fetch(`${apiBaseUrl}/super-admin/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: request.id,
        institutionType: request.institutionType,
        schoolName: request.schoolName,
        board: request.board,
        city: request.city,
        address: request.address,
        adminName: request.adminName,
        email: request.email,
        phone: request.phone,
        password: request.password,
        termsVersion: request.termsVersion,
      }),
    }).catch(() => undefined);
  }

  return (
    <main className="min-h-screen bg-background p-container-padding-mobile md:p-container-padding-desktop">
      <div className="max-w-5xl mx-auto">
        <div className="mb-stack-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/login" className="inline-flex items-center gap-1 text-primary text-label-md hover:underline mb-4">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to login
            </Link>
            <h1 className="font-headline-lg text-headline-lg text-primary">Institution Environment Registration</h1>
            <p className="text-body-md text-on-surface-variant">School and college admins can request a SafeReach institution workspace using this separate frontend URL.</p>
          </div>
          <span className="status-chip bg-primary/10 text-primary">Frontend request demo</span>
        </div>

        {submitted && (
          <div className="mb-stack-lg rounded-xl border border-green-200 bg-green-50 p-stack-md">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-700">task_alt</span>
              <div>
                <p className="font-bold text-green-700">Request submitted to main admin</p>
                <p className="text-label-md text-on-surface-variant">Request ID {submitted.id} ({submitted.institutionType === 'college' ? 'College' : 'School'}) is now visible in the main-admin approvals panel. The request includes agreement to {submitted.termsVersion}.</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-outline-variant/50 shadow-sm overflow-hidden">            <div className="p-stack-md border-b border-outline-variant/40">
              <h2 className="font-headline-md text-headline-md text-on-surface">{isCollege ? 'College Details' : 'School Details'}</h2>
              <p className="text-label-md text-on-surface-variant">These details create the pending {institutionType} environment request for app-level approval.</p>
            </div>

            <div className="p-stack-md pb-0">
              <span className="text-label-md text-on-surface-variant font-medium">Institution Type</span>
              <div className="mt-2 inline-flex rounded-full bg-surface-container p-1">
                <button
                  type="button"
                  onClick={() => setInstitutionType('school')}
                  aria-pressed={!isCollege}
                  className={`min-w-32 px-5 py-2.5 rounded-full text-label-md font-bold transition-all ${!isCollege ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  🏫 School
                </button>
                <button
                  type="button"
                  onClick={() => setInstitutionType('college')}
                  aria-pressed={isCollege}
                  className={`min-w-32 px-5 py-2.5 rounded-full text-label-md font-bold transition-all ${isCollege ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  🎓 College
                </button>
              </div>
            </div>

            <div className="p-stack-md grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-label-md text-on-surface-variant font-medium">{isCollege ? 'College Name' : 'School Name'}</span>
                <input name="schoolName" required className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder={isCollege ? 'City College of Engineering' : 'Green Valley Public School'} />
              </label>
              <label className="space-y-1.5">
                <span className="text-label-md text-on-surface-variant font-medium">{affiliationField.label}</span>
                <select name="board" required className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                  <option value="">Select {isCollege ? 'affiliation' : 'board'}</option>
                  {affiliationField.options.map(option => <option key={option}>{option}</option>)}
                </select>
              </label>
            <label className="space-y-1.5">
              <span className="text-label-md text-on-surface-variant font-medium">City</span>
              <input name="city" required className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Chennai" />
            </label>
            <label className="space-y-1.5">
              <span className="text-label-md text-on-surface-variant font-medium">School Address</span>
              <input name="address" required className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Campus address" />
            </label>
          </div>            <div className="p-stack-md border-t border-outline-variant/40">
              <h2 className="font-headline-md text-headline-md text-on-surface">Administrator Details</h2>
              <p className="text-label-md text-on-surface-variant">The password entered here is the same demo password shown in the acceptance SMS preview.</p>
            </div>
          <div className="p-stack-md pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-label-md text-on-surface-variant font-medium">Admin Full Name</span>
              <input name="adminName" required className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Priya Raman" />
            </label>
            <label className="space-y-1.5">
              <span className="text-label-md text-on-surface-variant font-medium">Admin Email</span>
              <input name="email" required type="email" className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="admin@school.edu" />
            </label>
            <label className="space-y-1.5">
              <span className="text-label-md text-on-surface-variant font-medium">Mobile Number</span>
              <input name="phone" required className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="+91 98765 43210" />
            </label>
            <label className="space-y-1.5">
              <span className="text-label-md text-on-surface-variant font-medium">Requested Login Password</span>
              <input name="password" required type="password" minLength={8} className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Minimum 8 characters" />
            </label>
          </div>

          <div className="p-stack-md border-t border-outline-variant/40">
            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-stack-md">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Terms And Conditions Agreement</h2>
                  <p className="text-label-md text-on-surface-variant mt-1">
                    Review SafeReach app use, school data handling, privacy rights, user responsibilities, and security commitments before requesting registration.
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-label-md text-on-surface-variant">
                    {['App and school workspace details', 'Student and guardian data use', 'GDPR, CCPA, and HIPAA-aware privacy notes', 'Security commitments without exposing internal methods'].map(item => (
                      <span key={item} className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowTerms(true);
                    setTermsViewed(true);
                    setAgreementError('');
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-2 px-5 py-3 rounded-lg border border-primary text-primary font-bold hover:bg-primary/5"
                >
                  <span className="material-symbols-outlined text-[20px]">policy</span>
                  View Terms
                </button>
              </div>

              <label className={`mt-5 flex items-start gap-3 rounded-lg border p-4 ${termsAccepted ? 'border-green-300 bg-green-50' : 'border-outline-variant bg-white'}`}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  disabled={!termsViewed}
                  onChange={event => {
                    setTermsAccepted(event.target.checked);
                    setAgreementError('');
                  }}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <span className="text-label-md text-on-surface">
                  I have opened and reviewed the SafeReach Terms and Conditions, understand how school, staff, student, parent, safety, attendance, travel, and communication data may be used, and agree to submit this registration request under the current policy.
                  <span className="block mt-1 text-on-surface-variant">{termsSummary(terms)}</span>
                  {!termsViewed && <span className="block mt-1 text-error">Open the terms first to enable this agreement checklist.</span>}
                </span>
              </label>
              {agreementError && <p className="mt-3 text-label-md text-error font-semibold">{agreementError}</p>}
            </div>
          </div>

          <div className="p-stack-md border-t border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low">              <p className="text-label-md text-on-surface-variant">Requests are stored locally and submitted to the backend when available.</p>
              <button type="submit" disabled={!termsAccepted} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="material-symbols-outlined text-[20px]">send</span>
                Request {isCollege ? 'College' : 'School'} Environment
            </button>
          </div>
        </form>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[80] bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-outline-variant flex flex-col">
            <div className="p-stack-md border-b border-outline-variant/50 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">SafeReach Terms And Conditions</h2>
                <p className="text-label-md text-on-surface-variant">{terms.version} | {terms.updatedAt}</p>
              </div>
              <button type="button" onClick={() => setShowTerms(false)} className="p-2 rounded-full hover:bg-surface-container" aria-label="Close terms">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="overflow-y-auto p-stack-md space-y-4">
              {terms.sections.map(section => (
                <section key={section.id} className="rounded-xl border border-outline-variant/50 p-4 bg-surface-container-low">
                  <h3 className="font-bold text-primary mb-2">{section.title}</h3>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">{section.body}</p>
                </section>
              ))}
              <p className="text-label-sm text-on-surface-variant">
                This frontend text is a planning and demonstration policy. A production deployment should receive legal review and should store accepted versions in backend audit records.
              </p>
            </div>
            <div className="p-stack-md border-t border-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low">
              <p className="text-label-md text-on-surface-variant">After closing, the agreement checklist will be available on the registration form.</p>
              <button type="button" onClick={() => setShowTerms(false)} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-lg font-bold">
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
                I Reviewed These Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

