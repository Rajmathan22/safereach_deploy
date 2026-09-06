'use client';

import Link from '@/src/next-link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from '@/src/next-navigation';
import LoadingRing from '@/components/LoadingRing';
import { apiBaseUrl } from '@/lib/runtimeConfig';
import { useBackendBootstrap } from '@/lib/backendData';
import { getCurrentTeacherAssignment } from '@/lib/teacherAssignment';

type StudentEditForm = {
  name: string;
  rollNo: string;
  guardian: string;
  phone: string;
  email: string;
  note: string;
  gender: string;
  parentSmsEnabled: boolean;
};

const emptyForm: StudentEditForm = {
  name: '',
  rollNo: '',
  guardian: '',
  phone: '',
  email: '',
  note: '',
  gender: 'Male',
  parentSmsEnabled: true,
};

function TeacherStudentEditContent() {
  const router = useRouter();
  const params = useSearchParams();
  const studentId = params?.get('id') ?? '';
  const { data, loading } = useBackendBootstrap();
  const assignment = getCurrentTeacherAssignment(data);
  const assignedClass = `${assignment.className}-${assignment.sectionName}`;

  const [formState, setFormState] = useState<StudentEditForm>(emptyForm);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resending, setResending] = useState(false);

  const student = data.students.find(item => item.id === studentId);

  useEffect(() => {
    if (student) {
      setFormState({
        name: student.full_name,
        rollNo: student.roll_no,
        guardian: student.guardian_name || '',
        phone: student.parent_phone || '',
        email: (student as any).parent_email || '',
        note: (student as any).emergency_notes || '',
        gender: (student as any).gender || 'Male',
        parentSmsEnabled: student.sms_enabled ?? true,
      });
      setNotice(`Editing ${student.full_name} (${student.student_code})`);
    } else if (!loading) {
      setNotice('Student record was not found in the roster.');
    }
  }, [student, loading]);

  function updateForm(key: keyof StudentEditForm, value: any) {
    setFormState(current => ({ ...current, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !formState.name.trim()) return;
    setSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/students/${encodeURIComponent(student.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formState.name.trim(),
          rollNo: formState.rollNo.trim(),
          guardianName: formState.guardian.trim(),
          parentPhone: formState.phone.trim(),
          parentEmail: formState.email.trim(),
          gender: formState.gender,
          emergencyNotes: formState.note.trim(),
          smsEnabled: formState.parentSmsEnabled,
        }),
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Failed to update student');

      setNotice(`✅ ${formState.name.trim()} updated successfully!`);
      router.push('/teacher/students');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Error updating student');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!student || !window.confirm(`Are you sure you want to remove ${student.full_name} from ${assignedClass}?`)) return;
    setDeleting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/students/${encodeURIComponent(student.id)}`, {
        method: 'DELETE',
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Failed to delete student');

      router.push('/teacher/students');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Error deleting student');
    } finally {
      setDeleting(false);
    }
  }

  async function handleResendInvite() {
    if (!student || !formState.email) return;
    setResending(true);
    try {
      const response = await fetch(`${apiBaseUrl}/students/${encodeURIComponent(student.id)}/resend-parent-invite`, {
        method: 'POST',
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Failed to dispatch email');

      setNotice(`📧 Parent welcome & login credentials email dispatched to ${res.recipientEmail}!`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Error sending email');
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return <LoadingRing size="lg" />;
  }

  return (
    <div className="p-container-padding-mobile md:p-container-padding-desktop flex flex-col gap-stack-lg max-w-4xl mx-auto">
      <nav className="flex flex-wrap items-center gap-2 text-label-md text-on-surface-variant">
        <Link href="/teacher/students" className="hover:text-primary">My Students ({assignedClass})</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-bold text-primary">Edit Student</span>
      </nav>

      <section className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6 space-y-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Edit Student Details</h1>
          <p className="text-body-md text-on-surface-variant">
            Update student profile, guardian contact, parent login email and safety preferences.
          </p>
        </div>

        {notice && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-primary font-bold text-sm">
            {notice}
          </div>
        )}

        {student ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-label-sm font-bold text-on-surface mb-1">Student ID / Code</label>
                <input
                  value={student.student_code}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant font-mono text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-label-sm font-bold text-on-surface mb-1">Student Full Name *</label>
                <input
                  required
                  value={formState.name}
                  onChange={e => updateForm('name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm font-bold text-on-surface mb-1">Roll Number</label>
                <input
                  value={formState.rollNo}
                  onChange={e => updateForm('rollNo', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-label-sm font-bold text-on-surface mb-1">Gender</label>
                <select
                  value={formState.gender}
                  onChange={e => updateForm('gender', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container focus:ring-2 focus:ring-primary outline-none"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="border-t border-outline-variant/30 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">family_restroom</span>
                  Guardian Contact & Parent Portal Access
                </h3>
                {formState.email && (
                  <button
                    type="button"
                    onClick={handleResendInvite}
                    disabled={resending}
                    className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-lg hover:bg-emerald-100 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">mail</span>
                    {resending ? 'Sending...' : 'Resend Parent Invite'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-label-sm font-bold text-on-surface mb-1">Guardian Name</label>
                  <input
                    value={formState.guardian}
                    onChange={e => updateForm('guardian', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-bold text-on-surface mb-1">Guardian Phone (SMS)</label>
                  <input
                    value={formState.phone}
                    onChange={e => updateForm('phone', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-bold text-on-surface mb-1">Guardian Email (Portal Login)</label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={e => updateForm('email', e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-label-sm font-bold text-on-surface mb-1">Medical, Transport & Safety Notes</label>
              <textarea
                rows={2}
                value={formState.note}
                onChange={e => updateForm('note', e.target.value)}
                placeholder="Bus route, allergies, special medical instructions..."
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>

            {/* Parent SMS Alert Toggle */}
            <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5">sms</span>
                <div>
                  <h4 className="font-bold text-primary text-sm">Parent SMS Alerts</h4>
                  <p className="text-xs text-on-surface-variant">When enabled, parent receives automatic SMS on morning absence and afternoon departures.</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formState.parentSmsEnabled}
                onClick={() => updateForm('parentSmsEnabled', !formState.parentSmsEnabled)}
                className={`relative inline-flex h-8 w-16 shrink-0 items-center rounded-full px-1 transition-colors ${
                  formState.parentSmsEnabled ? 'bg-secondary' : 'bg-outline-variant'
                }`}
              >
                <span className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${formState.parentSmsEnabled ? 'translate-x-8' : 'translate-x-0'}`}></span>
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-error text-error font-bold text-sm hover:bg-error/10 disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                {deleting ? 'Removing...' : 'Delete Student'}
              </button>

              <div className="flex gap-3">
                <Link
                  href="/teacher/students"
                  className="px-5 py-2.5 rounded-xl border border-outline-variant font-bold text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:opacity-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {saving ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-on-surface-variant mb-4">Student record not found.</p>
            <Link href="/teacher/students" className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl">
              Back to My Students
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default function TeacherStudentEditPage() {
  return (
    <Suspense fallback={<LoadingRing size="lg" />}>
      <TeacherStudentEditContent />
    </Suspense>
  );
}
