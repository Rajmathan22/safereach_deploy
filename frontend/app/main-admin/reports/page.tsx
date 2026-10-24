'use client';

import { useMemo, useState } from 'react';
import MainAdminShell from '@/components/MainAdminShell';
import { useBackendBootstrap, type BackendSchool, type BackendStudent, type BackendTeacher, type BackendClass, type BackendAttendance, type BackendIncident, type BackendAuditLog } from '@/lib/backendData';
import { exportToCsv, exportToJson, printReport, type PrintSummaryItem } from '@/lib/reportExporter';

type ReportDomain = 'students' | 'schools' | 'classes' | 'teachers' | 'attendance' | 'incidents' | 'academic' | 'audit';

const DOMAIN_TABS: Array<{ id: ReportDomain; label: string; icon: string; description: string }> = [
  { id: 'students', label: 'Student Master List', icon: 'groups', description: 'Complete student directory with school, class, parent guardian, attendance, and travel states.' },
  { id: 'schools', label: 'School Directory', icon: 'domain', description: 'School environments, operating hours, contact details, total enrollment, and health metrics.' },
  { id: 'classes', label: 'Class & Section Roster', icon: 'school', description: 'Class rosters, sections, assigned incharge teachers, and student capacity.' },
  { id: 'teachers', label: 'Staff & Teachers', icon: 'badge', description: 'Teacher directory, employee codes, subjects, assigned classes, and active duty status.' },
  { id: 'attendance', label: 'Attendance & Travel Logs', icon: 'how_to_reg', description: 'Daily attendance logs, morning sessions, travel lifecycle milestones, and absence reasons.' },
  { id: 'incidents', label: 'Incident & Safety Reports', icon: 'emergency', description: 'Safety incident logs, severity levels, response priorities, handlers, and resolution status.' },
  { id: 'academic', label: 'Academic & Exam Results', icon: 'menu_book', description: 'Examination marks, subject components, maximum scores, and student performance metrics.' },
  { id: 'audit', label: 'System Audit Trail', icon: 'history', description: 'App-level security actions, role permissions, and API event history across all schools.' },
];

