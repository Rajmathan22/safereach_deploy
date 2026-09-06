import React, { Suspense, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import RootLayout from "@/app/layout";
import LoadingRing from "@/components/LoadingRing";
import { applyThemeMode, readThemeMode } from "@/lib/themeMode";
import AdminLayout from "@/app/admin/layout";
import ParentLayout from "@/app/parent/layout";
import TeacherLayout from "@/app/teacher/layout";
import NotFound from "@/app/not-found";
import HomePage from "@/app/page";
import SchoolRegistrationPage from "@/app/school-registration/page";
import LoginPage from "@/app/login/page";
import AdminLoginPage from "@/app/login/admin/page";
import TeacherLoginPage from "@/app/login/teacher/page";
import ParentLoginPage from "@/app/login/parent/page";
import ForgotPasswordPage from "@/app/login/forgot-password/page";
import MainAdminLoginPage from "@/app/main-admin/login/page";
import MainAdminDashboardPage from "@/app/main-admin/dashboard/page";
import MainAdminNotificationsPage from "@/app/main-admin/notifications/page";
import MainAdminReportsPage from "@/app/main-admin/reports/page";
import MainAdminTermsPage from "@/app/main-admin/terms/page";
import SubMainLoginPage from "@/app/sub-main/page";
import AdminDashboardPage from "@/app/admin/dashboard/page";
import AdminAccountPage from "@/app/admin/account/page";
import AdminAccessPage from "@/app/admin/access/page";
import AdminAuditPage from "@/app/admin/audit/page";
import AdminIncidentsPage from "@/app/admin/incidents/page";
import AdminMessagesPage from "@/app/admin/messages/page";
import AdminNotificationsPage from "@/app/admin/notifications/page";
import AdminPreferencesPage from "@/app/admin/preferences/page";
import AdminProfilePage from "@/app/admin/profile/page";
import AdminReportsPage from "@/app/admin/reports/page";
import AdminResultsPage from "@/app/admin/results/page";
import AdminSecurityPage from "@/app/admin/security/page";
import AdminStudentsPage from "@/app/admin/students/page";
import AdminStudentsAddPage from "@/app/admin/students/add/page";
import AdminStudentsClassViewPage from "@/app/admin/students/class-view/page";
import AdminEditClassPage from "@/app/admin/students/edit-class/page";
import AdminStudentsProfilePage from "@/app/admin/students/profile/page";
import AdminSupportPage from "@/app/admin/support/page";
import AdminTeachersPage from "@/app/admin/teachers/page";
import AdminTeachersProfilePage from "@/app/admin/teachers/profile/page";
import AdminNewTeacherPage from "@/app/admin/teachers/new/page";
import AdminTimetablePage from "@/app/admin/timetable/page";
import AdminClassTimetablePage from "@/app/admin/timetable/class/page";
import AdminTimetableEditPage from "@/app/admin/timetable/edit/page";
import TeacherAttendancePage from "@/app/teacher/attendance/page";
import TeacherDashboardPage from "@/app/teacher/dashboard/page";
import TeacherMessagesPage from "@/app/teacher/messages/page";
import TeacherNotificationsPage from "@/app/teacher/notifications/page";
import TeacherProfilePage from "@/app/teacher/profile/page";
import TeacherReportsPage from "@/app/teacher/reports/page";
import TeacherResultsPage from "@/app/teacher/results/page";
import TeacherResultsEditPage from "@/app/teacher/results/edit/page";
import TeacherSettingsPage from "@/app/teacher/settings/page";
import TeacherStudentsPage from "@/app/teacher/students/page";
import TeacherStudentsAddPage from "@/app/teacher/students/add/page";
import TeacherStudentsEditPage from "@/app/teacher/students/edit/page";
import TeacherSupportPage from "@/app/teacher/support/page";
import TeacherTimetablePage from "@/app/teacher/timetable/page";
import TeacherTimetableEditPage from "@/app/teacher/timetable/edit/page";
import ParentAttendancePage from "@/app/parent/attendance/page";
import ParentChildrenRecordsPage from "@/app/parent/children/records/page";
import ParentDashboardPage from "@/app/parent/dashboard/page";
import ParentMessagesPage from "@/app/parent/messages/page";
import ParentNotificationsPage from "@/app/parent/notifications/page";
import ParentProfilePage from "@/app/parent/profile/page";
import ParentReportsPage from "@/app/parent/reports/page";
import ParentSettingsPage from "@/app/parent/settings/page";
import ParentStudentsPage from "@/app/parent/students/page";
import ParentSupportPage from "@/app/parent/support/page";
import ParentTimetablePage from "@/app/parent/timetable/page";

applyThemeMode(readThemeMode());

const plainRoutes: Record<string, React.ComponentType> = {
  "/": HomePage,
  "/school-registration": SchoolRegistrationPage,
  "/login": LoginPage,
  "/login/admin": SubMainLoginPage,
  "/login/teacher": TeacherLoginPage,
  "/login/parent": ParentLoginPage,
  "/login/forgot-password": ForgotPasswordPage,
  "/main-admin": MainAdminDashboardPage,
  "/main-admin/login": MainAdminLoginPage,
  "/main-admin/dashboard": MainAdminDashboardPage,
  "/main-admin/notifications": MainAdminNotificationsPage,
  "/main-admin/reports": MainAdminReportsPage,
  "/main-admin/terms": MainAdminTermsPage,
  "/sub-main": SubMainLoginPage,
};

const adminRoutes: Record<string, React.ComponentType> = {
  "/admin": AdminDashboardPage,
  "/admin/dashboard": AdminDashboardPage,
  "/admin/account": AdminAccountPage,
  "/admin/access": AdminAccessPage,
  "/admin/audit": AdminAuditPage,
  "/admin/incidents": AdminIncidentsPage,
  "/admin/messages": AdminMessagesPage,
  "/admin/notifications": AdminNotificationsPage,
  "/admin/preferences": AdminPreferencesPage,
  "/admin/profile": AdminProfilePage,
  "/admin/reports": AdminReportsPage,
  "/admin/results": AdminResultsPage,
  "/admin/security": AdminSecurityPage,
  "/admin/students": AdminStudentsPage,
  "/admin/students/add": AdminStudentsAddPage,
  "/admin/students/class-view": AdminStudentsClassViewPage,
  "/admin/students/edit-class": AdminEditClassPage,
  "/admin/students/profile": AdminStudentsProfilePage,
  "/admin/support": AdminSupportPage,
  "/admin/teachers": AdminTeachersPage,
  "/admin/teachers/profile": AdminTeachersProfilePage,
  "/admin/teachers/new": AdminNewTeacherPage,
  "/admin/timetable": AdminTimetablePage,
  "/admin/timetable/class": AdminClassTimetablePage,
  "/admin/timetable/edit": AdminTimetableEditPage,
};

const teacherRoutes: Record<string, React.ComponentType> = {
  "/teacher": TeacherDashboardPage,
  "/teacher/attendance": TeacherAttendancePage,
  "/teacher/dashboard": TeacherDashboardPage,
  "/teacher/messages": TeacherMessagesPage,
  "/teacher/notifications": TeacherNotificationsPage,
  "/teacher/profile": TeacherProfilePage,
  "/teacher/reports": TeacherReportsPage,
  "/teacher/results": TeacherResultsPage,
  "/teacher/results/edit": TeacherResultsEditPage,
  "/teacher/settings": TeacherSettingsPage,
  "/teacher/students": TeacherStudentsPage,
  "/teacher/students/add": TeacherStudentsAddPage,
  "/teacher/students/edit": TeacherStudentsEditPage,
  "/teacher/support": TeacherSupportPage,
  "/teacher/timetable": TeacherTimetablePage,
  "/teacher/timetable/edit": TeacherTimetableEditPage,
};
const parentRoutes: Record<string, React.ComponentType> = {
  "/parent": ParentDashboardPage,
  "/parent/attendance": ParentAttendancePage,
  "/parent/children/records": ParentChildrenRecordsPage,
  "/parent/dashboard": ParentDashboardPage,
  "/parent/messages": ParentMessagesPage,
  "/parent/notifications": ParentNotificationsPage,
  "/parent/profile": ParentProfilePage,
  "/parent/reports": ParentReportsPage,
  "/parent/settings": ParentSettingsPage,
  "/parent/students": ParentStudentsPage,
  "/parent/support": ParentSupportPage,
  "/parent/timetable": ParentTimetablePage,
};

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", sync);
    window.addEventListener("safereach:navigate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("safereach:navigate", sync);
    };
  }, []);

  return pathname;
}

function AppRouter() {
  const pathname = usePathname();
  const rendered = useMemo(() => {
    const PlainPage = plainRoutes[pathname];
    if (PlainPage) return <PlainPage />;

    const AdminPage = adminRoutes[pathname];
    if (AdminPage) return <AdminLayout><AdminPage /></AdminLayout>;

    const TeacherPage = teacherRoutes[pathname];
    if (TeacherPage) return <TeacherLayout><TeacherPage /></TeacherLayout>;

    const ParentPage = parentRoutes[pathname];
    if (ParentPage) return <ParentLayout><ParentPage /></ParentLayout>;

    return <NotFound />;
  }, [pathname]);

  return <RootLayout>{rendered}</RootLayout>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingRing size="lg" />}>
      <AppRouter />
    </Suspense>
  </React.StrictMode>,
);
