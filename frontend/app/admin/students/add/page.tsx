'use client';

import { Fragment, useState } from 'react';
import { useRouter } from '@/src/next-navigation';
import Link from '@/src/next-link';
import { apiBaseUrl } from '@/lib/runtimeConfig';

export default function AddStudentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const router = useRouter();

  // Form State
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('2016-04-12');
  const [gradeLevel, setGradeLevel] = useState('Class 4');
  const [section, setSection] = useState('A');
  const [rollNo, setRollNo] = useState('21');
  const [gender, setGender] = useState('Male');

  const [guardianName, setGuardianName] = useState('Sarah Thompson');
  const [guardianPhone, setGuardianPhone] = useState('+91 98765 43210');
  const [guardianEmail, setGuardianEmail] = useState('parent@safereach.school');
  const [guardianRelation, setGuardianRelation] = useState('Mother');

  const [medicalNotes, setMedicalNotes] = useState('No known critical allergies');
  const [bloodGroup, setBloodGroup] = useState('O+');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  function nextStep() {
    if (currentStep === 1 && !fullName.trim()) {
      setErrorMsg('Please enter student full name');
      return;
    }
    setErrorMsg('');
    if (currentStep < totalSteps) setCurrentStep(s => s + 1);
  }

  function prevStep() {
    setErrorMsg('');
    if (currentStep > 1) setCurrentStep(s => s - 1);
  }

  const [enrollmentResult, setEnrollmentResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !guardianName.trim()) {
      setErrorMsg('Student name and guardian name are required');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${apiBaseUrl}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          rollNo: rollNo.trim() || '01',
          className: gradeLevel,
          sectionName: section,
          gender,
          dob,
          guardianName: guardianName.trim(),
          parentPhone: guardianPhone.trim(),
          parentEmail: guardianEmail.trim(),
          emergencyNotes: `[Blood: ${bloodGroup}] ${medicalNotes}`,
          sendEmailInvite: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to enroll student');
      }

      setEnrollmentResult(result);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error enrolling student');
    } finally {
      setSubmitting(false);
    }
  }

  const stepCls = (step: number) => {
    if (step < currentStep) return 'w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold';
    if (step === currentStep) return 'w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold';
    return 'w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold';
  };

  if (enrollmentResult) {
    return (
      <div className="p-container-padding-mobile md:p-container-padding-desktop max-w-2xl mx-auto space-y-6">
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 p-8 shadow-xl text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>

          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Student Enrolled Successfully!</h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              <strong>{enrollmentResult.fullName}</strong> is registered under <strong>{enrollmentResult.className}-{enrollmentResult.sectionName}</strong>
            </p>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/40 text-left space-y-3">
            <div className="flex justify-between items-center text-sm pb-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Student Code:</span>
              <span className="font-mono font-bold text-primary">{enrollmentResult.studentCode}</span>
            </div>
            <div className="flex justify-between items-center text-sm pb-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Guardian Name:</span>
              <span className="font-bold text-on-surface">{enrollmentResult.guardianName}</span>
            </div>
            <div className="flex justify-between items-center text-sm pb-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Parent Login Email:</span>
              <span className="font-bold text-primary">{enrollmentResult.parentEmail || '(No Email)'}</span>
            </div>
            <div className="flex justify-between items-center text-sm pb-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Portal Password:</span>
              <span className="font-mono font-bold text-emerald-800">{enrollmentResult.parentCredentials?.password}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Email Invitation Status:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">mail</span>
                {enrollmentResult.emailDelivery?.ok ? 'Dispatched to Parent' : 'Logged'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => {
                setEnrollmentResult(null);
                setFullName('');
                setCurrentStep(1);
              }}
              className="px-6 py-3 rounded-xl border border-outline-variant font-bold text-on-surface hover:bg-surface-container"
            >
              Enroll Another Student
            </button>
            <Link
              href="/admin/students"
              className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:opacity-95"
            >
              View Students Roster
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-container-padding-mobile md:p-container-padding-desktop max-w-4xl mx-auto space-y-6">
      <div>
        <nav className="flex items-center gap-2 text-label-sm text-on-surface-variant mb-2">
          <Link href="/admin/students" className="hover:text-primary">Class Records</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-bold">Add New Student</span>
        </nav>
        <h1 className="font-headline-lg text-headline-lg text-primary">Student Enrollment</h1>
        <p className="font-body-md text-on-surface-variant">Register a new student, create parent portal access and dispatch welcome email.</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error font-bold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}>✕</button>
        </div>
      )}

      {/* Stepper Bar */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 p-4 flex justify-between items-center overflow-x-auto">
        {[['Personal Info', 1], ['Guardian Details', 2], ['Medical & Safety', 3], ['Transport', 4]].map(([label, step], i, arr) => (
          <Fragment key={step as number}>
            <div className={`flex items-center gap-3 min-w-max ${currentStep < (step as number) ? 'opacity-50' : ''}`}>
              <div className={stepCls(step as number)}>
                {currentStep > (step as number) ? <span className="material-symbols-outlined text-[20px]">check</span> : step}
              </div>
              <span className={`font-label-md text-label-md ${currentStep >= (step as number) ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                {label}
              </span>
            </div>
            {i < arr.length - 1 && <div key={`div-${i}`} className="h-[1px] w-8 bg-outline-variant mx-4"></div>}
          </Fragment>
        ))}
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden">
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-md text-primary">Personal Information</h2>
              <span className="text-label-sm px-3 py-1 bg-primary/10 text-primary font-bold rounded-full">Step 1 of 4</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Student Full Name *</label>
                  <input
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Grade / Standard *</label>
                  <select
                    value={gradeLevel}
                    onChange={e => setGradeLevel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  >
                    {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Section *</label>
                  <select
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  >
                    {['A', 'B', 'C', 'D'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Roll Number</label>
                  <input
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)}
                    placeholder="e.g. 21"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Gender</label>
                <div className="flex gap-3">
                  {['Male', 'Female', 'Other'].map(g => (
                    <label key={g} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === g}
                        onChange={() => setGender(g)}
                        className="hidden peer"
                      />
                      <div className="p-3 border border-outline-variant rounded-xl text-center font-bold peer-checked:bg-primary text-on-surface peer-checked:text-on-primary peer-checked:border-primary transition-all">
                        {g}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden">
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-md text-primary">Guardian Information & Multi-Child Linking</h2>
              <span className="text-label-sm px-3 py-1 bg-primary/10 text-primary font-bold rounded-full">Step 2 of 4</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Primary Guardian Name *</label>
                  <input
                    required
                    value={guardianName}
                    onChange={e => setGuardianName(e.target.value)}
                    placeholder="e.g. Sarah Thompson"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Relationship</label>
                  <input
                    value={guardianRelation}
                    onChange={e => setGuardianRelation(e.target.value)}
                    placeholder="e.g. Mother / Father"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Guardian Phone (SMS Alerts) *</label>
                  <input
                    required
                    value={guardianPhone}
                    onChange={e => setGuardianPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Guardian Email (Portal Login)</label>
                  <input
                    type="email"
                    value={guardianEmail}
                    onChange={e => setGuardianEmail(e.target.value)}
                    placeholder="parent@safereach.school"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-primary font-bold">
                💡 Tip: If this guardian already exists (e.g. Sarah Thompson), the new student will automatically be linked under the same parent account for multi-child switching!
              </div>
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden">
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-md text-primary">Medical & Safety Profile</h2>
              <span className="text-label-sm px-3 py-1 bg-primary/10 text-primary font-bold rounded-full">Step 3 of 4</span>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={e => setBloodGroup(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Emergency Medical Alerts & Allergies</label>
                <textarea
                  rows={3}
                  value={medicalNotes}
                  onChange={e => setMedicalNotes(e.target.value)}
                  placeholder="List any critical medical conditions, daily medications, or allergies..."
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </section>
        )}

        {currentStep === 4 && (
          <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden">
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-md text-primary">Transport & Reaching Route</h2>
              <span className="text-label-sm px-3 py-1 bg-primary/10 text-primary font-bold rounded-full">Step 4 of 4</span>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Morning Travel Mode</label>
                <select className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none">
                  <option>School Bus Route #4 (North Campus)</option>
                  <option>School Bus Route #2 (South Metro)</option>
                  <option>Parent Drop-off / Private Vehicle</option>
                  <option>Walking / Bicycle</option>
                </select>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-label-md font-bold">
                ✅ Ready to complete enrollment for {fullName || 'Student'} into {gradeLevel}-{section}!
              </div>
            </div>
          </section>
        )}

        {/* Buttons */}
        <div className="flex justify-between items-center pt-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-2.5 rounded-xl border border-outline-variant font-bold text-on-surface hover:bg-surface-container"
            >
              Back
            </button>
          ) : <div></div>}

          <div className="flex gap-3">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-8 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:opacity-95"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:opacity-95 disabled:opacity-50"
              >
                {submitting ? 'Enrolling...' : 'Complete Enrollment'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