export default function MainAdminReportsPage() {
  const { data: bootstrapData, loading } = useBackendBootstrap();

  // Active Domain Tab
  const [activeDomain, setActiveDomain] = useState<ReportDomain>('students');

  // Filters State
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Table State
  const [sortField, setSortField] = useState<string>('');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Inspect Record Modal
  const [inspectModalRecord, setInspectModalRecord] = useState<Record<string, unknown> | null>(null);
  const [inspectModalTitle, setInspectModalTitle] = useState<string>('');

  // Toast / Notification
  const [notice, setNotice] = useState<string>('');
  function showToast(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 3000);
  }

  // Raw Data preparation with fallbacks
  const schoolsList: BackendSchool[] = useMemo(() => {
    if (bootstrapData.schools && bootstrapData.schools.length > 0) {
      return bootstrapData.schools;
    }
    return [
      { id: 'SCH-001', name: 'SafeReach Demo Academy', code: 'SR-DEMO', city: 'Chennai', phone: '+91 98765 43210', email: 'admin@demo.safereach.edu', status: 'active', school_open_time: '08:00:00', school_close_time: '16:30:00' },
      { id: 'SCH-002', name: 'Greenwood High School', code: 'GW-HIGH', city: 'Bangalore', phone: '+91 98400 11223', email: 'admin@greenwood.edu', status: 'active', school_open_time: '08:30:00', school_close_time: '15:45:00' },
      { id: 'SCH-003', name: 'Green Valley Public School', code: 'GV-PS', city: 'Chennai', phone: '+91 98765 43120', email: 'admin@greenvalley.edu', status: 'pending', school_open_time: '08:00:00', school_close_time: '16:00:00' },
    ];
  }, [bootstrapData.schools]);

  const studentsList: BackendStudent[] = useMemo(() => {
    if (bootstrapData.students && bootstrapData.students.length > 0) {
      return bootstrapData.students;
    }
    return [
      { id: 'ST-401', school_name: 'SafeReach Demo Academy', student_code: 'SR-ST-401', full_name: 'Aisha Begum', roll_no: '01', class_name: 'Class 4', section_name: 'A', guardian_name: 'Fathima Begum', parent_phone: '+91 98765 11111', parent_email: 'fathima@demo.com', sms_enabled: true, travel_status: 'reached_school', attendance_status: 'present', date_of_birth: '2015-04-12', emergency_notes: 'Asthma inhaler in bag' },
      { id: 'ST-402', school_name: 'SafeReach Demo Academy', student_code: 'SR-ST-402', full_name: 'Aryan Shah', roll_no: '02', class_name: 'Class 4', section_name: 'A', guardian_name: 'Kiran Shah', parent_phone: '+91 98765 22222', parent_email: 'kiran@demo.com', sms_enabled: true, travel_status: 'reached_school', attendance_status: 'present', date_of_birth: '2015-08-20', emergency_notes: 'Peanut allergy' },
      { id: 'ST-421', school_name: 'SafeReach Demo Academy', student_code: 'SR-ST-421', full_name: 'Aarav Mehta', roll_no: '11', class_name: 'Class 4', section_name: 'B', guardian_name: 'Neha Mehta', parent_phone: '+91 98765 33333', parent_email: 'neha@demo.com', sms_enabled: true, travel_status: 'reached_school', attendance_status: 'present', date_of_birth: '2015-01-15', emergency_notes: 'None' },
      { id: 'ST-422', school_name: 'SafeReach Demo Academy', student_code: 'SR-ST-422', full_name: 'Priya Nair', roll_no: '12', class_name: 'Class 4', section_name: 'B', guardian_name: 'Vikram Nair', parent_phone: '+91 98765 44444', parent_email: 'vikram@demo.com', sms_enabled: true, travel_status: 'reached_school', attendance_status: 'present', date_of_birth: '2015-11-05', emergency_notes: 'Wears glasses' },
      { id: 'ST-601', school_name: 'SafeReach Demo Academy', student_code: 'SR-ST-601', full_name: 'Dev Sharma', roll_no: '04', class_name: 'Class 6', section_name: 'A', guardian_name: 'Pooja Sharma', parent_phone: '+91 98765 55555', parent_email: 'pooja@demo.com', sms_enabled: false, travel_status: 'reached_school', attendance_status: 'present', date_of_birth: '2013-06-18', emergency_notes: 'None' },
      { id: 'ST-602', school_name: 'SafeReach Demo Academy', student_code: 'SR-ST-602', full_name: 'Rohan Verma', roll_no: '08', class_name: 'Class 6', section_name: 'A', guardian_name: 'Sanjay Verma', parent_phone: '+91 98765 66666', parent_email: 'sanjay@demo.com', sms_enabled: true, travel_status: 'at_home', attendance_status: 'absent', absence_reason: 'Viral Fever', date_of_birth: '2013-09-24', emergency_notes: 'None' },
      { id: 'GW-201', school_name: 'Greenwood High School', student_code: 'GW-ST-201', full_name: 'Liam Sanders', roll_no: '06', class_name: 'Class 2', section_name: 'A', guardian_name: 'Sarah Sanders', parent_phone: '+91 98400 77777', parent_email: 'sarah.s@greenwood.com', sms_enabled: true, travel_status: 'reached_school', attendance_status: 'present', date_of_birth: '2017-02-14', emergency_notes: 'Allergic to pollen' },
      { id: 'GW-202', school_name: 'Greenwood High School', student_code: 'GW-ST-202', full_name: 'Emma Wilson', roll_no: '09', class_name: 'Class 2', section_name: 'A', guardian_name: 'David Wilson', parent_phone: '+91 98400 88888', parent_email: 'david.w@greenwood.com', sms_enabled: true, travel_status: 'to_school', attendance_status: 'pending', date_of_birth: '2017-07-30', emergency_notes: 'None' },
    ];
  }, [bootstrapData.students]);

  const teachersList: BackendTeacher[] = useMemo(() => {
    if (bootstrapData.teachers && bootstrapData.teachers.length > 0) {
      return bootstrapData.teachers;
    }
    return [
      { id: 'T-001', school_name: 'SafeReach Demo Academy', full_name: 'Elena Smith', employee_code: 'EMP-101', email: 'elena.smith@safereach.demo', phone: '+91 98765 00101', subject: 'Mathematics', qualification: 'M.Sc., B.Ed', status: 'available', assignments: [{ className: 'Class 4', sectionName: 'B', assignmentType: 'primary_incharge', subject: 'Mathematics' }] },
      { id: 'T-002', school_name: 'SafeReach Demo Academy', full_name: 'David Ng', employee_code: 'EMP-102', email: 'david.ng@safereach.demo', phone: '+91 98765 00102', subject: 'Science', qualification: 'M.Sc. Physics', status: 'available', assignments: [{ className: 'Class 6', sectionName: 'A', assignmentType: 'primary_incharge', subject: 'Science' }] },
      { id: 'T-003', school_name: 'SafeReach Demo Academy', full_name: 'Rajan Kumar', employee_code: 'EMP-103', email: 'rajan.k@safereach.demo', phone: '+91 98765 00103', subject: 'Social Studies', qualification: 'M.A. History, B.Ed', status: 'available', assignments: [{ className: 'Class 4', sectionName: 'A', assignmentType: 'primary_incharge', subject: 'Social Studies' }] },
      { id: 'T-004', school_name: 'Greenwood High School', full_name: 'Sarah Jenkins', employee_code: 'EMP-201', email: 'sarah.j@greenwood.edu', phone: '+91 98400 00201', subject: 'English', qualification: 'M.A. English Literature', status: 'available', assignments: [{ className: 'Class 2', sectionName: 'A', assignmentType: 'primary_incharge', subject: 'English' }] },
      { id: 'T-005', school_name: 'Greenwood High School', full_name: 'Marcus Lee', employee_code: 'EMP-202', email: 'marcus.l@greenwood.edu', phone: '+91 98400 00202', subject: 'Physical Education', qualification: 'B.P.Ed', status: 'leave', assignments: [{ className: 'Class 5', sectionName: 'C', assignmentType: 'subject_teacher', subject: 'Physical Education' }] },
    ];
  }, [bootstrapData.teachers]);

  const classesList: BackendClass[] = useMemo(() => {
    if (bootstrapData.classes && bootstrapData.classes.length > 0) {
      return bootstrapData.classes;
    }
    return [
      { id: 'CLS-4', school_name: 'SafeReach Demo Academy', class_name: 'Class 4', sort_order: 4, sections: [{ id: 'SEC-4A', name: 'A', room: 'Room 201' }, { id: 'SEC-4B', name: 'B', room: 'Room 202' }] },
      { id: 'CLS-6', school_name: 'SafeReach Demo Academy', class_name: 'Class 6', sort_order: 6, sections: [{ id: 'SEC-6A', name: 'A', room: 'Room 301' }] },
      { id: 'CLS-2', school_name: 'Greenwood High School', class_name: 'Class 2', sort_order: 2, sections: [{ id: 'SEC-2A', name: 'A', room: 'Room 101' }] },
    ];
  }, [bootstrapData.classes]);

  const attendanceList: BackendAttendance[] = useMemo(() => {
    if (bootstrapData.attendance && bootstrapData.attendance.length > 0) {
      return bootstrapData.attendance;
    }
    const today = new Date().toISOString().split('T')[0];
    return [
      { id: 'ATT-01', school_name: 'SafeReach Demo Academy', student_id: 'ST-401', student_name: 'Aisha Begum', student_code: 'SR-ST-401', class_name: 'Class 4', section_name: 'A', attendance_date: today, session: 'morning', status: 'present', locked: false, created_at: `${today} 08:05:00` },
      { id: 'ATT-02', school_name: 'SafeReach Demo Academy', student_id: 'ST-402', student_name: 'Aryan Shah', student_code: 'SR-ST-402', class_name: 'Class 4', section_name: 'A', attendance_date: today, session: 'morning', status: 'present', locked: false, created_at: `${today} 08:08:00` },
      { id: 'ATT-03', school_name: 'SafeReach Demo Academy', student_id: 'ST-421', student_name: 'Aarav Mehta', student_code: 'SR-ST-421', class_name: 'Class 4', section_name: 'B', attendance_date: today, session: 'morning', status: 'present', locked: false, created_at: `${today} 08:12:00` },
      { id: 'ATT-04', school_name: 'SafeReach Demo Academy', student_id: 'ST-602', student_name: 'Rohan Verma', student_code: 'SR-ST-602', class_name: 'Class 6', section_name: 'A', attendance_date: today, session: 'morning', status: 'absent', reason: 'Viral Fever', locked: false, created_at: `${today} 08:30:00` },
      { id: 'ATT-05', school_name: 'Greenwood High School', student_id: 'GW-201', student_name: 'Liam Sanders', student_code: 'GW-ST-201', class_name: 'Class 2', section_name: 'A', attendance_date: today, session: 'morning', status: 'present', locked: false, created_at: `${today} 08:35:00` },
    ];
  }, [bootstrapData.attendance]);

  const incidentsList: BackendIncident[] = useMemo(() => {
    if (bootstrapData.incidents && bootstrapData.incidents.length > 0) {
      return bootstrapData.incidents;
    }
    return [
      { id: 'INC-001', school_name: 'SafeReach Demo Academy', incident_code: 'INC-2026-001', incident_type: 'Medical Alert', level: 'Level 2', priority: 'High', status: 'in_review', handler_name: 'School Nurse Clinic', student_name: 'Aryan Shah', class_name: 'Class 4', section_name: 'A', detail: 'Mild allergic itch after lunch, antihistamine administered, parents notified.', incident_time: '09 Jun 2026, 11:30 AM' },
      { id: 'INC-002', school_name: 'SafeReach Demo Academy', incident_code: 'INC-2026-002', incident_type: 'Late Bus Arrival', level: 'Level 1', priority: 'Medium', status: 'resolved', handler_name: 'Transport Coordinator', student_name: 'Dev Sharma', class_name: 'Class 6', section_name: 'A', detail: 'Route 12 delayed due to road resurfacing. Arrived at 8:25 AM safely.', incident_time: '08 Jun 2026, 08:25 AM' },
      { id: 'INC-003', school_name: 'Greenwood High School', incident_code: 'INC-2026-003', incident_type: 'Minor Fall in Playground', level: 'Level 1', priority: 'Low', status: 'resolved', handler_name: 'Marcus Lee', student_name: 'Emma Wilson', class_name: 'Class 2', section_name: 'A', detail: 'Scraped knee during recess. First aid bandage applied, resumed class.', incident_time: '07 Jun 2026, 01:15 PM' },
    ];
  }, [bootstrapData.incidents]);

  const academicMarksList = useMemo(() => {
    const exams = bootstrapData.academicResults?.exams || [];
    const components = bootstrapData.academicResults?.components || [];
    const marks = bootstrapData.academicResults?.marks || [];

    if (exams.length > 0 && components.length > 0) {
      const compMap = new Map(components.map(c => [c.id, c]));
      const examMap = new Map(exams.map(e => [e.id, e]));
      const studentMap = new Map(studentsList.map(s => [s.id, s]));

      return marks.map((m, idx) => {
        const comp = compMap.get(m.result_component_id);
        const exam = comp ? examMap.get(comp.exam_id) : undefined;
        const student = studentMap.get(m.student_id);
        const maxMarks = Number(comp?.maximum_marks) || 100;
        const scored = Number(m.marks_obtained) || 0;
        const pct = Math.round((scored / maxMarks) * 100);

        return {
          id: `MARK-${idx + 1}`,
          school_name: student?.school_name || 'SafeReach Demo Academy',
          exam_name: exam?.name || 'Term 1 Mid-Evaluation',
          class_name: student?.class_name || exam?.class_name || 'Class 4',
          section_name: student?.section_name || exam?.section_name || 'A',
          subject: comp?.subject || 'Mathematics',
          component: comp?.label || 'Theory Exam',
          max_marks: maxMarks,
          student_name: student?.full_name || 'Aisha Begum',
          student_code: student?.student_code || 'SR-ST-401',
          marks_obtained: scored,
          percentage: `${pct}%`,
          status: pct >= 40 ? 'Pass' : 'Needs Support',
        };
      });
    }

    // Default mock rows
    return [
      { id: 'MARK-01', school_name: 'SafeReach Demo Academy', exam_name: 'Term 1 Mid-Term', class_name: 'Class 4', section_name: 'A', subject: 'Mathematics', component: 'Theory Paper', max_marks: 100, student_name: 'Aisha Begum', student_code: 'SR-ST-401', marks_obtained: 94, percentage: '94%', status: 'Pass' },
      { id: 'MARK-02', school_name: 'SafeReach Demo Academy', exam_name: 'Term 1 Mid-Term', class_name: 'Class 4', section_name: 'A', subject: 'Mathematics', component: 'Theory Paper', max_marks: 100, student_name: 'Aryan Shah', student_code: 'SR-ST-402', marks_obtained: 88, percentage: '88%', status: 'Pass' },
      { id: 'MARK-03', school_name: 'SafeReach Demo Academy', exam_name: 'Term 1 Mid-Term', class_name: 'Class 4', section_name: 'B', subject: 'Science', component: 'Practical Lab', max_marks: 50, student_name: 'Aarav Mehta', student_code: 'SR-ST-421', marks_obtained: 46, percentage: '92%', status: 'Pass' },
      { id: 'MARK-04', school_name: 'Greenwood High School', exam_name: 'Quarterly Assessment', class_name: 'Class 2', section_name: 'A', subject: 'English', component: 'Reading & Phonics', max_marks: 50, student_name: 'Liam Sanders', student_code: 'GW-ST-201', marks_obtained: 47, percentage: '94%', status: 'Pass' },
    ];
  }, [bootstrapData.academicResults, studentsList]);

  const auditLogsList: BackendAuditLog[] = useMemo(() => {
    if (bootstrapData.auditLogs && bootstrapData.auditLogs.length > 0) {
      return bootstrapData.auditLogs;
    }
    return [
      { id: 'AUD-001', action: 'app.main.school.accept', entity_type: 'school_registration', entity_id: 'REQ-240801', actor_name: 'Main Administrator', actor_role: 'Super Admin', school_name: 'Green Valley Public School', created_at: '09 Jun 2026, 10:40 AM', payload: { school: 'Green Valley Public School', decision: 'approved' } },
      { id: 'AUD-002', action: 'app.admin.class.assign', entity_type: 'class_section', entity_id: 'SEC-4B', actor_name: 'Meera Iyer', actor_role: 'School Admin', school_name: 'SafeReach Demo Academy', created_at: '09 Jun 2026, 10:18 AM', payload: { teacher: 'Elena Smith', class: 'Class 4', section: 'B' } },
      { id: 'AUD-003', action: 'app.teacher.student.travel', entity_type: 'student_travel', entity_id: 'ST-401', actor_name: 'Elena Smith', actor_role: 'Teacher', school_name: 'SafeReach Demo Academy', created_at: '09 Jun 2026, 09:55 AM', payload: { status: 'reached_school', time: '08:05:00' } },
      { id: 'AUD-004', action: 'app.main.industry_menu.toggle', entity_type: 'industry_menu', entity_id: 'SCH-001', actor_name: 'Main Administrator', actor_role: 'Super Admin', school_name: 'SafeReach Demo Academy', created_at: '09 Jun 2026, 09:30 AM', payload: { menu: 'industry_timetable', enabled: true } },
    ];
  }, [bootstrapData.auditLogs]);

  // Derived Dynamic Filter Options
  const availableClasses = useMemo(() => {
    const list = new Set<string>();
    classesList.forEach(c => {
      if (selectedSchool === 'all' || c.school_name === selectedSchool) {
        list.add(c.class_name);
      }
    });
    studentsList.forEach(s => {
      if (selectedSchool === 'all' || s.school_name === selectedSchool) {
        if (s.class_name) list.add(s.class_name);
      }
    });
    return Array.from(list).sort();
  }, [classesList, studentsList, selectedSchool]);

  const availableSections = useMemo(() => {
    const list = new Set<string>();
    classesList.forEach(c => {
      if ((selectedSchool === 'all' || c.school_name === selectedSchool) &&
          (selectedClass === 'all' || c.class_name === selectedClass)) {
        c.sections?.forEach(sec => list.add(sec.name));
      }
    });
    studentsList.forEach(s => {
      if ((selectedSchool === 'all' || s.school_name === selectedSchool) &&
          (selectedClass === 'all' || s.class_name === selectedClass)) {
        if (s.section_name) list.add(s.section_name);
      }
    });
    return Array.from(list).sort();
  }, [classesList, studentsList, selectedSchool, selectedClass]);

  // Status options per domain
  const availableStatuses = useMemo(() => {
    switch (activeDomain) {
      case 'students':
        return ['all', 'present', 'absent', 'pending', 'at_home', 'to_school', 'reached_school', 'reached_home'];
      case 'schools':
        return ['all', 'active', 'pending', 'suspended'];
      case 'teachers':
        return ['all', 'available', 'leave', 'busy'];
      case 'attendance':
        return ['all', 'present', 'absent', 'late', 'excused', 'pending'];
      case 'incidents':
        return ['all', 'pending', 'in_review', 'resolved', 'critical'];
      case 'academic':
        return ['all', 'Pass', 'Needs Support'];
      default:
        return ['all'];
    }
  }, [activeDomain]);

  // Filtered Datasets
  const filteredStudents = useMemo(() => {
    return studentsList.filter(item => {
      if (selectedSchool !== 'all' && item.school_name !== selectedSchool) return false;
      if (selectedClass !== 'all' && item.class_name !== selectedClass) return false;
      if (selectedSection !== 'all' && item.section_name !== selectedSection) return false;
      if (selectedStatus !== 'all') {
        const matchesAtt = item.attendance_status?.toLowerCase() === selectedStatus.toLowerCase();
        const matchesTravel = item.travel_status?.toLowerCase() === selectedStatus.toLowerCase();
        if (!matchesAtt && !matchesTravel) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = `${item.full_name} ${item.student_code} ${item.roll_no} ${item.guardian_name} ${item.parent_phone} ${item.parent_email} ${item.school_name} ${item.class_name} ${item.section_name}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [studentsList, selectedSchool, selectedClass, selectedSection, selectedStatus, searchQuery]);

  const filteredSchools = useMemo(() => {
    return schoolsList.filter(item => {
      if (selectedSchool !== 'all' && item.name !== selectedSchool) return false;
      if (selectedStatus !== 'all' && item.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = `${item.name} ${item.code} ${item.city} ${item.phone} ${item.email} ${item.status}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [schoolsList, selectedSchool, selectedStatus, searchQuery]);

  const filteredClasses = useMemo(() => {
    const list: Array<{ id: string; school_name: string; class_name: string; section_name: string; room: string; incharge: string; student_count: number }> = [];
    classesList.forEach(cls => {
      const sName = cls.school_name || 'SafeReach Demo Academy';
      cls.sections.forEach(sec => {
        const teacher = teachersList.find(t =>
          (t.school_name === sName || !t.school_name) &&
          t.assignments?.some(a => a.className === cls.class_name && a.sectionName === sec.name)
        );
        const studentCount = studentsList.filter(s =>
          (s.school_name === sName) && s.class_name === cls.class_name && s.section_name === sec.name
        ).length;

        list.push({
          id: `${cls.id}-${sec.id || sec.name}`,
          school_name: sName,
          class_name: cls.class_name,
          section_name: sec.name,
          room: sec.room || 'Main Block',
          incharge: teacher?.full_name || 'Not assigned',
          student_count: studentCount,
        });
      });
    });

    return list.filter(item => {
      if (selectedSchool !== 'all' && item.school_name !== selectedSchool) return false;
      if (selectedClass !== 'all' && item.class_name !== selectedClass) return false;
      if (selectedSection !== 'all' && item.section_name !== selectedSection) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = `${item.school_name} ${item.class_name} ${item.section_name} ${item.incharge} ${item.room}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [classesList, teachersList, studentsList, selectedSchool, selectedClass, selectedSection, searchQuery]);

  const filteredTeachers = useMemo(() => {
    return teachersList.filter(item => {
      if (selectedSchool !== 'all' && item.school_name !== selectedSchool) return false;
      if (selectedStatus !== 'all' && item.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (selectedClass !== 'all') {
        const hasClass = item.assignments?.some(a => a.className === selectedClass);
        if (!hasClass) return false;
      }
      if (selectedSection !== 'all') {
        const hasSec = item.assignments?.some(a => a.sectionName === selectedSection);
        if (!hasSec) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = `${item.full_name} ${item.employee_code} ${item.subject} ${item.email} ${item.phone} ${item.qualification} ${item.school_name}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [teachersList, selectedSchool, selectedStatus, selectedClass, selectedSection, searchQuery]);

  const filteredAttendance = useMemo(() => {
    return attendanceList.filter(item => {
      if (selectedSchool !== 'all' && item.school_name !== selectedSchool) return false;
      if (selectedClass !== 'all' && item.class_name !== selectedClass) return false;
      if (selectedSection !== 'all' && item.section_name !== selectedSection) return false;
      if (selectedStatus !== 'all' && item.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = `${item.student_name} ${item.student_code} ${item.school_name} ${item.class_name} ${item.section_name} ${item.status} ${item.reason}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [attendanceList, selectedSchool, selectedClass, selectedSection, selectedStatus, searchQuery]);

  const filteredIncidents = useMemo(() => {
    return incidentsList.filter(item => {
      if (selectedSchool !== 'all' && item.school_name !== selectedSchool) return false;
      if (selectedClass !== 'all' && item.class_name !== selectedClass) return false;
      if (selectedSection !== 'all' && item.section_name !== selectedSection) return false;
      if (selectedStatus !== 'all' && item.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = `${item.incident_code} ${item.incident_type} ${item.student_name} ${item.handler_name} ${item.level} ${item.priority} ${item.status} ${item.detail}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [incidentsList, selectedSchool, selectedClass, selectedSection, selectedStatus, searchQuery]);

  const filteredAcademic = useMemo(() => {
    return academicMarksList.filter(item => {
      if (selectedSchool !== 'all' && item.school_name !== selectedSchool) return false;
      if (selectedClass !== 'all' && item.class_name !== selectedClass) return false;
      if (selectedSection !== 'all' && item.section_name !== selectedSection) return false;
      if (selectedStatus !== 'all' && item.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = `${item.student_name} ${item.student_code} ${item.exam_name} ${item.subject} ${item.component} ${item.school_name}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [academicMarksList, selectedSchool, selectedClass, selectedSection, selectedStatus, searchQuery]);

  const filteredAudit = useMemo(() => {
    return auditLogsList.filter(item => {
      if (selectedSchool !== 'all' && item.school_name !== selectedSchool) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = `${item.action} ${item.actor_name} ${item.actor_role} ${item.school_name} ${item.entity_type} ${item.entity_id}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [auditLogsList, selectedSchool, searchQuery]);

  // Active domain current rows & columns
  const activeDataset = useMemo(() => {
    switch (activeDomain) {
      case 'students':
        return {
          totalCount: studentsList.length,
          filteredRows: filteredStudents,
          idField: 'id',
        };
      case 'schools':
        return {
          totalCount: schoolsList.length,
          filteredRows: filteredSchools,
          idField: 'id',
        };
      case 'classes':
        return {
          totalCount: filteredClasses.length,
          filteredRows: filteredClasses,
          idField: 'id',
        };
      case 'teachers':
        return {
          totalCount: teachersList.length,
          filteredRows: filteredTeachers,
          idField: 'id',
        };
      case 'attendance':
        return {
          totalCount: attendanceList.length,
          filteredRows: filteredAttendance,
          idField: 'id',
        };
      case 'incidents':
        return {
          totalCount: incidentsList.length,
          filteredRows: filteredIncidents,
          idField: 'id',
        };
      case 'academic':
        return {
          totalCount: academicMarksList.length,
          filteredRows: filteredAcademic,
          idField: 'id',
        };
      case 'audit':
        return {
          totalCount: auditLogsList.length,
          filteredRows: filteredAudit,
          idField: 'id',
        };
    }
  }, [activeDomain, studentsList, schoolsList, filteredClasses, teachersList, attendanceList, incidentsList, academicMarksList, auditLogsList, filteredStudents, filteredSchools, filteredTeachers, filteredAttendance, filteredIncidents, filteredAcademic, filteredAudit]);

  // Sorting
  const sortedRows = useMemo(() => {
    const rows = [...activeDataset.filteredRows];
    if (!sortField) return rows;

    return rows.sort((a: Record<string, any>, b: Record<string, any>) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [activeDataset.filteredRows, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // Handle Sort Click
  function handleSort(field: string) {
    if (sortField === field) {
      setSortAsc(current => !current);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  // Row Selection
  const allCurrentSelected = paginatedRows.length > 0 && paginatedRows.every(r => selectedRowIds.has((r as any).id));
  function toggleSelectAllCurrent() {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (allCurrentSelected) {
        paginatedRows.forEach(r => next.delete((r as any).id));
      } else {
        paginatedRows.forEach(r => next.add((r as any).id));
      }
      return next;
    });
  }

  function toggleSelectRow(id: string) {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Clear filters
  function resetFilters() {
    setSelectedSchool('all');
    setSelectedClass('all');
    setSelectedSection('all');
    setSelectedStatus('all');
    setTimeframe('all');
    setSearchQuery('');
    setCurrentPage(1);
    setSelectedRowIds(new Set());
  }

  // Export Handlers
  function getExportMetadata(domain: ReportDomain, rowsToExport: Array<Record<string, any>>) {
    switch (domain) {
      case 'students':
        return {
          title: 'SafeReach Student Master Directory',
          subtitle: 'School-wise, class-wise student enrollment, parent contacts & travel statuses',
          filename: `safereach-students-report-${Date.now()}`,
          headers: ['Student Code', 'Full Name', 'Roll No', 'School', 'Class', 'Section', 'Guardian Name', 'Parent Phone', 'Parent Email', 'SMS Alert', 'Travel Status', 'Attendance', 'DOB', 'Medical Notes'],
          rows: rowsToExport.map(s => [
            s.student_code, s.full_name, s.roll_no, s.school_name, s.class_name, s.section_name,
            s.guardian_name, s.parent_phone, s.parent_email || '-', s.sms_enabled ? 'Enabled' : 'Disabled',
            s.travel_status, s.attendance_status, s.date_of_birth || '-', s.emergency_notes || '-'
          ]),
        };
      case 'schools':
        return {
          title: 'SafeReach School Directory & Health Report',
          subtitle: 'Comprehensive registered schools directory and operating parameters',
          filename: `safereach-schools-report-${Date.now()}`,
          headers: ['School Name', 'Code', 'City', 'Phone', 'Email', 'Status', 'Open Time', 'Close Time', 'Total Students', 'Total Staff'],
          rows: rowsToExport.map(sc => {
            const stuCount = studentsList.filter(s => s.school_name === sc.name).length;
            const staffCount = teachersList.filter(t => t.school_name === sc.name).length;
            return [sc.name, sc.code, sc.city || '-', sc.phone || '-', sc.email || '-', sc.status, sc.school_open_time || '08:00', sc.school_close_time || '16:30', stuCount, staffCount];
          }),
        };
      case 'classes':
        return {
          title: 'SafeReach Class & Section Roster',
          subtitle: 'Class divisions, room assignments, incharge teachers and student capacity',
          filename: `safereach-class-roster-${Date.now()}`,
          headers: ['School Name', 'Class Name', 'Section', 'Room', 'Incharge Teacher', 'Enrolled Students'],
          rows: rowsToExport.map(c => [c.school_name, c.class_name, c.section_name, c.room, c.incharge, c.student_count]),
        };
      case 'teachers':
        return {
          title: 'SafeReach Staff & Teacher Directory',
          subtitle: 'Teaching faculty, employee codes, subjects, assigned classes and duty status',
          filename: `safereach-teachers-report-${Date.now()}`,
          headers: ['Employee Code', 'Teacher Name', 'School', 'Subject', 'Qualification', 'Status', 'Email', 'Phone', 'Assigned Classes'],
          rows: rowsToExport.map(t => [
            t.employee_code, t.full_name, t.school_name || '-', t.subject, t.qualification || '-', t.status,
            t.email, t.phone, (t.assignments || []).map((a: any) => `${a.className}-${a.sectionName} (${a.assignmentType})`).join('; ') || 'None'
          ]),
        };
      case 'attendance':
        return {
          title: 'SafeReach Attendance & Travel Activity Logs',
          subtitle: 'Session-wise attendance, arrival milestones, and absence explanations',
          filename: `safereach-attendance-logs-${Date.now()}`,
          headers: ['Date', 'Student Name', 'Student Code', 'School', 'Class', 'Section', 'Session', 'Attendance Status', 'Absence Reason', 'Timestamp'],
          rows: rowsToExport.map(a => [a.attendance_date, a.student_name, a.student_code || '-', a.school_name || '-', a.class_name || '-', a.section_name || '-', a.session, a.status, a.reason || '-', a.created_at || '-']),
        };
      case 'incidents':
        return {
          title: 'SafeReach Safety & Incident Audit',
          subtitle: 'School safety incident logs, response priorities, and assigned handlers',
          filename: `safereach-incidents-report-${Date.now()}`,
          headers: ['Incident Code', 'School', 'Incident Type', 'Level', 'Priority', 'Status', 'Handler', 'Student Name', 'Class/Sec', 'Time', 'Details'],
          rows: rowsToExport.map(inc => [inc.incident_code, inc.school_name || '-', inc.incident_type, inc.level, inc.priority, inc.status, inc.handler_name, inc.student_name || '-', `${inc.class_name || ''} ${inc.section_name || ''}`.trim() || '-', inc.incident_time || '-', inc.detail]),
        };
      case 'academic':
        return {
          title: 'SafeReach Academic & Examination Performance Report',
          subtitle: 'Exam evaluations, component maximums, and student marks',
          filename: `safereach-academic-marks-${Date.now()}`,
          headers: ['School', 'Exam Name', 'Class', 'Section', 'Subject', 'Component', 'Student Name', 'Student Code', 'Max Marks', 'Marks Obtained', 'Percentage', 'Result'],
          rows: rowsToExport.map(ac => [ac.school_name, ac.exam_name, ac.class_name, ac.section_name, ac.subject, ac.component, ac.student_name, ac.student_code, ac.max_marks, ac.marks_obtained, ac.percentage, ac.status]),
        };
      case 'audit':
        return {
          title: 'SafeReach Super Admin Platform Audit Trail',
          subtitle: 'System events, API actions, and security operations',
          filename: `safereach-audit-trail-${Date.now()}`,
          headers: ['Timestamp', 'School', 'Actor Name', 'Actor Role', 'Action API', 'Entity Type', 'Entity ID', 'Payload Summary'],
          rows: rowsToExport.map(au => [au.created_at, au.school_name, au.actor_name, au.actor_role, au.action, au.entity_type, au.entity_id, typeof au.payload === 'object' ? JSON.stringify(au.payload) : String(au.payload || '-')]),
        };
    }
  }

  function handleExportCsv(all: boolean) {
    let targetRows: Array<Record<string, any>> = [];
    if (all) {
      switch (activeDomain) {
        case 'students': targetRows = studentsList; break;
        case 'schools': targetRows = schoolsList; break;
        case 'classes': targetRows = filteredClasses; break;
        case 'teachers': targetRows = teachersList; break;
        case 'attendance': targetRows = attendanceList; break;
        case 'incidents': targetRows = incidentsList; break;
        case 'academic': targetRows = academicMarksList; break;
        case 'audit': targetRows = auditLogsList; break;
      }
    } else {
      if (selectedRowIds.size > 0) {
        targetRows = sortedRows.filter(r => selectedRowIds.has((r as any).id));
      } else {
        targetRows = sortedRows;
      }
    }

    const { filename, headers, rows } = getExportMetadata(activeDomain, targetRows);
    exportToCsv(filename, headers, rows);
    showToast(`Exported ${targetRows.length} records to CSV successfully.`);
  }

  function handleExportJson() {
    let targetRows: Array<Record<string, any>> = [];
    if (selectedRowIds.size > 0) {
      targetRows = sortedRows.filter(r => selectedRowIds.has((r as any).id));
    } else {
      targetRows = sortedRows;
    }

    const filename = `safereach-${activeDomain}-${Date.now()}`;
    exportToJson(filename, {
      exportedAt: new Date().toISOString(),
      domain: activeDomain,
      filters: { school: selectedSchool, class: selectedClass, section: selectedSection, status: selectedStatus, search: searchQuery },
      count: targetRows.length,
      data: targetRows,
    });
    showToast(`Exported ${targetRows.length} records to JSON.`);
  }

  function handlePrintPdf() {
    let targetRows: Array<Record<string, any>> = [];
    if (selectedRowIds.size > 0) {
      targetRows = sortedRows.filter(r => selectedRowIds.has((r as any).id));
    } else {
      targetRows = sortedRows;
    }

    const { title, subtitle, headers, rows } = getExportMetadata(activeDomain, targetRows);
    const metaSummary: PrintSummaryItem[] = [
      { label: 'Active Domain', value: DOMAIN_TABS.find(t => t.id === activeDomain)?.label || activeDomain },
      { label: 'School Filter', value: selectedSchool === 'all' ? 'All Registered Schools' : selectedSchool },
      { label: 'Total Enrolled Students', value: studentsList.length },
      { label: 'Exported Records', value: targetRows.length },
    ];

    printReport(title, subtitle, headers, rows, metaSummary);
  }

  // Summary KPI calculation
  const summaryKpis = useMemo(() => {
    const totalSchoolsCount = schoolsList.length;
    const totalStudentsCount = studentsList.length;
    const totalTeachersCount = teachersList.length;
    const presentStudentsCount = studentsList.filter(s => s.attendance_status === 'present').length;
    const attPercent = totalStudentsCount > 0 ? Math.round((presentStudentsCount / totalStudentsCount) * 100) : 0;
    const openIncidentsCount = incidentsList.filter(i => i.status !== 'resolved').length;

    return [
      { label: 'Schools Monitored', value: String(totalSchoolsCount), sub: 'Across all regions', icon: 'domain', color: 'text-primary', bg: 'bg-primary/10' },
      { label: 'Total Enrolled', value: String(totalStudentsCount), sub: `${presentStudentsCount} Present today`, icon: 'groups', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Faculty & Teachers', value: String(totalTeachersCount), sub: `${teachersList.filter(t => t.status === 'available').length} On duty`, icon: 'badge', color: 'text-secondary', bg: 'bg-secondary/10' },
      { label: 'Overall Attendance', value: `${attPercent}%`, sub: `${totalStudentsCount - presentStudentsCount} Absent / On Leave`, icon: 'how_to_reg', color: 'text-green-700', bg: 'bg-green-100' },
      { label: 'Active Safety Alerts', value: String(openIncidentsCount), sub: `${incidentsList.length} Total incidents`, icon: 'emergency', color: 'text-error', bg: 'bg-error-container' },
    ];
  }, [schoolsList, studentsList, teachersList, incidentsList]);

  return (
    <MainAdminShell active="reports" title="Super Admin Reports & Data Export Center" subtitle="Comprehensive platform-wide reporting, live directories, audits & multi-format data export">
      <div className="p-container-padding-mobile md:p-container-padding-desktop space-y-stack-lg">
        
        {/* Top Header & Fast Export Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-outline-variant/60 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">monitoring</span>
              <h1 className="font-headline-md text-headline-md text-primary font-extrabold">Enterprise Reports & Data Hub</h1>
            </div>
            <p className="text-body-md text-on-surface-variant mt-1">
              View, query, and export real-time operational data across all school environments, classrooms, staff rosters, and audit trails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleExportCsv(false)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:opacity-95 transition-all shadow-sm active:scale-95 text-label-md"
              title="Download currently filtered table data as CSV"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Filtered CSV {selectedRowIds.size > 0 ? `(${selectedRowIds.size})` : ''}
            </button>

            <button
              type="button"
              onClick={() => handleExportCsv(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded-xl font-bold hover:opacity-95 transition-all shadow-sm active:scale-95 text-label-md"
              title="Download entire dataset for this category"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_download</span>
              Export All CSV
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl font-bold hover:bg-surface-container-high transition-all text-label-md"
              title="Export structured JSON"
            >
              <span className="material-symbols-outlined text-[18px]">data_object</span>
              JSON
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl font-bold hover:bg-surface-container-high transition-all text-label-md"
              title="Print or Save as PDF"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print / PDF
            </button>
          </div>
        </div>

        {/* Toast Notice */}
        {notice && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl font-label-md flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-700">check_circle</span>
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice('')} className="text-green-700 hover:text-green-900">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* High-Level Overview KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {summaryKpis.map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-outline-variant/50 p-4 shadow-sm flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-label-sm text-on-surface-variant font-medium truncate">{card.label}</p>
                <p className={`text-headline-sm font-extrabold ${card.color}`}>{card.value}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{card.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Category Domain Tabs */}
        <section className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm p-4">
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-outline-variant/40">
            <div>
              <h2 className="font-title-md font-bold text-primary">Report Data Domain</h2>
              <p className="text-label-sm text-on-surface-variant">Select the data category you want to view, filter, or export:</p>
            </div>
            <span className="text-label-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
              {DOMAIN_TABS.find(t => t.id === activeDomain)?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {DOMAIN_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveDomain(tab.id);
                  setCurrentPage(1);
                  setSelectedRowIds(new Set());
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center group ${
                  activeDomain === tab.id
                    ? 'bg-primary text-on-primary border-primary shadow-md font-bold'
                    : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className={`material-symbols-outlined text-[24px] mb-1.5 ${activeDomain === tab.id ? 'text-on-primary' : 'text-primary'}`}>
                  {tab.icon}
                </span>
                <span className="text-label-xs font-semibold leading-tight line-clamp-2">{tab.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Dynamic Filter Toolbar */}
        <section className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-outline-variant/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">filter_alt</span>
              <h3 className="font-title-md font-bold text-primary">Query & Filter Suite</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="text-label-sm text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Reset All Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* School Filter */}
            <div>
              <label className="block text-label-xs text-on-surface-variant font-bold mb-1">School</label>
              <select
                value={selectedSchool}
                onChange={e => {
                  setSelectedSchool(e.target.value);
                  setSelectedClass('all');
                  setSelectedSection('all');
                  setCurrentPage(1);
                }}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-label-md focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Schools ({schoolsList.length})</option>
                {schoolsList.map(sc => (
                  <option key={sc.id} value={sc.name}>{sc.name}</option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-label-xs text-on-surface-variant font-bold mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={e => {
                  setSelectedClass(e.target.value);
                  setSelectedSection('all');
                  setCurrentPage(1);
                }}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-label-md focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Classes ({availableClasses.length})</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <label className="block text-label-xs text-on-surface-variant font-bold mb-1">Section</label>
              <select
                value={selectedSection}
                onChange={e => {
                  setSelectedSection(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-label-md focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Sections ({availableSections.length})</option>
                {availableSections.map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-label-xs text-on-surface-variant font-bold mb-1">Status / State</label>
              <select
                value={selectedStatus}
                onChange={e => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-label-md focus:ring-2 focus:ring-primary focus:outline-none capitalize"
              >
                {availableStatuses.map(st => (
                  <option key={st} value={st}>
                    {st === 'all' ? 'All Statuses' : st.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Timeframe Filter */}
            <div>
              <label className="block text-label-xs text-on-surface-variant font-bold mb-1">Date Timeframe</label>
              <select
                value={timeframe}
                onChange={e => {
                  setTimeframe(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-label-md focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Records</option>
                <option value="today">Today Only</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            {/* Live Search Input */}
            <div>
              <label className="block text-label-xs text-on-surface-variant font-bold mb-1">Search Anything</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name, code, phone, role..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-9 pr-3 py-2 text-label-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-on-surface-variant">search</span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Data Table Section */}
        <section className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          
          {/* Table Toolbar Header */}
          <div className="p-4 md:p-5 border-b border-outline-variant/40 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-container-low/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm font-bold text-primary">
                  {DOMAIN_TABS.find(t => t.id === activeDomain)?.label}
                </h3>
                <span className="text-label-xs bg-primary text-on-primary px-2.5 py-0.5 rounded-full font-bold">
                  {sortedRows.length} {sortedRows.length === 1 ? 'Record' : 'Records'}
                </span>
                {selectedRowIds.size > 0 && (
                  <span className="text-label-xs bg-secondary text-on-secondary px-2.5 py-0.5 rounded-full font-bold">
                    {selectedRowIds.size} Selected
                  </span>
                )}
              </div>
              <p className="text-label-sm text-on-surface-variant mt-0.5">
                {DOMAIN_TABS.find(t => t.id === activeDomain)?.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                <span>Page Size:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-outline-variant rounded-lg px-2 py-1 text-label-sm font-semibold focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Render Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-[32px] text-primary mb-2">progress_activity</span>
                <p className="font-bold">Loading Super Admin platform data...</p>
              </div>
            ) : sortedRows.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] text-outline-variant mb-2">find_in_page</span>
                <p className="font-bold text-headline-sm text-on-surface">No records match the active criteria</p>
                <p className="text-body-md text-on-surface-variant mt-1">Try resetting filters or adjusting search keywords.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-label-sm hover:opacity-90"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-surface-container-low text-on-surface-variant text-label-sm border-b border-outline-variant/60 select-none">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={allCurrentSelected}
                        onChange={toggleSelectAllCurrent}
                        className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        title="Select all rows on current page"
                      />
                    </th>

                    {/* Domain Specific Columns */}
                    {activeDomain === 'students' && (
                      <>
                        <th onClick={() => handleSort('student_code')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">
                          Code {sortField === 'student_code' && (sortAsc ? '▲' : '▼')}
                        </th>
                        <th onClick={() => handleSort('full_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">
                          Student Name {sortField === 'full_name' && (sortAsc ? '▲' : '▼')}
                        </th>
                        <th onClick={() => handleSort('roll_no')} className="px-3 py-3.5 font-bold cursor-pointer hover:text-primary">Roll</th>
                        <th onClick={() => handleSort('school_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">School</th>
                        <th onClick={() => handleSort('class_name')} className="px-3 py-3.5 font-bold cursor-pointer hover:text-primary">Class</th>
                        <th onClick={() => handleSort('section_name')} className="px-3 py-3.5 font-bold cursor-pointer hover:text-primary">Sec</th>
                        <th className="px-4 py-3.5 font-bold">Guardian & Phone</th>
                        <th className="px-3 py-3.5 font-bold text-center">SMS</th>
                        <th className="px-3 py-3.5 font-bold">Travel State</th>
                        <th className="px-3 py-3.5 font-bold">Attendance</th>
                        <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                      </>
                    )}

                    {activeDomain === 'schools' && (
                      <>
                        <th onClick={() => handleSort('name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">School Name</th>
                        <th onClick={() => handleSort('code')} className="px-3 py-3.5 font-bold cursor-pointer hover:text-primary">Code</th>
                        <th onClick={() => handleSort('city')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">City</th>
                        <th className="px-4 py-3.5 font-bold">Contact Email / Phone</th>
                        <th className="px-3 py-3.5 font-bold">Hours</th>
                        <th className="px-3 py-3.5 font-bold">Status</th>
                        <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                      </>
                    )}

                    {activeDomain === 'classes' && (
                      <>
                        <th onClick={() => handleSort('school_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">School</th>
                        <th onClick={() => handleSort('class_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">Class</th>
                        <th onClick={() => handleSort('section_name')} className="px-3 py-3.5 font-bold cursor-pointer hover:text-primary">Section</th>
                        <th className="px-4 py-3.5 font-bold">Room</th>
                        <th className="px-4 py-3.5 font-bold">Incharge Teacher</th>
                        <th className="px-4 py-3.5 font-bold text-center">Enrolled</th>
                        <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                      </>
                    )}

                    {activeDomain === 'teachers' && (
                      <>
                        <th onClick={() => handleSort('employee_code')} className="px-3 py-3.5 font-bold cursor-pointer hover:text-primary">Emp Code</th>
                        <th onClick={() => handleSort('full_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">Teacher Name</th>
                        <th onClick={() => handleSort('school_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">School</th>
                        <th onClick={() => handleSort('subject')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">Subject</th>
                        <th className="px-4 py-3.5 font-bold">Assignments</th>
                        <th className="px-3 py-3.5 font-bold">Status</th>
                        <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                      </>
                    )}

                    {activeDomain === 'attendance' && (
                      <>
                        <th onClick={() => handleSort('attendance_date')} className="px-3 py-3.5 font-bold cursor-pointer hover:text-primary">Date</th>
                        <th onClick={() => handleSort('student_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">Student</th>
                        <th onClick={() => handleSort('school_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">School</th>
                        <th className="px-3 py-3.5 font-bold">Class / Sec</th>
                        <th className="px-3 py-3.5 font-bold">Session</th>
                        <th className="px-3 py-3.5 font-bold">Status</th>
                        <th className="px-4 py-3.5 font-bold">Remarks</th>
                        <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                      </>
                    )}

                    {activeDomain === 'incidents' && (
                      <>
                        <th onClick={() => handleSort('incident_code')} className="px-3 py-3.5 font-bold cursor-pointer hover:text-primary">Code</th>
                        <th onClick={() => handleSort('incident_type')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">Type</th>
                        <th onClick={() => handleSort('school_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">School</th>
                        <th className="px-3 py-3.5 font-bold">Level / Priority</th>
                        <th className="px-4 py-3.5 font-bold">Handler</th>
                        <th className="px-3 py-3.5 font-bold">Status</th>
                        <th className="px-4 py-3.5 font-bold">Time</th>
                        <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                      </>
                    )}

                    {activeDomain === 'academic' && (
                      <>
                        <th onClick={() => handleSort('school_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">School</th>
                        <th onClick={() => handleSort('exam_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">Exam</th>
                        <th className="px-3 py-3.5 font-bold">Class / Sec</th>
                        <th className="px-4 py-3.5 font-bold">Subject & Component</th>
                        <th onClick={() => handleSort('student_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">Student</th>
                        <th className="px-3 py-3.5 font-bold text-center">Score</th>
                        <th className="px-3 py-3.5 font-bold text-center">Result</th>
                        <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                      </>
                    )}

                    {activeDomain === 'audit' && (
                      <>
                        <th onClick={() => handleSort('created_at')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">Timestamp</th>
                        <th onClick={() => handleSort('school_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">School</th>
                        <th onClick={() => handleSort('actor_name')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">Actor & Role</th>
                        <th onClick={() => handleSort('action')} className="px-4 py-3.5 font-bold cursor-pointer hover:text-primary">Action API</th>
                        <th className="px-4 py-3.5 font-bold">Target</th>
                        <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant/30 text-body-md">
                  {paginatedRows.map((row: any) => {
                    const isSelected = selectedRowIds.has(row.id);

                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors hover:bg-surface-container-low/70 ${isSelected ? 'bg-primary/5' : ''}`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(row.id)}
                            className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                        </td>

                        {/* Domain-specific Cells */}
                        {activeDomain === 'students' && (
                          <>
                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{row.student_code}</td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-on-surface">{row.full_name}</p>
                              {row.date_of_birth && <p className="text-xs text-on-surface-variant">DOB: {row.date_of_birth}</p>}
                            </td>
                            <td className="px-3 py-3 font-semibold">{row.roll_no}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{row.school_name}</td>
                            <td className="px-3 py-3 font-medium">{row.class_name}</td>
                            <td className="px-3 py-3 font-medium">{row.section_name}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-on-surface">{row.guardian_name}</p>
                              <p className="text-xs text-on-surface-variant">{row.parent_phone}</p>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`status-chip ${row.sms_enabled ? 'bg-green-100 text-green-700' : 'bg-surface-container text-on-surface-variant'}`}>
                                {row.sms_enabled ? 'ON' : 'OFF'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`status-chip ${
                                row.travel_status === 'reached_school' ? 'bg-green-100 text-green-700' :
                                row.travel_status === 'to_school' ? 'bg-blue-100 text-blue-700' :
                                row.travel_status === 'reached_home' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {row.travel_status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`status-chip ${
                                row.attendance_status === 'present' ? 'bg-green-100 text-green-700' :
                                row.attendance_status === 'absent' ? 'bg-error-container text-error' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {row.attendance_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectModalTitle(`Student: ${row.full_name} (${row.student_code})`);
                                  setInspectModalRecord(row);
                                }}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                title="Inspect student record"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </td>
                          </>
                        )}

                        {activeDomain === 'schools' && (
                          <>
                            <td className="px-4 py-3">
                              <p className="font-bold text-primary">{row.name}</p>
                              <p className="text-xs text-on-surface-variant">{row.address || row.city}</p>
                            </td>
                            <td className="px-3 py-3 font-mono text-xs font-bold">{row.code}</td>
                            <td className="px-4 py-3">{row.city || 'India'}</td>
                            <td className="px-4 py-3">
                              <p>{row.email}</p>
                              <p className="text-xs text-on-surface-variant">{row.phone}</p>
                            </td>
                            <td className="px-3 py-3 text-xs text-on-surface-variant">
                              {row.school_open_time} - {row.school_close_time}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`status-chip ${row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectModalTitle(`School: ${row.name}`);
                                  setInspectModalRecord(row);
                                }}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                                title="Inspect school details"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </td>
                          </>
                        )}

                        {activeDomain === 'classes' && (
                          <>
                            <td className="px-4 py-3 font-semibold text-primary">{row.school_name}</td>
                            <td className="px-4 py-3 font-bold">{row.class_name}</td>
                            <td className="px-3 py-3 font-bold">{row.section_name}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{row.room}</td>
                            <td className="px-4 py-3 font-medium">{row.incharge}</td>
                            <td className="px-4 py-3 text-center font-bold text-primary">{row.student_count}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectModalTitle(`Class Roster: ${row.class_name} - ${row.section_name}`);
                                  setInspectModalRecord(row);
                                }}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </td>
                          </>
                        )}

                        {activeDomain === 'teachers' && (
                          <>
                            <td className="px-3 py-3 font-mono text-xs font-bold text-primary">{row.employee_code}</td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-on-surface">{row.full_name}</p>
                              <p className="text-xs text-on-surface-variant">{row.qualification}</p>
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">{row.school_name}</td>
                            <td className="px-4 py-3 font-medium">{row.subject}</td>
                            <td className="px-4 py-3 text-xs text-on-surface-variant">
                              {(row.assignments || []).map((a: any) => `${a.className}-${a.sectionName}`).join(', ') || 'None assigned'}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`status-chip ${row.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectModalTitle(`Faculty: ${row.full_name}`);
                                  setInspectModalRecord(row);
                                }}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </td>
                          </>
                        )}

                        {activeDomain === 'attendance' && (
                          <>
                            <td className="px-3 py-3 font-medium">{row.attendance_date}</td>
                            <td className="px-4 py-3">
                              <p className="font-bold">{row.student_name}</p>
                              {row.student_code && <p className="text-xs text-on-surface-variant">{row.student_code}</p>}
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">{row.school_name}</td>
                            <td className="px-3 py-3">{row.class_name} - {row.section_name}</td>
                            <td className="px-3 py-3 capitalize">{row.session}</td>
                            <td className="px-3 py-3">
                              <span className={`status-chip ${row.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-error-container text-error'}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-on-surface-variant">{row.reason || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectModalTitle(`Attendance: ${row.student_name} (${row.attendance_date})`);
                                  setInspectModalRecord(row);
                                }}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </td>
                          </>
                        )}

                        {activeDomain === 'incidents' && (
                          <>
                            <td className="px-3 py-3 font-mono text-xs font-bold text-error">{row.incident_code}</td>
                            <td className="px-4 py-3 font-bold">{row.incident_type}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{row.school_name}</td>
                            <td className="px-3 py-3">
                              <span className="status-chip bg-error-container text-error">{row.level}</span>
                            </td>
                            <td className="px-4 py-3 font-medium">{row.handler_name}</td>
                            <td className="px-3 py-3">
                              <span className={`status-chip ${row.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-on-surface-variant">{row.incident_time}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectModalTitle(`Incident: ${row.incident_code}`);
                                  setInspectModalRecord(row);
                                }}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </td>
                          </>
                        )}

                        {activeDomain === 'academic' && (
                          <>
                            <td className="px-4 py-3 text-on-surface-variant">{row.school_name}</td>
                            <td className="px-4 py-3 font-bold">{row.exam_name}</td>
                            <td className="px-3 py-3">{row.class_name} - {row.section_name}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold">{row.subject}</p>
                              <p className="text-xs text-on-surface-variant">{row.component}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-bold">{row.student_name}</p>
                              <p className="text-xs text-on-surface-variant">{row.student_code}</p>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold">{row.marks_obtained}</span> / {row.max_marks} ({row.percentage})
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`status-chip ${row.status === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-error-container text-error'}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectModalTitle(`Academic: ${row.student_name} - ${row.subject}`);
                                  setInspectModalRecord(row);
                                }}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </td>
                          </>
                        )}

                        {activeDomain === 'audit' && (
                          <>
                            <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{row.created_at}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{row.school_name}</td>
                            <td className="px-4 py-3">
                              <p className="font-bold">{row.actor_name}</p>
                              <p className="text-xs text-primary font-semibold">{row.actor_role}</p>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{row.action}</td>
                            <td className="px-4 py-3 text-xs text-on-surface-variant">
                              {row.entity_type} ({row.entity_id})
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectModalTitle(`Audit Action: ${row.action}`);
                                  setInspectModalRecord(row);
                                }}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-low/40">
            <div className="text-label-sm text-on-surface-variant">
              Showing <span className="font-bold text-on-surface">{sortedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-on-surface">{Math.min(currentPage * pageSize, sortedRows.length)}</span> of{' '}
              <span className="font-bold text-on-surface">{sortedRows.length}</span> matching entries
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white font-bold text-label-sm hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-label-sm font-semibold px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white font-bold text-label-sm hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {/* Record Detail Modal */}
        {inspectModalRecord && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-outline-variant p-6 max-h-[85vh] flex flex-col animate-scale-in">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-outline-variant/60">
                <div>
                  <span className="text-label-xs font-bold text-primary uppercase tracking-wider">Record Metadata Inspection</span>
                  <h3 className="font-headline-sm font-bold text-primary mt-0.5">{inspectModalTitle}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectModalRecord(null)}
                  className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="overflow-y-auto py-4 space-y-3 flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(inspectModalRecord).map(([key, val]) => (
                    <div key={key} className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/40">
                      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{key.replaceAll('_', ' ')}</p>
                      <p className="text-body-md font-semibold text-on-surface mt-1 break-words">
                        {val === null || val === undefined ? (
                          <span className="text-on-surface-variant/60">null</span>
                        ) : typeof val === 'object' ? (
                          <pre className="text-xs font-mono bg-white p-2 rounded border border-outline-variant mt-1 overflow-x-auto">
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        ) : (
                          String(val)
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    exportToJson(`record-${Date.now()}`, inspectModalRecord);
                    showToast('Record exported as JSON.');
                  }}
                  className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface font-bold rounded-xl text-label-md hover:bg-surface-container-high"
                >
                  Export Single JSON
                </button>
                <button
                  type="button"
                  onClick={() => setInspectModalRecord(null)}
                  className="px-5 py-2 bg-primary text-on-primary font-bold rounded-xl text-label-md hover:opacity-90"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainAdminShell>
  );
}
