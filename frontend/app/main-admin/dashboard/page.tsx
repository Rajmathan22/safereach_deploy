'use client';

import { useEffect, useMemo, useState } from 'react';
import MainAdminShell from '@/components/MainAdminShell';
import {
  INDUSTRY_ACCESS_EVENT,
  fetchIndustryMenuAccess,
  industryMenuItems,
  readIndustryMenuAccess,
  saveIndustryMenuAccess,
  writeIndustryMenuAccess,
  type IndustryMenuAccess,
  type IndustryMenuKey,
} from '@/lib/industryAccess';
import { apiBaseUrl } from '@/lib/runtimeConfig';

type RequestStatus = 'Pending' | 'Accepted' | 'Rejected';

type SchoolRequest = {
  id: string;
  schoolName: string;
  board: string;
  city: string;
  address: string;
  adminName: string;
  email: string;
  phone: string;
  password: string;
  status: RequestStatus;
  requestedAt: string;
};

type Student = {
  id: string;
  name: string;
  roll: string;
  guardian: string;
  status: string;
};

type Section = {
  name: string;
  incharge: string;
  students: Student[];
};

type School = {
  id: string;
  name: string;
  admin: string;
  email: string;
  status: string;
  staff: { name: string; role: string; assigned: string; status: string }[];
  classes: { className: string; sections: Section[] }[];
};

const REQUEST_KEY = 'safereach_school_requests';

const seedRequests: SchoolRequest[] = [
  {
    id: 'REQ-240801',
    schoolName: 'Green Valley Public School',
    board: 'CBSE',
    city: 'Chennai',
    address: 'Anna Nagar Campus',
    adminName: 'Priya Raman',
    email: 'admin@greenvalley.edu',
    phone: '+91 98765 43120',
    password: 'Green@2025',
    status: 'Pending',
    requestedAt: '09 Jun 2026, 09:15 AM',
  },
  {
    id: 'REQ-240802',
    schoolName: 'North Star Matric School',
    board: 'State Board',
    city: 'Coimbatore',
    address: 'Peelamedu Main Road',
    adminName: 'Arun Karthik',
    email: 'admin@northstar.edu',
    phone: '+91 98400 11442',
    password: 'North@2025',
    status: 'Pending',
    requestedAt: '09 Jun 2026, 10:05 AM',
  },
];

