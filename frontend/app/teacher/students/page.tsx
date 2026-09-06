'use client';

import Link from '@/src/next-link';
import { useEffect, useMemo, useState } from 'react';
import { downloadTextFile } from '@/lib/downloadFile';
import { BackendStudent, useBackendBootstrap } from '@/lib/backendData';
import { getCurrentTeacherAssignment, studentsForAssignment } from '@/lib/teacherAssignment';
import { apiBaseUrl } from '@/lib/runtimeConfig';

type TeacherStudent = {
  name: string;
  sub: string;
  id: string;
  grade: string;
  status: string;
  stCls: string;
  guardian: string;
  gSub: string;
  parentEmail?: string;
  activity: string;
  img: string;
  alert?: boolean;
  parentSmsEnabled?: boolean;
  studentCode?: string;
  rollNo?: string;
};

type StudentFormState = {
  name: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  rollNo: string;
  guardian: string;
  guardianRelation: string;
  phone: string;
  email: string;
  note: string;
  status: 'At School' | 'In Transit' | 'Missing Scan' | 'Teacher Updated';
  parentSmsEnabled: boolean;
};

const fallbackImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWO8HpwwBhmeoajB7xWCMFKNJe3sw2BzJjZseSxmUMujJcYruCpH-zH5un-iKCmQ-Ys0Vgs3FqNTMYzOqsICx5AonWuC-QkildK8bDQ6NnDXJA1EKLuX6P4rjcRkY6ATnb8VQapagNpTBA8gIC2g4gwKfxil7G9-ynMmGALAh43c10wCR9D985t1MvUMfAHeZyNrFZanObrllIiGCBVFRDBYOZ2aVLOqYCu4Gc2SgEPOrv4WvLxL1s_d_60yhwdOBVu-uXPY7Csh7G';

const emptyForm: StudentFormState = {
  name: '',
  dob: '2016-04-12',
  gender: 'Male',
  bloodGroup: 'O+',
  rollNo: '',
  guardian: '',
  guardianRelation: 'Mother',
  phone: '+91 98765 00000',
  email: '',
  note: '',
  status: 'At School',
  parentSmsEnabled: true,
};

function statusClass(status: string) {
  if (status === 'Missing Scan' || status === 'absent') return 'bg-error-container/20 text-error border-error/20';
  if (status === 'In Transit' || status === 'to_school') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (status === 'Teacher Updated') return 'bg-primary/10 text-primary border-primary/20';
  return 'bg-secondary-container/10 text-secondary border-secondary/20';
}

function storedStudentToTeacherStudent(student: BackendStudent): TeacherStudent {
  const status = student.travel_status === 'absent' ? 'Missing Scan' : student.travel_status === 'to_school' ? 'In Transit' : 'At School';
  return {
    name: student.full_name,
    sub: student.attendance_status === 'absent' ? 'Attendance marked absent' : ((student as any).emergency_notes || 'SafeReach enrolled'),
    id: student.id,
    studentCode: student.student_code,
    rollNo: student.roll_no,
    grade: `${student.class_name}-${student.section_name}`,
    status,
    stCls: statusClass(status),
    guardian: student.parent_phone || 'Phone unavailable',
    parentEmail: (student as any).parent_email || '',
    gSub: student.guardian_name ? `Guardian: ${student.guardian_name}` : 'Guardian: Not assigned',
    activity: 'SafeReach active record',
    img: fallbackImage,
    alert: student.travel_status === 'absent',
    parentSmsEnabled: student.sms_enabled,
  };
}

function ToolbarIconButton({ icon, label, onClick, accent = false }: { icon: string; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={`group relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:z-50 focus-visible:z-50 ${accent ? 'bg-secondary text-on-secondary hover:opacity-90' : 'border border-outline text-on-surface hover:bg-surface-container-high'}`}>
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-[60] mb-2 whitespace-nowrap rounded-md border border-outline-variant bg-white px-2 py-1 text-xs font-bold text-on-surface shadow-md opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{label}</span>
    </button>
  );
}

type TeacherStudentsPageProps = {
  mode?: 'full' | 'dashboard' | 'add';
};

