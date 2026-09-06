'use client';

import Link from '@/src/next-link';
import { useMemo, useState } from 'react';
import { useBackendBootstrap, type BackendStudent } from '@/lib/backendData';
import { downloadTextFile } from '@/lib/downloadFile';
import { apiBaseUrl } from '@/lib/runtimeConfig';
import { travelStatusClass, travelStatusIcon, travelStatusLabel } from '@/lib/studentTravel';
import LoadingRing from '@/components/LoadingRing';

export default function AdminStudentsPage() {
  const { data, loading, error } = useBackendBootstrap();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  const [promoteStudent, setPromoteStudent] = useState<BackendStudent | null>(null);
  const [targetClass, setTargetClass] = useState('Class 5');
  const [targetSection, setTargetSection] = useState('A');
  const [promoting, setPromoting] = useState(false);

  const [editingStudent, setEditingStudent] = useState<BackendStudent | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    rollNo: '',
    className: '',
    sectionName: '',
    guardianName: '',
    parentPhone: '',
    parentEmail: '',
    gender: 'Male',
    smsEnabled: true,
    emergencyNotes: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingStudent, setDeletingStudent] = useState<BackendStudent | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkParsedRows, setBulkParsedRows] = useState<any[]>([]);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  const [resendingId, setResendingId] = useState<string | null>(null);

  const firstClass = data.classes[0];
  const selectedClass = data.classes.find(item => item.id === selectedClassId) ?? firstClass;
  const activeSection = selectedSection || selectedClass?.sections[0]?.name || '';

  const visibleStudents = useMemo(() => data.students.filter(student => {
    const classMatch = !selectedClass || student.class_name === selectedClass.class_name;
    const sectionMatch = !activeSection || student.section_name === activeSection;
    const searchMatch = `${student.full_name} ${student.student_code} ${student.guardian_name} ${student.parent_email || ''}`.toLowerCase().includes(search.toLowerCase());
    return classMatch && sectionMatch && searchMatch;
  }), [activeSection, data.students, search, selectedClass]);

  function showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 4500);
  }

  function downloadTemplate() {
    downloadTextFile(
      'safereach-student-upload-template.csv',
      'full_name,roll_no,class_name,section_name,gender,guardian_name,guardian_phone,guardian_email,emergency_notes\n' +
      'Vikram Sharma,01,Class 4,A,Male,Sunita Sharma,+91 98765 43210,sunita.sharma@example.com,No critical allergies\n' +
      'Ananya Roy,02,Class 4,A,Female,Elena Roy,+91 98765 11113,elena.roy@safereach.school,Carries asthma inhaler\n',
      'text/csv'
    );
  }

  function openEditModal(student: BackendStudent) {
    setEditingStudent(student);
    setEditForm({
      fullName: student.full_name,
      rollNo: student.roll_no,
      className: student.class_name,
      sectionName: student.section_name,
      guardianName: student.guardian_name || '',
      parentPhone: student.parent_phone || '',
      parentEmail: (student as any).parent_email || '',
      gender: (student as any).gender || 'Male',
      smsEnabled: student.sms_enabled ?? true,
      emergencyNotes: (student as any).emergency_notes || '',
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingEdit(true);
    try {
      const response = await fetch(`${apiBaseUrl}/students/${encodeURIComponent(editingStudent.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Failed to update student');

      showToast(`✅ ${editForm.fullName} updated successfully!`);
      setEditingStudent(null);
      window.location.reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error updating student', 'error');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteStudent() {
    if (!deletingStudent) return;
    setDeleting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/students/${encodeURIComponent(deletingStudent.id)}`, {
        method: 'DELETE',
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Failed to delete student');

      showToast(`🗑️ ${deletingStudent.full_name} removed successfully.`);
      setDeletingStudent(null);
      window.location.reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error deleting student', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleResendInvite(student: BackendStudent) {
    setResendingId(student.id);
    try {
      const response = await fetch(`${apiBaseUrl}/students/${encodeURIComponent(student.id)}/resend-parent-invite`, {
        method: 'POST',
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Failed to dispatch email');

      showToast(`📧 Parent Welcome & Login credentials email sent to ${res.recipientEmail}!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error resending parent invitation', 'error');
    } finally {
      setResendingId(null);
    }
  }

  async function handlePromote(e: React.FormEvent) {
    e.preventDefault();
    if (!promoteStudent) return;
    setPromoting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/students/${encodeURIComponent(promoteStudent.id)}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: targetClass,
          sectionName: targetSection,
        }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Promotion failed');

      showToast(`🎉 ${promoteStudent.full_name} promoted to ${targetClass}-${targetSection}!`);
      setPromoteStudent(null);
      window.location.reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error promoting student', 'error');
    } finally {
      setPromoting(false);
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
        fullName: obj.full_name || obj.student_name || obj.name || cols[0] || '',
        rollNo: obj.roll_no || obj.roll || cols[1] || `${idx + 1}`,
        className: obj.class_name || obj.class || obj.grade || cols[2] || 'Class 4',
        sectionName: obj.section_name || obj.section || cols[3] || 'A',
        gender: obj.gender || cols[4] || 'Not Specified',
        guardianName: obj.guardian_name || obj.parent_name || cols[5] || 'Parent',
        parentPhone: obj.guardian_phone || obj.parent_phone || cols[6] || '+91 98765 00000',
        parentEmail: obj.guardian_email || obj.parent_email || cols[7] || '',
        emergencyNotes: obj.emergency_notes || obj.notes || cols[8] || '',
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
      showToast(`🚀 Successfully enrolled ${res.totalEnrolled} students & dispatched parent invitations!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error in bulk upload', 'error');
    } finally {
      setUploadingBulk(false);
    }
  }

  if (loading) {
    return <LoadingRing size="lg" />;
  }

  return (
    <div className="p-container-padding-mobile md:p-container-padding-desktop space-y-6 max-w-7xl mx-auto">
      {notice && (
        <div className={`px-4 py-3 rounded-xl shadow-md font-bold flex items-center justify-between animate-fadeIn text-white ${
          notice.type === 'error' ? 'bg-error' : notice.type === 'info' ? 'bg-secondary' : 'bg-primary'
        }`}>
          <span>{notice.msg}</span>
          <button onClick={() => setNotice(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Class Records & Student Roster</h1>
          <p className="text-label-md text-on-surface-variant">Manage classes, standards, student enrollment, parent invitations & promotions</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant font-bold text-primary rounded-xl hover:bg-surface-container transition-all"
            title="Download CSV Template for Bulk Upload"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            CSV Template
          </button>
          <button
            onClick={() => {
              setShowBulkModal(true);
              setBulkResult(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-secondary/15 text-secondary border border-secondary/30 font-bold rounded-xl hover:bg-secondary/25 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            Bulk Upload (CSV)
          </button>
          <Link
            href="/admin/students/add"
            className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Add New Student
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-error/10 border border-error/20 p-4 text-error font-bold">
          Backend error: {error}
        </div>
      )}

      {/* Standard / Class Cards Grid */}
      <div>
        <h3 className="font-headline-md text-headline-md text-primary mb-3">Academic Classes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {data.classes.map(item => {
            const classStudents = data.students.filter(s => s.class_name === item.class_name);
            const present = classStudents.filter(s => s.attendance_status === 'present').length;
            const attendance = classStudents.length ? `${Math.round((present / classStudents.length) * 100)}%` : '100%';
            const isSelected = selectedClass?.id === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedClassId(item.id);
                  setSelectedSection(item.sections[0]?.name || '');
                }}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md'
                    : 'border-outline-variant/60 bg-surface-container-lowest hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-2xl text-on-surface">{item.class_name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container font-bold text-on-surface-variant">
                    Sec {item.sections[0]?.name ?? 'A'}
                  </span>
                </div>
                <p className="mt-4 text-sm font-bold text-primary">
                  {classStudents.length} Students
                </p>
                <p className="text-xs font-bold text-emerald-700 mt-1">
                  SafeReach: {attendance}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Class Roster Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden">
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-primary">
              {selectedClass?.class_name ?? 'Class 4'} - Section {activeSection || 'A'} Roster
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              {visibleStudents.length} students enrolled in this standard
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student, roll, parent, email..."
              className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-body-md focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Roll</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Student ID</th>
                <th className="p-4">Travel Safety Status</th>
                <th className="p-4">Parent / Guardian & Email</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {visibleStudents.map(student => (
                <tr key={student.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4 font-extrabold text-primary">{student.roll_no}</td>
                  <td className="p-4">
                    <p className="font-bold text-on-surface text-body-md">{student.full_name}</p>
                    <p className="text-label-sm text-on-surface-variant">{student.class_name} - Sec {student.section_name}</p>
                  </td>
                  <td className="p-4 font-bold text-on-surface-variant text-sm">
                    <code>{student.student_code}</code>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${travelStatusClass(student.travel_status as any)}`}>
                      <span className="material-symbols-outlined text-[14px]">{travelStatusIcon(student.travel_status as any)}</span>
                      {travelStatusLabel(student.travel_status as any)}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-body-md text-on-surface">{student.guardian_name}</p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span>{student.parent_phone}</span>
                      {(student as any).parent_email && (
                        <span className="text-primary font-bold"> &bull; {(student as any).parent_email}</span>
                      )}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(student)}
                        className="px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-on-surface font-bold text-xs hover:bg-surface-container-high transition-all"
                        title="Edit Student Information"
                      >
                        <span className="material-symbols-outlined text-[15px] align-middle mr-0.5">edit</span>
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResendInvite(student)}
                        disabled={resendingId === student.id || !(student as any).parent_email}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-100 disabled:opacity-40 transition-all"
                        title="Resend Parent Welcome & Login Email"
                      >
                        <span className="material-symbols-outlined text-[15px] align-middle mr-0.5">
                          {resendingId === student.id ? 'sync' : 'mail'}
                        </span>
                        {resendingId === student.id ? 'Sending...' : 'Invite'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPromoteStudent(student)}
                        className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-xs hover:bg-primary hover:text-on-primary transition-all"
                      >
                        Promote
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingStudent(student)}
                        className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-all"
                        title="Remove Student"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    No students match the current selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">edit_square</span>
                Edit Student Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Student Full Name *</label>
                  <input
                    required
                    value={editForm.fullName}
                    onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Roll Number</label>
                  <input
                    value={editForm.rollNo}
                    onChange={e => setEditForm(f => ({ ...f, rollNo: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Grade / Class</label>
                  <select
                    value={editForm.className}
                    onChange={e => setEditForm(f => ({ ...f, className: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  >
                    {data.classes.map(c => <option key={c.id} value={c.class_name}>{c.class_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Section</label>
                  <select
                    value={editForm.sectionName}
                    onChange={e => setEditForm(f => ({ ...f, sectionName: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  >
                    {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-4 mt-4">
                <h4 className="font-bold text-primary mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">family_restroom</span>
                  Guardian & Parent Portal Login
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-md font-bold text-on-surface mb-1">Guardian Name</label>
                    <input
                      value={editForm.guardianName}
                      onChange={e => setEditForm(f => ({ ...f, guardianName: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-bold text-on-surface mb-1">Guardian Phone (SMS Alerts)</label>
                    <input
                      value={editForm.parentPhone}
                      onChange={e => setEditForm(f => ({ ...f, parentPhone: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-label-md font-bold text-on-surface mb-1">Guardian Email (Parent Portal Login)</label>
                    <input
                      type="email"
                      value={editForm.parentEmail}
                      onChange={e => setEditForm(f => ({ ...f, parentEmail: e.target.value }))}
                      placeholder="e.g. parent@example.com"
                      className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    />
                    <p className="text-xs text-on-surface-variant mt-1">Updating this email also updates the login account for the parent portal.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Emergency / Medical Notes</label>
                <textarea
                  rows={2}
                  value={editForm.emergencyNotes}
                  onChange={e => setEditForm(f => ({ ...f, emergencyNotes: e.target.value }))}
                  placeholder="Allergies, medications, or travel instructions..."
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant font-bold text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-error mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="font-headline-md text-headline-md font-bold">Remove Student</h3>
            </div>
            <p className="text-body-md text-on-surface mb-4">
              Are you sure you want to remove <strong>{deletingStudent.full_name}</strong> ({deletingStudent.student_code}) from {deletingStudent.class_name}-{deletingStudent.section_name}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant font-bold text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={deleting}
                className="px-5 py-2 bg-error text-white font-bold rounded-xl shadow-md hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? 'Removing...' : 'Yes, Remove Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Promotion Modal */}
      {promoteStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">upgrade</span>
                Promote to Next Standard
              </h3>
              <button
                type="button"
                onClick={() => setPromoteStudent(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant"
              >
                ✕
              </button>
            </div>

            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 mb-4">
              <p className="font-bold text-primary text-body-md">{promoteStudent.full_name}</p>
              <p className="text-label-sm text-on-surface-variant">
                Current: {promoteStudent.class_name} - Section {promoteStudent.section_name} ({promoteStudent.student_code})
              </p>
            </div>

            <form onSubmit={handlePromote} className="space-y-4">
              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Target Class / Standard</label>
                <select
                  value={targetClass}
                  onChange={e => setTargetClass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                >
                  {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Target Section</label>
                <select
                  value={targetSection}
                  onChange={e => setTargetSection(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                >
                  {['A', 'B', 'C', 'D'].map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setPromoteStudent(null)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant font-bold text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={promoting}
                  className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:opacity-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {promoting ? 'Promoting...' : 'Confirm Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload CSV Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">upload_file</span>
                Bulk Student Import & Automated Parent Invitations
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
                  <p className="text-sm">Total Students Processed: <strong>{bulkResult.totalProcessed}</strong></p>
                  <p className="text-sm">Successfully Enrolled & Emails Dispatched: <strong>{bulkResult.totalEnrolled}</strong></p>
                  {bulkResult.totalFailed > 0 && (
                    <p className="text-sm text-error font-bold mt-1">Failed Rows: {bulkResult.totalFailed}</p>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto border border-outline-variant/30 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container sticky top-0 font-bold text-on-surface-variant">
                      <tr>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">Parent Email</th>
                        <th className="p-3">Password / Status</th>
                        <th className="p-3">Email Delivery</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {bulkResult.enrolled?.map((item: any) => (
                        <tr key={item.studentId} className="hover:bg-surface-container-low">
                          <td className="p-3 font-bold text-on-surface">{item.fullName}</td>
                          <td className="p-3">{item.className}-{item.sectionName}</td>
                          <td className="p-3">{item.parentEmail || '(None)'}</td>
                          <td className="p-3 font-mono text-xs">{item.parentCredentials?.password}</td>
                          <td className="p-3 text-emerald-700 font-bold">
                            {item.emailDelivery?.ok ? '✅ Delivered' : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/20">
                  <div>
                    <p className="font-bold text-primary text-body-md">Download standard CSV template</p>
                    <p className="text-xs text-on-surface-variant">Includes columns for student name, class, section, guardian name, email & phone.</p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download CSV
                  </button>
                </div>

                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-2">Upload CSV File</label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileSelect}
                    className="w-full text-sm text-on-surface file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:opacity-90 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Or Paste CSV Data Directly:</label>
                  <textarea
                    rows={4}
                    value={bulkCsvText}
                    onChange={e => {
                      setBulkCsvText(e.target.value);
                      parseCsv(e.target.value);
                    }}
                    placeholder="full_name,roll_no,class_name,section_name,gender,guardian_name,guardian_phone,guardian_email,emergency_notes"
                    className="w-full px-4 py-2 font-mono text-xs bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                {bulkParsedRows.length > 0 && (
                  <div>
                    <h4 className="font-bold text-primary text-sm mb-2">
                      Preview Parsed Students ({bulkParsedRows.length} ready):
                    </h4>
                    <div className="max-h-48 overflow-y-auto border border-outline-variant/30 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-container sticky top-0 text-on-surface-variant font-bold">
                          <tr>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Class</th>
                            <th className="p-2.5">Guardian</th>
                            <th className="p-2.5">Guardian Email</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {bulkParsedRows.slice(0, 10).map((r, i) => (
                            <tr key={i} className="hover:bg-surface-container-low">
                              <td className="p-2.5 font-bold text-on-surface">{r.fullName}</td>
                              <td className="p-2.5">{r.className}-{r.sectionName}</td>
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
                    className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:opacity-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploadingBulk ? 'Enrolling & Sending Emails...' : `Enroll ${bulkParsedRows.length} Students`}
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