const seedSchools: School[] = [
  {
    id: 'SCH-001',
    name: 'SafeReach Demo Academy',
    admin: 'Meera Iyer',
    email: 'admin@demo.safereach.edu',
    status: 'Active',
    staff: [
      { name: 'Elena Smith', role: 'Teacher', assigned: 'Class 4 - Section B Incharge', status: 'On Duty' },
      { name: 'David Ng', role: 'Teacher', assigned: 'Science Lab and Class 6 Support', status: 'On Duty' },
      { name: 'Rajan Kumar', role: 'Sub Admin', assigned: 'Incident Review Queue', status: 'Active' },
    ],
    classes: [
      {
        className: 'Class 4',
        sections: [
          {
            name: 'A',
            incharge: 'Rajan Kumar',
            students: [
              { id: 'ST-401', name: 'Aisha Begum', roll: '01', guardian: 'Fathima Begum', status: 'At School' },
              { id: 'ST-402', name: 'Aryan Shah', roll: '02', guardian: 'Kiran Shah', status: 'Medical Review' },
            ],
          },
          {
            name: 'B',
            incharge: 'Elena Smith',
            students: [
              { id: 'ST-421', name: 'Aarav Mehta', roll: '11', guardian: 'Neha Mehta', status: 'At School' },
              { id: 'ST-422', name: 'Priya Nair', roll: '12', guardian: 'Vikram Nair', status: 'In Class' },
            ],
          },
        ],
      },
      {
        className: 'Class 6',
        sections: [
          {
            name: 'A',
            incharge: 'David Ng',
            students: [
              { id: 'ST-601', name: 'Dev Sharma', roll: '04', guardian: 'Pooja Sharma', status: 'At School' },
              { id: 'ST-602', name: 'Rohan Verma', roll: '08', guardian: 'Sanjay Verma', status: 'Absent' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'SCH-002',
    name: 'Greenwood High School',
    admin: 'Anita Rao',
    email: 'admin@greenwood.edu',
    status: 'Active',
    staff: [
      { name: 'Sarah Jenkins', role: 'Teacher', assigned: 'Class 2 - Section A Incharge', status: 'On Duty' },
      { name: 'Marcus Lee', role: 'Teacher', assigned: 'Class 5 - Section C Incharge', status: 'Leave' },
    ],
    classes: [
      {
        className: 'Class 2',
        sections: [
          {
            name: 'A',
            incharge: 'Sarah Jenkins',
            students: [
              { id: 'GW-201', name: 'Liam Sanders', roll: '06', guardian: 'Sarah Sanders', status: 'At School' },
              { id: 'GW-202', name: 'Emma Wilson', roll: '09', guardian: 'David Wilson', status: 'On Route' },
            ],
          },
        ],
      },
    ],
  },
];

const initialPermissions = [
  { key: 'app.main.school.accept', role: 'Main Admin', module: 'School Requests', action: 'Accept school environment', enabled: true },
  { key: 'app.main.school.reject', role: 'Main Admin', module: 'School Requests', action: 'Reject school environment', enabled: true },
  { key: 'app.main.user.monitor', role: 'Main Admin', module: 'Users', action: 'Monitor all roles', enabled: true },
  { key: 'app.admin.student.add', role: 'School Admin', module: 'Students', action: 'Add students', enabled: true },
  { key: 'app.admin.student.edit', role: 'School Admin', module: 'Students', action: 'Edit students', enabled: true },
  { key: 'app.admin.student.delete', role: 'School Admin', module: 'Students', action: 'Delete students', enabled: false },
  { key: 'app.admin.class.assign', role: 'School Admin', module: 'Classes', action: 'Assign class incharge', enabled: true },
  { key: 'app.teacher.student.add', role: 'Teacher', module: 'Students', action: 'Add assigned class students', enabled: true },
  { key: 'app.teacher.student.edit', role: 'Teacher', module: 'Students', action: 'Edit assigned class students', enabled: true },
  { key: 'app.teacher.student.delete', role: 'Teacher', module: 'Students', action: 'Remove assigned class students', enabled: false },
];

function readRequests() {
  if (typeof window === 'undefined') return seedRequests;
  try {
    const stored = JSON.parse(window.localStorage.getItem(REQUEST_KEY) ?? '[]') as SchoolRequest[];
    const storedIds = new Set(stored.map(item => item.id));
    return [...stored, ...seedRequests.filter(item => !storedIds.has(item.id))];
  } catch {
    return seedRequests;
  }
}

export default function MainAdminDashboardPage() {
  const [requests, setRequests] = useState<SchoolRequest[]>(seedRequests);
  const [schools, setSchools] = useState<School[]>(seedSchools);
  const [selectedSchoolId, setSelectedSchoolId] = useState(seedSchools[0].id);
  const [selectedClassName, setSelectedClassName] = useState(seedSchools[0].classes[0].className);
  const [selectedSectionName, setSelectedSectionName] = useState(seedSchools[0].classes[0].sections[0].name);
  const [permissions, setPermissions] = useState(initialPermissions);
  const [smsLog, setSmsLog] = useState('No SMS action sent in this session.');
  const [industryAccess, setIndustryAccess] = useState<IndustryMenuAccess[]>(() => readIndustryMenuAccess(seedSchools));

  useEffect(() => {
    setRequests(readRequests());
  }, []);

  useEffect(() => {
    const refreshAccess = () => {
      setIndustryAccess(readIndustryMenuAccess(schools));
    };
    refreshAccess();
    fetchIndustryMenuAccess(schools).then(setIndustryAccess);
    window.addEventListener('storage', refreshAccess);
    window.addEventListener(INDUSTRY_ACCESS_EVENT, refreshAccess);
    return () => {
      window.removeEventListener('storage', refreshAccess);
      window.removeEventListener(INDUSTRY_ACCESS_EVENT, refreshAccess);
    };
  }, [schools]);

  const selectedSchool = schools.find(school => school.id === selectedSchoolId) ?? schools[0];
  const selectedClass = selectedSchool.classes.find(item => item.className === selectedClassName) ?? selectedSchool.classes[0];
  const selectedSection = selectedClass.sections.find(item => item.name === selectedSectionName) ?? selectedClass.sections[0];

  const totals = useMemo(() => {
    const totalStaff = schools.reduce((sum, school) => sum + school.staff.length, 0);
    const totalClasses = schools.reduce((sum, school) => sum + school.classes.length, 0);
    const totalStudents = schools.reduce((sum, school) => sum + school.classes.reduce((classSum, item) => classSum + item.sections.reduce((sectionSum, section) => sectionSum + section.students.length, 0), 0), 0);
    return { totalStaff, totalClasses, totalStudents };
  }, [schools]);

  async function updateRequest(requestId: string, status: RequestStatus) {
    const updated = requests.map(request => request.id === requestId ? { ...request, status } : request);
    setRequests(updated);
    window.localStorage.setItem(REQUEST_KEY, JSON.stringify(updated.filter(request => !seedRequests.some(seed => seed.id === request.id))));
    const request = requests.find(item => item.id === requestId);
    if (!request) return;

    try {
      fetch(`${apiBaseUrl}/super-admin/requests/${encodeURIComponent(requestId)}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: status === 'Accepted' ? 'approved' : 'rejected',
          reason: status === 'Accepted' ? 'Approved by Super Admin' : 'Declined by Super Admin',
        }),
      }).catch(() => undefined);
    } catch {
      // Keep optimistic UI
    }

    if (status === 'Accepted') {
      setSmsLog(`SMS to ${request.phone}: SafeReach school environment approved. Login email: ${request.email}. Password: ${request.password}. URL: /login/admin`);
      const newSchool: School = {
        id: `SCH-${request.id.slice(-3)}`,
        name: request.schoolName,
        admin: request.adminName,
        email: request.email,
        status: 'Active',
        staff: [{ name: request.adminName, role: 'School Admin', assigned: 'School environment setup', status: 'Active' }],
        classes: [{ className: 'Class 1', sections: [{ name: 'A', incharge: 'Not assigned', students: [] }] }],
      };
      setSchools(current => current.some(school => school.email === request.email) ? current : [newSchool, ...current]);
      setSelectedSchoolId(newSchool.id);
      setSelectedClassName(newSchool.classes[0].className);
      setSelectedSectionName(newSchool.classes[0].sections[0].name);
    } else {
      setSmsLog(`SMS to ${request.phone}: SafeReach school environment request ${request.id} was rejected. Please contact SafeReach support with corrected details.`);
    }
  }

  function removeStudent(studentId: string) {
    const student = selectedSection.students.find(item => item.id === studentId);
    if (!window.confirm(`Delete ${student?.name ?? 'this student'} from ${selectedSchool.name} ${selectedClass.className}-${selectedSection.name}?`)) return;
    setSchools(current => current.map(school => school.id !== selectedSchool.id ? school : {
      ...school,
      classes: school.classes.map(item => item.className !== selectedClass.className ? item : {
        ...item,
        sections: item.sections.map(section => section.name !== selectedSection.name ? section : {
          ...section,
          students: section.students.filter(s => s.id !== studentId),
        }),
      }),
    }));
  }

  function markStudentEdited(studentId: string) {
    setSchools(current => current.map(school => school.id !== selectedSchool.id ? school : {
      ...school,
      classes: school.classes.map(item => item.className !== selectedClass.className ? item : {
        ...item,
        sections: item.sections.map(section => section.name !== selectedSection.name ? section : {
          ...section,
          students: section.students.map(student => student.id === studentId ? { ...student, status: 'Edited by Main Admin' } : student),
        }),
      }),
    }));
  }

  function updateIndustryAccessRecord(schoolId: string, updater: (record: IndustryMenuAccess) => IndustryMenuAccess) {
    const current = industryAccess.length ? industryAccess : readIndustryMenuAccess(schools);
    const next = current.map(record => record.schoolId === schoolId ? updater(record) : record);
    setIndustryAccess(next);
    writeIndustryMenuAccess(next);
  }

  function toggleIndustryMenu(schoolId: string, menuKey: IndustryMenuKey, enabled: boolean) {
    let updatedRecord: IndustryMenuAccess | undefined;
    updateIndustryAccessRecord(schoolId, record => {
      const next = {
        ...record,
        menus: { ...record.menus, [menuKey]: enabled },
        lastUpdatedAt: new Date().toLocaleString(),
      };
      updatedRecord = next;
      return next;
    });
    const schoolName = updatedRecord?.schoolName ?? schools.find(school => school.id === schoolId)?.name ?? schoolId;
    saveIndustryMenuAccess({ schoolId, schoolName, menuKey, enabled });
    setSmsLog(`Menu access updated: ${schoolName} ${menuKey} is now ${enabled ? 'enabled' : 'disabled'} for industry users.`);
  }

  return (
    <MainAdminShell active="dashboard" title="Main Admin Control Center" subtitle="App owner monitoring for schools, users, roles, permissions, and approvals">
      <div className="p-container-padding-mobile md:p-container-padding-desktop space-y-stack-lg">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
          {[
            { label: 'Login Schools', value: String(schools.length), icon: 'domain', color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Total Staff', value: String(totals.totalStaff), icon: 'badge', color: 'text-secondary', bg: 'bg-secondary/10' },
            { label: 'Classes', value: String(totals.totalClasses), icon: 'school', color: 'text-green-700', bg: 'bg-green-100' },
            { label: 'Students', value: String(totals.totalStudents), icon: 'groups', color: 'text-error', bg: 'bg-error-container' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-outline-variant/50 p-stack-md shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${card.bg} ${card.color} flex items-center justify-center`}>
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant">{card.label}</p>
                <p className={`text-headline-md font-bold ${card.color}`}>{card.value}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
          <div className="xl:col-span-2 bg-white rounded-xl border border-outline-variant/50 shadow-sm overflow-hidden">
            <div className="p-stack-md border-b border-outline-variant/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">School Environment Requests</h2>
                <p className="text-label-md text-on-surface-variant">Accept or reject school-admin registration requests and preview the SMS sent to the requester.</p>
              </div>
              <span className="status-chip bg-secondary/10 text-secondary">{requests.filter(request => request.status === 'Pending').length} pending</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
                  <tr>{['Request', 'School', 'School Admin', 'Contact', 'Status', 'Action'].map(head => <th key={head} className="px-5 py-4 font-bold">{head}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {requests.map(request => (
                    <tr key={request.id} className="hover:bg-surface-container-low">
                      <td className="px-5 py-4 font-bold text-primary">{request.id}<p className="text-xs font-normal text-on-surface-variant">{request.requestedAt}</p></td>
                      <td className="px-5 py-4"><p className="font-bold">{request.schoolName}</p><p className="text-xs text-on-surface-variant">{request.board} - {request.city}</p></td>
                      <td className="px-5 py-4">{request.adminName}</td>
                      <td className="px-5 py-4"><p>{request.email}</p><p className="text-xs text-on-surface-variant">{request.phone}</p></td>
                      <td className="px-5 py-4"><span className={`status-chip ${request.status === 'Accepted' ? 'bg-green-100 text-green-700' : request.status === 'Rejected' ? 'bg-error-container text-error' : 'bg-blue-100 text-blue-700'}`}>{request.status}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => updateRequest(request.id, 'Accepted')} className="px-3 py-2 rounded-lg bg-green-100 text-green-700 font-bold hover:bg-green-200">Accept</button>
                          <button type="button" onClick={() => updateRequest(request.id, 'Rejected')} className="px-3 py-2 rounded-lg bg-error-container text-error font-bold hover:opacity-80">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-outline-variant/50 shadow-sm p-stack-md">
            <h2 className="font-headline-md text-headline-md text-primary mb-2">SMS Preview</h2>
            <p className="text-label-md text-on-surface-variant mb-4">Frontend-only SMS message generated by approval actions.</p>
            <div className="rounded-xl bg-surface-container-low border border-outline-variant p-4 text-body-md min-h-40">
              {smsLog}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-outline-variant/50 shadow-sm p-stack-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">Industry Menu Access Control</h2>
                <p className="text-label-md text-on-surface-variant">Main admin directly controls which menus display for every user inside each school industry.</p>
              </div>
              <span className="status-chip bg-primary/10 text-primary">Backend synced when available</span>
            </div>

            <div className="space-y-4">
              {industryAccess.map(record => (
                <article key={record.schoolId} className="rounded-xl border border-outline-variant p-4 bg-surface-container-low">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-primary text-title-md">{record.schoolName}</h3>
                      <p className="text-label-md text-on-surface-variant">Updated: {record.lastUpdatedAt}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {industryMenuItems.map(menu => (
                      <div key={menu.key} className="rounded-xl bg-white border border-outline-variant p-3">
                        <div>
                          <p className="font-bold text-on-surface">{menu.label}</p>
                          <p className="text-xs text-on-surface-variant">{menu.description}</p>
                        </div>
                        <div className="mt-4 inline-flex rounded-full bg-purple-600 p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => toggleIndustryMenu(record.schoolId, menu.key, true)}
                            className={`min-w-24 px-4 py-2 rounded-full text-label-md font-bold transition-all ${record.menus[menu.key] ? 'bg-white text-purple-700 shadow-sm' : 'text-white/80 hover:text-white'}`}
                            aria-pressed={record.menus[menu.key]}
                          >
                            Enable
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleIndustryMenu(record.schoolId, menu.key, false)}
                            className={`min-w-24 px-4 py-2 rounded-full text-label-md font-bold transition-all ${!record.menus[menu.key] ? 'bg-white text-purple-700 shadow-sm' : 'text-white/80 hover:text-white'}`}
                            aria-pressed={!record.menus[menu.key]}
                          >
                            Disable
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
          <div className="xl:col-span-2 bg-white rounded-xl border border-outline-variant/50 shadow-sm p-stack-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">Existing Login Schools</h2>
                <p className="text-label-md text-on-surface-variant">Select a school to inspect details, staff assignments, classes, sections, and students.</p>
              </div>
              <select
                value={selectedSchoolId}
                onChange={event => {
                  const school = schools.find(item => item.id === event.target.value) ?? schools[0];
                  setSelectedSchoolId(school.id);
                  setSelectedClassName(school.classes[0].className);
                  setSelectedSectionName(school.classes[0].sections[0].name);
                }}
                className="px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-primary"
              >
                {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              {schools.map(school => (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => {
                    setSelectedSchoolId(school.id);
                    setSelectedClassName(school.classes[0].className);
                    setSelectedSectionName(school.classes[0].sections[0].name);
                  }}
                  className={`text-left rounded-xl border p-4 transition-all ${selectedSchoolId === school.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-outline-variant hover:bg-surface-container'}`}
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-bold text-primary">{school.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{school.admin} - {school.email}</p>
                    </div>
                    <span className="status-chip bg-green-100 text-green-700">{school.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-surface-container-low p-2"><p className="text-xs text-on-surface-variant">Staff</p><p className="font-bold">{school.staff.length}</p></div>
                    <div className="rounded-lg bg-surface-container-low p-2"><p className="text-xs text-on-surface-variant">Classes</p><p className="font-bold">{school.classes.length}</p></div>
                    <div className="rounded-lg bg-surface-container-low p-2"><p className="text-xs text-on-surface-variant">Sections</p><p className="font-bold">{school.classes.reduce((sum, item) => sum + item.sections.length, 0)}</p></div>
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-outline-variant overflow-hidden">
              <div className="p-4 bg-surface-container-low">
                <p className="font-bold text-primary">{selectedSchool.name}</p>
                <p className="text-label-md text-on-surface-variant">School admin: {selectedSchool.admin} - {selectedSchool.email}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-white text-label-md text-on-surface-variant">
                    <tr>{['Staff', 'Role', 'Assigned Work', 'Status'].map(head => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {selectedSchool.staff.map(member => (
                      <tr key={`${member.name}-${member.assigned}`}>
                        <td className="px-4 py-3 font-bold">{member.name}</td>
                        <td className="px-4 py-3">{member.role}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{member.assigned}</td>
                        <td className="px-4 py-3"><span className="status-chip bg-green-100 text-green-700">{member.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-outline-variant/50 shadow-sm p-stack-md">
            <h2 className="font-headline-md text-headline-md text-primary mb-4">Role Permission APIs</h2>
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {permissions.map(permission => (
                <label key={permission.key} className="block rounded-xl border border-outline-variant p-3 hover:bg-surface-container-low">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-on-surface">{permission.action}</p>
                      <p className="text-xs text-on-surface-variant">{permission.role} - {permission.module}</p>
                      <p className="font-mono text-xs text-primary mt-1">{permission.key}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={permission.enabled}
                      onChange={() => setPermissions(current => current.map(item => item.key === permission.key ? { ...item, enabled: !item.enabled } : item))}
                      className="mt-1 h-5 w-5 text-primary rounded"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-outline-variant/50 shadow-sm p-stack-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary">Class, Section, and Student Control</h2>
              <p className="text-label-md text-on-surface-variant">Main admin can inspect and control students from any school, class, and section.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedSchool.classes.map(item => (
                <button key={item.className} type="button" onClick={() => { setSelectedClassName(item.className); setSelectedSectionName(item.sections[0].name); }} className={`px-4 py-3 rounded-lg border font-bold ${selectedClassName === item.className ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-primary border-outline-variant'}`}>
                  {item.className}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            {selectedClass.sections.map(section => (
              <button key={section.name} type="button" onClick={() => setSelectedSectionName(section.name)} className={`px-4 py-2 rounded-lg border ${selectedSectionName === section.name ? 'bg-secondary text-on-secondary border-secondary' : 'bg-surface-container-low text-secondary border-outline-variant'}`}>
                Section {section.name} - {section.incharge}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-outline-variant">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
                <tr>{['Roll', 'Student', 'Student ID', 'Guardian', 'Status', 'Main Admin Actions'].map(head => <th key={head} className="px-5 py-4 font-bold">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {selectedSection.students.map(student => (
                  <tr key={student.id} className="hover:bg-surface-container-low">
                    <td className="px-5 py-4 font-bold text-primary">{student.roll}</td>
                    <td className="px-5 py-4 font-bold">{student.name}</td>
                    <td className="px-5 py-4">{student.id}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{student.guardian}</td>
                    <td className="px-5 py-4"><span className="status-chip bg-primary/10 text-primary">{student.status}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => markStudentEdited(student.id)} className="px-3 py-2 rounded-lg bg-primary/10 text-primary font-bold">Edit</button>
                        <button type="button" onClick={() => removeStudent(student.id)} className="px-3 py-2 rounded-lg bg-error-container text-error font-bold">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {selectedSection.students.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-on-surface-variant">No students added in this section yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MainAdminShell>
  );
}
