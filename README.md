<div align="center">

  <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=800&size=34&duration=2600&pause=700&color=00236F&center=true&vCenter=true&width=900&lines=SafeReach;Smart+School+Safety+Platform;Frontend+Demo+With+Backend+Blueprint;Student+Travel+Attendance+Messages+Reports" alt="SafeReach animated title" />

  <p>
    <strong>SafeReach</strong> is a school safety and student management platform for main admins, school admins, teachers, and parents.
    This repository currently contains a working frontend demo plus professional backend planning documents.
  </p>

  <p>
    <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
    <img alt="React" src="https://img.shields.io/badge/React-18.3-149ECA?style=for-the-badge&logo=react&logoColor=white" />
    <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
    <img alt="Backend" src="https://img.shields.io/badge/Backend-PHP%208%20%2B%20MySQL-777BB4?style=for-the-badge&logo=php&logoColor=white" />
  </p>

  <p>
    <a href="#quick-start">Quick Start</a>
    <span> | </span>
    <a href="#frontend-details">Frontend</a>
    <span> | </span>
    <a href="#backend-blueprint">Backend</a>
    <span> | </span>
    <a href="#database-plan">Database</a>
    <span> | </span>
    <a href="#er-diagram">ER Diagram</a>
    <span> | </span>
    <a href="#data-flow">Data Flow</a>
    <span> | </span>
    <a href="#visual-style">Visual Style</a>
  </p>

</div>

---

## Overview

SafeReach is designed for real-world school safety operations:

- Main admin monitors all schools and approves school onboarding.
- School admin manages class records, staff, messages, incidents, and reports.
- Teacher manages assigned class students, attendance, SMS status updates, and class messages.
- Parent monitors children, attendance, travel status, messages, and reports.

The codebase contains the SafeReach frontend connected to a fast, unified PHP 8 + MySQL backend with complete support for student travel lifecycles, attendance records, parent-teacher messaging, academic results, and safety protocols.

## Quick Start

### Option A: Docker Deployment (Recommended for AWS EC2 & Local Production)

Run the entire application stack (Frontend, PHP Backend, MySQL 8.0, phpMyAdmin) in one command:

```bash
# 1. Copy environment configuration
cp .env.docker.example .env

# 2. Build and start all services in the background
docker compose up -d --build
```

Access the services:
- **SafeReach Web App**: `http://localhost` or `http://<YOUR_EC2_PUBLIC_IP>` (also available on port `3000`)
- **Direct Backend API**: `http://localhost:5000/api/v1/bootstrap`
- **phpMyAdmin**: `http://localhost:8085` (User: `root`, Password: `rootpassword`)

📖 **Complete AWS EC2 Deployment Guide**: [doc/AWS_EC2_DOCKER_DEPLOYMENT.md](doc/AWS_EC2_DOCKER_DEPLOYMENT.md)

---

### Option B: Local Development

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## 🔐 Demo Login Credentials

The MySQL database automatically seeds full datasets with test credentials for each role:

| Role | Email | Password | Access Portal |
| :--- | :--- | :--- | :--- |
| **👑 Main Admin** | `mainadmin@demo.safereach.edu` | `MainAdmin@2025` | `/login/main-admin` |
| **🏫 School Admin** | `admin@demo.safereach.edu` | `Admin@2025` | `/login/admin` |
| **👩‍🏫 Class Incharge** | `teacher@demo.safereach.edu` | `Teacher@2025` | `/login/teacher` |
| **👨‍🏫 Assistant Incharge**| `james.anderson@safereach.school` | `Teacher@2025` | `/login/teacher` |
| **👨‍👩‍👦 Parent** | `parent@demo.safereach.edu` | `Parent@2025` | `/login/parent` |


## Project Structure

```text
SafeReach/
  frontend/
    app/
      admin/
      teacher/
      parent/
      main-admin/
      login/
      school-registration/
    components/
    lib/
    scripts/
    README.md
  doc/
    frontend/
    backend/
  README.md
```

## Frontend Details

| Area | Details |
| --- | --- |
| Framework | React + Vite SPA |
| UI | React, Tailwind CSS |
| State | Frontend demo state with localStorage |
| Routing | Role-based pages for admin, teacher, parent, and main admin |
| Landing | Animated SafeReach hero, travel map, role previews, and backend-ready section |
| Current mode | Frontend-only demo |

Important routes:

| Route | Purpose |
| --- | --- |
| `/` | Animated landing page |
| `/login` | Normal role login selection |
| `/school-registration` | School admin registration request |
| `/admin/dashboard` | School admin overview |
| `/admin/students` | Class Records |
| `/admin/students/class-view` | Class teacher and class student containers |
| `/admin/messages` | Admin common group, teacher direct, parent direct messages |
| `/admin/teachers` | Staff management and incharge assignment |
| `/teacher/attendance` | Attendance, SMS status, go-out attendance |
| `/parent/dashboard` | Parent child travel status |
| `/main-admin/dashboard` | Platform main admin dashboard |