export function TeacherStudentDashboardSummary() {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const { data } = useBackendBootstrap();
  const assignment = getCurrentTeacherAssignment(data);
  const assignedClass = `${assignment.className}-${assignment.sectionName}`;

  useEffect(() => {
    setStudents(studentsForAssignment(data.students, assignment.className, assignment.sectionName).map(storedStudentToTeacherStudent));
  }, [data.students, assignment.className, assignment.sectionName]);

  function downloadTemplate() {
    downloadTextFile(
      'safereach-teacher-student-template.csv',
      'student_name,roll_no,gender,guardian_name,guardian_phone,guardian_email,emergency_notes\n' +
      'Arjun Das,01,Male,Rohit Das,+91 98765 00011,rohit.das@example.com,No allergies\n',
      'text/csv'
    );
  }

  const stats = { students: students.length, alerts: students.filter(student => student.alert).length };
  const summary = [
    { icon: 'group', bg: 'bg-primary-container/10', c: 'text-primary', label: 'Assigned Class', value: assignedClass },
    { icon: 'school', bg: 'bg-secondary-container/20', c: 'text-secondary', label: 'Students', value: String(stats.students) },
    { icon: 'edit_note', bg: 'bg-tertiary-fixed/40', c: 'text-tertiary-fixed-dim', label: 'Access', value: 'Incharge / Assistant' },
    { icon: 'warning', bg: 'bg-error-container/40', c: 'text-error', label: 'Alerts/Missing', value: String(stats.alerts), border: true },
  ];

  return (
    <section className="flex flex-col gap-stack-md">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-stack-md">
        {summary.map(stat => (
          <div key={stat.label} className={`flex min-w-0 items-center gap-2 rounded-xl border border-outline-variant bg-surface p-3 shadow-sm md:gap-stack-md md:p-stack-md ${stat.border ? 'border-l-4 border-l-error' : ''}`}>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${stat.bg} ${stat.c} md:h-12 md:w-12`}>
              <span className="material-symbols-outlined text-[19px] md:text-[24px]">{stat.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] uppercase tracking-wider text-on-surface-variant md:text-label-sm">{stat.label}</p>
              <p className={`truncate text-base font-bold leading-tight md:text-2xl ${stat.border ? 'text-error' : ''}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TeacherStudentsPage({ mode = 'full' }: TeacherStudentsPageProps = {}) {
  const dashboardMode = mode === 'dashboard';
  const addMode = mode === 'add';
  const [teacherStudents, setTeacherStudents] = useState<TeacherStudent[]>([]);
  const [formState, setFormState] = useState<StudentFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('Only assigned class students can be added or edited by the class incharge.');
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Bulk Upload Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkParsedRows, setBulkParsedRows] = useState<any[]>([]);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  const { data } = useBackendBootstrap();
  const assignment = getCurrentTeacherAssignment(data);
  const assignedClass = `${assignment.className}-${assignment.sectionName}`;

  useEffect(() => {
    setTeacherStudents(studentsForAssignment(data.students, assignment.className, assignment.sectionName).map(storedStudentToTeacherStudent));
  }, [data.students, assignment.className, assignment.sectionName]);

  const stats = useMemo(() => ({
    students: teacherStudents.length,
    alerts: teacherStudents.filter(student => student.alert).length,
  }), [teacherStudents]);

  function updateForm(key: keyof StudentFormState, value: any) {
    setFormState(current => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setFormState(emptyForm);
  }

  function downloadTemplate() {
    downloadTextFile(
      'safereach-teacher-student-template.csv',
      'student_name,roll_no,gender,guardian_name,guardian_phone,guardian_email,emergency_notes\n' +
      'Arjun Das,01,Male,Rohit Das,+91 98765 00011,rohit.das@example.com,No allergies\n',
      'text/csv'
    );
  }

  async function handleSaveStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formState.name.trim()) return;
    setSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formState.name.trim(),
          rollNo: formState.rollNo.trim() || `${teacherStudents.length + 1}`,
          className: assignment.className,
          sectionName: assignment.sectionName,
          gender: formState.gender,
          dob: formState.dob,
          guardianName: formState.guardian.trim() || 'Parent / Guardian',
          parentPhone: formState.phone.trim(),
          parentEmail: formState.email.trim(),
          emergencyNotes: `[Relation: ${formState.guardianRelation || 'Guardian'}] [Blood: ${formState.bloodGroup || 'O+'}] ${formState.note.trim()}`,
          sendEmailInvite: true,
        }),
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Failed to add student');

      setNotice(`✅ ${formState.name.trim()} enrolled in ${assignedClass}! Parent credentials dispatched to ${res.parentEmail || 'guardian'}.`);
      resetForm();
      window.location.reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Error adding student');
    } finally {
      setSaving(false);
    }
  }

  async function handleResendInvite(student: TeacherStudent) {
    setResendingId(student.id);
    try {
      const response = await fetch(`${apiBaseUrl}/students/${encodeURIComponent(student.id)}/resend-parent-invite`, {
        method: 'POST',
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Failed to dispatch email');

      setNotice(`📧 Parent Welcome email sent to ${res.recipientEmail}!`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Error resending parent invitation');
    } finally {
      setResendingId(null);
    }
  }

  function handleCsvFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkCsvText(content);
      parseCsv(content);
    };
    reader.readAsText(file);
  }

  function parseCsv(text: string) {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setBulkParsedRows([]);
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));
    const rows = lines.slice(1).map((line, idx) => {
      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] || '';
      });
      return {
        id: idx + 1,
        fullName: obj.student_name || obj.full_name || obj.name || cols[0] || '',
        rollNo: obj.roll_no || obj.roll || cols[1] || `${idx + 1}`,
        className: assignment.className,
        sectionName: assignment.sectionName,
        gender: obj.gender || cols[2] || 'Not Specified',
        guardianName: obj.guardian_name || obj.parent_name || cols[3] || 'Parent',
        parentPhone: obj.guardian_phone || obj.parent_phone || cols[4] || '+91 98765 00000',
        parentEmail: obj.guardian_email || obj.parent_email || cols[5] || '',
        emergencyNotes: obj.emergency_notes || obj.notes || cols[6] || '',
      };
    });
    setBulkParsedRows(rows.filter(r => r.fullName));
  }

  async function handleExecuteBulkUpload() {
    if (bulkParsedRows.length === 0) return;
    setUploadingBulk(true);
    try {
      const response = await fetch(`${apiBaseUrl}/students/bulk-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: bulkParsedRows }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Bulk upload failed');

      setBulkResult(res);
      setNotice(`🚀 Successfully enrolled ${res.totalEnrolled} students & dispatched parent invitations!`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Error in bulk upload');
    } finally {
      setUploadingBulk(false);
    }
  }

  return (
    <div className="p-container-padding-mobile md:p-container-padding-desktop flex flex-col gap-stack-lg">
      {!dashboardMode && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-stack-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">
              {addMode ? `Add Student to ${assignedClass}` : 'Student Records Management'}
            </h2>
            <p className="text-on-surface-variant font-body-md">
              Manage assigned {assignedClass} students, parent accounts & live transit status.
            </p>
          </div>
          {!addMode && (
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-3.5 py-2 border border-outline-variant font-bold text-primary rounded-xl hover:bg-surface-container transition-all text-xs"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Template
              </button>
              <button
                onClick={() => {
                  setShowBulkModal(true);
                  setBulkResult(null);
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-secondary/15 text-secondary border border-secondary/30 font-bold rounded-xl hover:bg-secondary/25 transition-all text-xs"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Bulk CSV Import
              </button>
              <Link
                href="/teacher/students/add"
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all text-xs shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Add Student
              </Link>
            </div>
          )}
        </div>
      )}

      {!addMode && !dashboardMode && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-stack-md">
          {[
            { icon: 'group', bg: 'bg-primary-container/10', c: 'text-primary', label: 'Assigned Class', value: assignedClass },
            { icon: 'school', bg: 'bg-secondary-container/20', c: 'text-secondary', label: 'Students', value: String(stats.students) },
            { icon: 'edit_note', bg: 'bg-tertiary-fixed/40', c: 'text-tertiary-fixed-dim', label: 'Access', value: 'Incharge / Assistant' },
            { icon: 'warning', bg: 'bg-error-container/40', c: 'text-error', label: 'Alerts/Missing', value: String(stats.alerts), border: true },
          ].map(stat => (
            <div key={stat.label} className={`bg-surface p-3 md:p-stack-md rounded-xl border border-outline-variant shadow-sm flex items-center gap-2 md:gap-stack-md min-w-0 ${stat.border ? 'border-l-4 border-l-error' : ''}`}>
              <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full ${stat.bg} flex items-center justify-center ${stat.c} shrink-0`}>
                <span className="material-symbols-outlined text-[19px] md:text-[24px]">{stat.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-on-surface-variant text-[10px] md:text-label-sm uppercase tracking-wider truncate">{stat.label}</p>
                <p className={`text-base md:text-2xl font-bold leading-tight truncate ${stat.border ? 'text-error' : ''}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {addMode && (
        <form onSubmit={handleSaveStudent} className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6 space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-outline-variant/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">school</span>
                <h3 className="font-headline-md text-headline-md text-primary">Add Student Enrollment</h3>
                <span className="px-3 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
                  {assignedClass}
                </span>
              </div>
              <p className="text-label-md text-on-surface-variant mt-1">
                Enrolling will register the student into <strong>{assignedClass}</strong>, provision the parent account, and send login credentials.
              </p>
            </div>
            <Link href="/teacher/students" className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-outline text-on-surface hover:bg-surface-container font-bold text-xs self-start sm:self-auto">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to List
            </Link>
          </div>

          {/* Section 1: Student Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <h4>1. Student Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-label-sm font-bold text-on-surface">Student Full Name *</span>
                <input
                  value={formState.name}
                  onChange={e => updateForm('name', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="e.g. Rohan Das"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-label-sm font-bold text-on-surface">Roll Number</span>
                <input
                  value={formState.rollNo}
                  onChange={e => updateForm('rollNo', e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="e.g. 15"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-label-sm font-bold text-on-surface">Date of Birth</span>
                <input
                  type="date"
                  value={formState.dob}
                  onChange={e => updateForm('dob', e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-label-sm font-bold text-on-surface">Gender</span>
                <select
                  value={formState.gender}
                  onChange={e => updateForm('gender', e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-label-sm font-bold text-on-surface">Enrolled Class (Locked)</span>
                <input
                  value={assignedClass}
                  readOnly
                  disabled
                  className="w-full px-4 py-2.5 bg-surface-container-high border border-outline-variant/60 rounded-xl text-on-surface-variant font-bold text-sm cursor-not-allowed"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Guardian Information */}
          <div className="border-t border-outline-variant/30 pt-4 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">family_restroom</span>
              <h4>2. Guardian Information & Parent Portal Account</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-label-sm font-bold text-on-surface">Guardian Name *</span>
                <input
                  value={formState.guardian}
                  onChange={e => updateForm('guardian', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="e.g. Sarah Thompson"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-label-sm font-bold text-on-surface">Relationship</span>
                <select
                  value={formState.guardianRelation}
                  onChange={e => updateForm('guardianRelation', e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Grandparent">Grandparent</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-label-sm font-bold text-on-surface">Guardian Phone (SMS) *</span>
                <input
                  value={formState.phone}
                  onChange={e => updateForm('phone', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="+91 98765 00000"
                />
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-label-sm font-bold text-on-surface">Guardian Email (Parent Portal Login)</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={e => updateForm('email', e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="parent@safereach.school"
                />
                <span className="text-[11px] text-on-surface-variant">Default password <code>Parent@2025</code> will be emailed.</span>
              </label>
            </div>
          </div>

          {/* Section 3: Medical & Safety Profile */}
          <div className="border-t border-outline-variant/30 pt-4 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">medical_services</span>
              <h4>3. Health, Blood Group & Safety Notes</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-label-sm font-bold text-on-surface">Blood Group</span>
                <select
                  value={formState.bloodGroup}
                  onChange={e => updateForm('bloodGroup', e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-label-sm font-bold text-on-surface">Medical Allergies / Transport Notes</span>
                <input
                  value={formState.note}
                  onChange={e => updateForm('note', e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="e.g. Peanut allergy, Bus Route #4 pickup"
                />
              </label>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-xs text-primary font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">info</span>
            <span>{notice}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/teacher/students" className="px-5 py-2.5 rounded-xl border border-outline-variant font-bold text-on-surface hover:bg-surface-container text-xs sm:text-sm">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 shadow-md disabled:opacity-50 flex items-center gap-2 text-xs sm:text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              {saving ? 'Enrolling & Sending Email...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      )}

      {!addMode && (
        <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
            <div>
              <h3 className="font-headline-md text-headline-md text-primary">{assignedClass} Student Roster</h3>
              <p className="text-xs text-on-surface-variant">Showing assigned class students with live SafeReach status</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full">
              {teacherStudents.length} Students
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead className="bg-surface-container text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="p-4">Roll</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Student Code</th>
                  <th className="p-4">Transit Status</th>
                  <th className="p-4">Guardian Contact & Email</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {teacherStudents.map(student => (
                  <tr key={student.id} className={`hover:bg-surface-container-lowest transition-colors ${student.alert ? 'border-l-4 border-l-error' : ''}`}>
                    <td className="p-4 font-bold text-primary">{student.rollNo || '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img alt={student.name} className="w-9 h-9 rounded-full bg-surface-container" src={student.img} />
                        <div>
                          <p className="font-bold text-on-surface text-sm">{student.name}</p>
                          <p className={`text-xs ${student.alert ? 'text-error font-bold' : 'text-on-surface-variant'}`}>{student.sub}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-on-surface-variant font-mono text-xs">{student.studentCode ?? student.id}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${student.stCls}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-xs text-on-surface">{student.gSub.replace('Guardian: ', '')}</p>
                      <p className="text-xs text-on-surface-variant">
                        {student.guardian}
                        {student.parentEmail && <span className="text-primary font-bold"> &bull; {student.parentEmail}</span>}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleResendInvite(student)}
                          disabled={resendingId === student.id || !student.parentEmail}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-100 disabled:opacity-40 transition-all flex items-center gap-1"
                          title="Resend Parent Welcome Email"
                        >
                          <span className="material-symbols-outlined text-[14px]">mail</span>
                          {resendingId === student.id ? 'Sending...' : 'Invite'}
                        </button>
                        <Link
                          href={`/teacher/students/edit?id=${encodeURIComponent(student.id)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-xs hover:bg-primary/15"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {teacherStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                      No students enrolled in {assignedClass} yet. Tap "Add Student" to enroll your first student.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Upload CSV Modal for Teacher */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">upload_file</span>
                Bulk Import Students for {assignedClass}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  if (bulkResult) window.location.reload();
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant"
              >
                ✕
              </button>
            </div>

            {bulkResult ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <div className="flex items-center gap-2 font-bold text-lg mb-2">
                    <span className="material-symbols-outlined text-emerald-700">check_circle</span>
                    Bulk Enrollment Completed!
                  </div>
                  <p className="text-sm">Total Enrolled & Emails Sent: <strong>{bulkResult.totalEnrolled}</strong></p>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkModal(false);
                      window.location.reload();
                    }}
                    className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md"
                  >
                    Done & Refresh Roster
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl border border-primary/20">
                  <div>
                    <p className="font-bold text-primary text-sm">Download class CSV template</p>
                    <p className="text-xs text-on-surface-variant">Includes columns for student name, roll, guardian name, phone, email.</p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download CSV
                  </button>
                </div>

                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-2">Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileSelect}
                    className="w-full text-sm text-on-surface file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:opacity-90 cursor-pointer"
                  />
                </div>

                {bulkParsedRows.length > 0 && (
                  <div>
                    <h4 className="font-bold text-primary text-sm mb-2">
                      Preview Students ({bulkParsedRows.length} ready):
                    </h4>
                    <div className="max-h-48 overflow-y-auto border border-outline-variant/30 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-container sticky top-0 text-on-surface-variant font-bold">
                          <tr>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Roll</th>
                            <th className="p-2.5">Guardian</th>
                            <th className="p-2.5">Email</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {bulkParsedRows.map((r, i) => (
                            <tr key={i} className="hover:bg-surface-container-low">
                              <td className="p-2.5 font-bold text-on-surface">{r.fullName}</td>
                              <td className="p-2.5">{r.rollNo}</td>
                              <td className="p-2.5">{r.guardianName}</td>
                              <td className="p-2.5 text-primary">{r.parentEmail || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-outline-variant font-bold text-on-surface hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteBulkUpload}
                    disabled={uploadingBulk || bulkParsedRows.length === 0}
                    className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:opacity-95 disabled:opacity-50"
                  >
                    {uploadingBulk ? 'Enrolling...' : `Enroll ${bulkParsedRows.length} Students`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
