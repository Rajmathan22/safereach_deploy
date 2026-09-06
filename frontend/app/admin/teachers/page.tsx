'use client';

import Link from '@/src/next-link';
import { useMemo, useState } from 'react';
import { type BackendTeacher, useBackendBootstrap } from '@/lib/backendData';
import { apiBaseUrl } from '@/lib/runtimeConfig';
import LoadingRing from '@/components/LoadingRing';

function assignmentLabel(teacher: BackendTeacher) {
  const primary = teacher.assignments?.[0];
  if (!primary) return 'No stored assignment';
  return `${primary.className} - Sec ${primary.sectionName} (${primary.assignmentType === 'primary_incharge' ? 'Class Incharge' : 'Assistant'})`;
}

function assignmentSubject(teacher: BackendTeacher) {
  const subjects = teacher.assignments?.map(item => item.subject).filter(Boolean) ?? [];
  return subjects.length ? Array.from(new Set(subjects)).join(', ') : teacher.subject || 'General';
}

function statusClass(status: string) {
  const value = status.toLowerCase();
  if (value.includes('leave')) return 'bg-red-100 text-red-800';
  if (value.includes('transit')) return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-100 text-emerald-800';
}

export default function AdminTeachersPage() {
  const { data, loading, error } = useBackendBootstrap();
  const [statusFilter, setStatusFilter] = useState('All Staff');
  const [staffSearch, setStaffSearch] = useState('');
  const [notice, setNotice] = useState('');

  // Add teacher modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSubject, setNewSubject] = useState('English');
  const [newQualification, setNewQualification] = useState('B.Ed / Faculty');
  const [assignClass, setAssignClass] = useState('Class 4');
  const [assignSection, setAssignSection] = useState('A');
  const [assignType, setAssignType] = useState('primary_incharge');
  const [submitting, setSubmitting] = useState(false);

  const teachers = data.teachers;
  const unassignedCount = teachers.filter(teacher => !teacher.assignments?.length).length;

  const filteredTeachers = useMemo(() => teachers.filter(teacher => {
    const normalizedStatus = teacher.status || 'available';
    const statusMatch = statusFilter === 'All Staff'
      || (statusFilter === 'On Leave' ? normalizedStatus.toLowerCase().includes('leave') : normalizedStatus === statusFilter);
    const searchMatch = `${teacher.full_name} ${teacher.employee_code} ${teacher.email} ${teacher.phone} ${assignmentLabel(teacher)} ${assignmentSubject(teacher)} ${normalizedStatus}`
      .toLowerCase()
      .includes(staffSearch.toLowerCase());
    return statusMatch && searchMatch;
  }), [staffSearch, statusFilter, teachers]);

  function showToast(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  }

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) {
      showToast('Name and email are required');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim() || '+910000000000',
          subject: newSubject,
          qualification: newQualification,
          className: assignClass,
          sectionName: assignSection,
          assignmentType: assignType,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create teacher');

      showToast(`✅ Teacher ${newFullName} created and assigned to ${assignClass}-${assignSection}!`);
      setShowAddModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      window.location.reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error creating teacher');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingRing size="lg" />;
  }

  return (
    <div className="p-container-padding-mobile md:p-container-padding-desktop space-y-6 max-w-7xl mx-auto">
      {notice && (
        <div className="bg-primary text-on-primary px-4 py-3 rounded-xl shadow-md font-bold flex items-center justify-between animate-fadeIn">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-primary">Staff Directory & Class Incharge</h1>
          <p className="text-label-md text-on-surface-variant">Manage teachers, assign primary/assistant class incharges</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:opacity-95 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Add New Teacher
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-error font-bold">
          Backend error: {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total Staff', value: String(teachers.length), sub: 'Stored records', border: 'border-primary', icon: 'groups', iconCls: 'text-primary bg-primary/10' },
          { label: 'Active Incharge', value: String(teachers.filter(t => t.assignments?.length > 0).length), sub: 'Assigned to class', border: 'border-emerald-600', icon: 'check_circle', iconCls: 'text-emerald-700 bg-emerald-100' },
          { label: 'On Leave', value: String(teachers.filter(t => (t.status || '').toLowerCase().includes('leave')).length), sub: 'Staff on leave', border: 'border-amber-500', icon: 'event_busy', iconCls: 'text-amber-700 bg-amber-100' },
          { label: 'Unassigned Classes', value: String(unassignedCount), sub: 'Action required', border: 'border-red-500', icon: 'warning', iconCls: 'text-error bg-red-100', alert: unassignedCount > 0 },
        ].map(card => (
          <div key={card.label} className={`flex min-h-[96px] items-center gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border-l-4 ${card.border}`}>
            <span className={`material-symbols-outlined shrink-0 p-2.5 ${card.iconCls} rounded-xl`}>{card.icon}</span>
            <div className="min-w-0">
              <p className="text-label-sm font-bold text-on-surface-variant">{card.label}</p>
              <h3 className={`mt-1 text-2xl font-extrabold ${card.alert ? 'text-error' : 'text-primary'}`}>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Table & Filters */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['All Staff', 'available', 'On Leave'].map(filter => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  statusFilter === filter
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {filter === 'available' ? 'Active Duty' : filter}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              value={staffSearch}
              onChange={e => setStaffSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container border-none rounded-xl text-body-md focus:ring-2 focus:ring-primary outline-none"
              placeholder="Search faculty by name, subject, class..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Faculty Member</th>
                <th className="p-4">Class Incharge Assignment</th>
                <th className="p-4">Subject Specialty</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredTeachers.map(teacher => (
                <tr key={teacher.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                        {teacher.full_name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-body-md">{teacher.full_name}</p>
                        <p className="text-label-sm text-on-surface-variant">Code: {teacher.employee_code} • {teacher.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                      {assignmentLabel(teacher)}
                    </span>
                  </td>
                  <td className="p-4 text-body-md text-on-surface font-medium">
                    {assignmentSubject(teacher)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusClass(teacher.status || 'available')}`}>
                      {teacher.status || 'Active Duty'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/messages?chat=teacher-${teacher.id}&name=${encodeURIComponent(teacher.full_name)}`}
                      className="p-2 rounded-lg text-primary hover:bg-primary/10 inline-flex items-center gap-1 font-bold text-xs"
                      title="Direct message"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      Message
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                    No faculty members found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher & Assign Incharge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">person_add</span>
                Add Faculty & Assign Incharge
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Full Name</label>
                <input
                  required
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="ramesh@safereach.school"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Phone</label>
                  <input
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Primary Subject</label>
                  <input
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Qualification</label>
                  <input
                    value={newQualification}
                    onChange={e => setNewQualification(e.target.value)}
                    placeholder="e.g. M.Sc, B.Ed"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-3">
                <p className="text-label-md font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                  Assign Class Incharge (Optional)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Class</label>
                    <select
                      value={assignClass}
                      onChange={e => setAssignClass(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-body-sm"
                    >
                      {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Section</label>
                    <select
                      value={assignSection}
                      onChange={e => setAssignSection(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-body-sm"
                    >
                      {['A', 'B', 'C', 'D'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Role</label>
                    <select
                      value={assignType}
                      onChange={e => setAssignType(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-body-sm"
                    >
                      <option value="primary_incharge">Class Incharge</option>
                      <option value="assistant_incharge">Assistant Incharge</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant font-bold text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:opacity-95 active:scale-95 transition-all shadow-md"
                >
                  {submitting ? 'Saving...' : 'Save & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