## Backend Blueprint

Current backend foundation and target stack:

| Layer | Recommendation |
| --- | --- |
| API | Python Flask with HTTP fallback endpoints and Socket.IO/WebSocket event handlers |
| App Server | Gunicorn with eventlet worker |
| Primary DB | DB-1 Supabase PostgreSQL for editable operational records |
| Backup DB | DB-2 Supabase PostgreSQL protected mirror of DB-1 tables |
| Realtime DB | MongoDB DB-3 for status, travel, notification, and event logs |
| Cache / Queue | Redis |
| Realtime | WebSocket or Socket.IO |
| Notifications | SMS, email, Firebase push |
| Deployment | Render backend, Vercel frontend, Kubernetes scale plan |
| Monitoring | Prometheus, Grafana, ELK |
| CI/CD | GitHub Actions |

Backend modules started or planned:

- Authentication and JWT sessions
- Refresh tokens
- Password hashing
- RBAC permission control
- School management
- User, teacher, parent, student management
- Class and section management
- Attendance and leave events
- Student travel lifecycle
- Emergency alerts
- SMS, email, push notifications
- Google Sheets schema/data export for DB visibility
- Reports and analytics
- Audit logs
- Terms and consent records
- Health checks and metrics

## Database Plan

Primary MongoDB collections:

```text
schools
users
roles
permissions
classes
sections
students
guardians
teacher_assignments
attendance_events
travel_events
messages
incidents
reports
notifications
terms_policies
consent_records
audit_logs
```

Audit database rule:

- Append-only audit writes
- Restricted credentials
- No normal application delete path
- WORM-style retention policy where supported
- Separate backup and recovery process

## ER Diagram

The ER diagram below avoids reserved Mermaid entity names. For example, `CLASSROOM` is used instead of `CLASS`.

```mermaid
erDiagram
  SCHOOL ||--o{ APP_USER : owns
  SCHOOL ||--o{ CLASSROOM : creates
  CLASSROOM ||--o{ SECTION : contains
  SECTION ||--o{ STUDENT : enrolls
  STUDENT ||--o{ GUARDIAN_LINK : has
  GUARDIAN ||--o{ GUARDIAN_LINK : linked_to
  APP_USER ||--o{ ROLE_ASSIGNMENT : receives
  ROLE ||--o{ ROLE_ASSIGNMENT : grants
  ROLE ||--o{ ROLE_PERMISSION : maps
  APP_PERMISSION ||--o{ ROLE_PERMISSION : authorizes
  SECTION ||--o{ TEACHER_ASSIGNMENT : assigned
  APP_USER ||--o{ TEACHER_ASSIGNMENT : teaches
  STUDENT ||--o{ ATTENDANCE_EVENT : records
  STUDENT ||--o{ TRAVEL_EVENT : tracks
  APP_USER ||--o{ MESSAGE : sends
  STUDENT ||--o{ INCIDENT : may_have
  SCHOOL ||--o{ REPORT : generates
  APP_USER ||--o{ AUDIT_LOG : performs
  TERMS_POLICY ||--o{ CONSENT_RECORD : accepted_as
```

## Data Flow

```mermaid
flowchart LR
  ParentApp[Parent App] -->|Ready to Send| Frontend[SafeReach Frontend]
  TeacherPortal[Teacher Portal] -->|Attendance and Go Out| Frontend
  AdminPortal[School Admin Portal] -->|Class Records and Reports| Frontend
  MainAdmin[Main Admin Portal] -->|School Approval and Terms| Frontend

  Frontend -->|Bootstrap/read data now; write APIs planned| FlaskAPI[Flask Backend API]
  FlaskAPI --> PrimaryDB[(DB-1 Supabase PostgreSQL)]
  FlaskAPI --> AuditDB[(DB-2 Protected Mirror PostgreSQL)]
  FlaskAPI --> DB3[(MongoDB DB-3 Realtime Events)]
  FlaskAPI --> RedisQueue[(Redis Cache and Queue)]

  RedisQueue --> SMSProvider[SMS Provider]
  RedisQueue --> EmailProvider[Email Provider]
  RedisQueue --> Firebase[Firebase Push]
  FlaskAPI --> Realtime[WebSocket Events]

  Realtime --> ParentApp
  Realtime --> TeacherPortal
  Realtime --> AdminPortal
```

## DB3 Realtime Travel Logic

SafeReach now includes a MongoDB-backed `DB3` event/log layer for realtime status and event updates. It is separate from Google Sheets. The backend writes student status, travel, SMS, timetable, and system check events to DB3 when configured.

![SafeReach DB3 realtime travel flow](doc/backend/safereach_db3_realtime_travel_flow.png)

```mermaid
flowchart LR
  ParentReady[Parent: Ready to Send] --> TrackingSchool[Tracking to School]
  TrackingSchool --> TeacherAttendance[Teacher Attendance]
  TeacherAttendance --> Present[Present]
  TeacherAttendance --> Late[Late Arrival]
  Present --> ParentSafe[Parent Status: SafeReach]
  Late --> ParentSafe
  TeacherGoOut[Teacher: Leave School] --> TrackingHome[Tracking to Home]
  TrackingHome --> ParentReached[Parent: Reached Home]
  ParentReached --> TeacherSafe[Teacher Status: SafeReach]

  TrackingSchool --> DB3[(DB3 Realtime Event Store)]
  TeacherAttendance --> DB3
  TeacherGoOut --> DB3
  ParentReached --> DB3

  DB3 --> StudentStatus[students_status]
  DB3 --> TeacherEvents[teacher_events]
  DB3 --> ParentEvents[parent_events]
  DB3 --> TravelEvents[travel_events]
  DB3 --> SmsEvents[sms_events]
```

Frontend demo behavior:

- Parent clicks `Ready to Send`; parent and teacher see `Tracking to School`.
- Parent can enable an alarm reminder if they may forget to click `Ready to Send`.
- `Ready to Send` is enabled once per child after the daily 8:00 AM reset.
- Teacher clicks `Present`; teacher sees `Present`, parent sees `SafeReach`.
- Teacher clicks `Late`; the same late attendance logic remains available.
- Teacher attendance marking is available to the primary incharge and assistant incharge.
- Teacher submits go-out attendance; parent and teacher see `Tracking to Home`.
- Teacher go-out attendance is enabled once per student per day after the daily 8:00 AM reset.
- Parent `Reached Home` is enabled only after teacher go-out submission and can be clicked once per day.
- Parent clicks `Reached Home`; teacher sees `SafeReach` and the warning row returns to normal.
- Teacher rows use different background colors while a student is still tracking or not safely reached.
- Parent/admin notification pages receive student status updates; the teacher does not receive their own student-action notification.

Future backend DB3 tables:

| DB3 Table | Purpose |
| --- | --- |
| `students_status` | Latest realtime student travel and safety state |
| `teacher_events` | Teacher attendance, late, present, absent, and go-out actions |
| `parent_events` | Parent ready-to-send, alarm, and reached-home confirmations |
| `travel_events` | Movement lifecycle events between home and school |
| `sms_events` | Generated SMS notification records and delivery status |
| `timetable_events` | Timetable day, period, subject, interval, and lunch changes |

## Timetable Plan

SafeReach includes a frontend-only timetable module for school admin, teacher, and parent roles. Subjects display as plain centered table text with no extra subject background or border. Interval and lunch display as merged narrow vertical columns between class periods, so each break label appears once across all day rows instead of repeating in every row.

![SafeReach sample timetable](doc/backend/safereach_sample_timetable.png)

| Role | Timetable Access |
| --- | --- |
| School Admin | Add, edit, delete timetable days, period columns, subjects, intervals, and lunch labels |
| Teacher | Add, edit, delete timetable entries for assigned class/section demo flow |
| Parent | View-only timetable from each child container |

Default timetable behavior:

- 6 days by default: Monday through Saturday.
- 8 periods per day by default.
- `Interval-1` is a merged vertical column after period 2.
- `Lunch` is a merged vertical column after period 4.
- `Interval-2` is a merged vertical column after period 6.
- Break labels display as plain vertical text inside the table cell, without an extra label background or border.
- Admin/teacher can drag `Interval-1`, `Lunch`, or `Interval-2` into an after-period slot to change the timing position.
- Admin/teacher can add or remove days and period columns.
- Admin/teacher can edit the interval and lunch labels, and the frontend keeps them in the same column positions.
- Parent can only view the current child standard timetable.

## Google Sheets DB Plan

SafeReach can export DB visibility into one Google Sheet workbook through Google Cloud APIs. The backend export script creates the main index tabs `sheet-1`, `sheet-2`, and `sheet-3`, then creates separate data tabs such as `sheet-1.1 schools`, `sheet-1.12 students`, and `sheet-3.1 student_status`.

```mermaid
flowchart LR
  Frontend[SafeReach Frontend] -->|Reads backend bootstrap data| Backend[Flask Backend API]
  Backend -->|Validate RBAC and rows| GoogleCloud[Google Cloud APIs]
  GoogleCloud --> Sheets[(Single Google Sheet Workbook)]

  Sheets --> DB1[DB-1 Editable Store]
  Sheets --> DB2[DB-2 Protected Store]

  DB1 --> S1[Sheet-1 Index]
  DB1 --> S11[Sheet-1.1 Schools]
  DB1 --> S12[Sheet-1.12 Students]
  DB1 --> S13[Sheet-1.13 Attendance]

  DB2 --> S2[Sheet-2 Index]
  DB2 --> S21[Sheet-2.1 Schools]
  DB2 --> S22[Sheet-2.12 Students]
  DB2 --> S23[Sheet-2.13 Attendance]

  Sheets --> DB3[DB-3 Realtime Log Export]
  DB3 --> S31[Sheet-3.1 Student Status]
  DB3 --> S32[Sheet-3.2 Travel Events]
  DB3 --> S33[Sheet-3.5 SMS Events]

  Admin[School Admin] -->|Add / edit / soft-delete| Backend
  Backend -->|Append audit rows only| DB2

  style DB1 fill:#EAFBF5,stroke:#00A77F,stroke-width:2px
  style DB2 fill:#FFF0F2,stroke:#C9182B,stroke-width:2px
  style Backend fill:#EAF2FF,stroke:#00236F,stroke-width:2px
  style GoogleCloud fill:#FFF7E6,stroke:#F59E0B,stroke-width:2px
```

| Sheet Area | Example Tabs | Rule |
| --- | --- | --- |
| `sheet-1` DB-1 index | Links to `sheet-1.1 schools`, `sheet-1.2 roles`, and every DB-1 table tab | Editable operational database mirror; frontend must read through backend APIs, not Sheets directly |
| `sheet-2` DB-2 index | Links to the same table set as DB-1, such as schools, users, students, attendance, reports, and incidents | Protected mirror visibility; insert/sync allowed, update/delete blocked |
| `sheet-3` DB-3 index | Links to MongoDB event/status collection exports | Realtime/event store visibility, not the main editable database |
| `api-test-results` | Integration test result rows | Shows DB, SMS, email, Redis, MongoDB, and Google Sheet test status |

Important rules:

- Frontend must not write directly to Google Sheets.
- Backend should use Google Cloud service credentials stored only in environment variables or secret manager.
- `DB-1` supports add, edit, read, and controlled soft-delete through backend validation.
- `DB-2` stores the same table structure/data shape as DB-1 for protected backup visibility. It allows inserts/sync copies but blocks update/delete operations.
- MongoDB DB-3 stores realtime status/events and is not exported as the primary source of truth.

## Permission Model

Example permission keys:

```text
app.main_admin.school.approve
app.main_admin.terms.edit
app.admin.class.create
app.admin.teacher.add
app.admin.teacher.assign_incharge
app.admin.teacher.assign_assistant_incharge
app.admin.student.open
app.admin.student.edit
app.admin.student.archive
app.admin.message.teacher.direct
app.teacher.attendance.mark
app.teacher.student.manage
app.parent.child.status.read
```

Assistant incharge should receive the same class-section permissions as the primary incharge, limited to assigned classes and sections.

## Visual Style

SafeReach uses a safety-technology palette:

| Role | Color |
| --- | --- |
| Primary navy | `#00236f` |
| Deep background | `#06142b` |
| Safety teal | `#00a77f` |
| Live cyan | `#22d3ee` |
| Success green | `#22c55e` |
| Alert red | `#c9182b` |
| Soft surface | `#eef8f6` |

## Animation Style

- Floating 3D travel map
- Glowing route lines
- Pulsing student status pins
- Animated dashboard cards
- Mobile parent alert pulse
- Smooth hover lift on cards and buttons
- Reduced motion support should be added for production accessibility

Example:

```css
.safe-card {
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.safe-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
}

.live-alert {
  animation: safePulse 1.5s ease-in-out infinite;
}

@keyframes safePulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.72;
    transform: scale(1.03);
  }
}
```

## Development Notes

- Do not commit secrets.
- Do not create backend code inside `frontend/`.
- Keep frontend demo data clearly separated from future backend APIs.
- Run `npm run build` before deployment.
- Use incognito mode with extensions disabled when debugging browser-extension console messages.

## Deployment Plan

Frontend:

```text
Platform: Vercel or GitHub Pages static export workflow
Root Directory: frontend
Install Command: npm install
Build Command: npm run build
Output Directory: dist
Environment: VITE_SAFEREACH_API_URL
```

Backend:

```text
Platform: Render first
Runtime: Python Flask + Gunicorn + eventlet
Database: DB-1 Supabase PostgreSQL, DB-2 protected mirror Supabase PostgreSQL, MongoDB DB-3
Cache/Queue: Redis or Upstash Redis REST
Future Scale: Kubernetes manifests with 2 frontend/backend replicas and Redis PVC
CI/CD: GitHub Actions on main branch
```

---

<div align="center">
  <strong>SafeReach</strong><br />
  Smart safety workflows for modern school operations.
</div>
