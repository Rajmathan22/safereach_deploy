<?php

namespace SafeReach\Services;

use SafeReach\Database;
use SafeReach\Security;

class SafeReachService {
    public const CURRENT_TEACHER_NAME = 'Sarah Jenkins';

    public static function login(string $email, string $password): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT u.*, r.role_key
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE LOWER(u.email) = LOWER(?) AND u.status = 'active'
        ");
        $stmt->execute([trim($email)]);
        $user = $stmt->fetch();

        if (!$user || !Security::verifyPassword($password, $user['password_hash'])) {
            throw new \DomainException("Invalid email or password");
        }

        unset($user['password_hash']);
        return [
            'user'         => $user,
            'accessToken'  => Security::createToken($user, 'access'),
            'refreshToken' => Security::createToken($user, 'refresh'),
        ];
    }

    public static function bootstrap(?string $role = null, ?string $schoolId = null): array {
        $pdo = Database::getConnection();

        // 1. Schools (Auto-seed if fresh database)
        $stmtSchools = $pdo->query("SELECT id, name, code, status, school_open_time, school_close_time FROM schools ORDER BY created_at");
        $schools = $stmtSchools->fetchAll();
        if (empty($schools)) {
            require_once dirname(__DIR__, 2) . '/database/seed.php';
            if (function_exists('runSeed')) {
                runSeed();
            }
            $stmtSchools = $pdo->query("SELECT id, name, code, status, school_open_time, school_close_time FROM schools ORDER BY created_at");
            $schools = $stmtSchools->fetchAll();
        }

        // 2. Classes with nested sections
        $stmtClasses = $pdo->query("
            SELECT c.id, c.name AS class_name, c.sort_order,
                   COALESCE((
                       SELECT JSON_ARRAYAGG(JSON_OBJECT('id', s.id, 'name', s.name, 'room', s.room))
                       FROM sections s
                       WHERE s.class_id = c.id
                   ), JSON_ARRAY()) AS sections_json
            FROM classes c
            ORDER BY c.sort_order, c.name
        ");
        $classesRaw = $stmtClasses->fetchAll();
        $classes = array_map(function($c) {
            $c['sections'] = json_decode($c['sections_json'], true) ?: [];
            unset($c['sections_json']);
            return $c;
        }, $classesRaw);

        // 3. Teachers with assignments
        $stmtTeachers = $pdo->query("
            SELECT t.id, t.user_id, u.full_name, u.email, u.phone, t.employee_code, t.subject, t.qualification, t.status,
                   COALESCE((
                       SELECT JSON_ARRAYAGG(JSON_OBJECT(
                           'className', cl.name,
                           'sectionName', sec.name,
                           'assignmentType', ta.assignment_type,
                           'subject', ta.subject
                       ))
                       FROM teacher_assignments ta
                       JOIN classes cl ON cl.id = ta.class_id
                       JOIN sections sec ON sec.id = ta.section_id
                       WHERE ta.teacher_id = t.id AND ta.active = TRUE
                   ), JSON_ARRAY()) AS assignments_json
            FROM teachers t
            LEFT JOIN users u ON u.id = t.user_id
            ORDER BY u.full_name
        ");
        $teachersRaw = $stmtTeachers->fetchAll();
        $teachers = array_map(function($t) {
            $t['assignments'] = json_decode($t['assignments_json'], true) ?: [];
            unset($t['assignments_json']);
            return $t;
        }, $teachersRaw);

        // 4. Students
        $today = date('Y-m-d');
        $stmtStudents = $pdo->query("
            SELECT s.id, s.student_code, s.full_name, s.roll_no, s.gender, s.date_of_birth, s.emergency_notes,
                   c.name AS class_name, sec.name AS section_name,
                   p.id AS parent_id, p.user_id AS parent_user_id, p.guardian_name, p.phone AS parent_phone,
                   u.email AS parent_email,
                   (p.sms_enabled = 1) AS sms_enabled,
                   COALESCE(sts.status, 'at_home') AS travel_status,
                   COALESCE(sts.attendance_status, 'pending') AS attendance_status,
                   sts.last_event_at AS travel_updated_at,
                   COALESCE(today_att.reason, '') AS absence_reason,
                   absence_notif.created_at AS absence_sms_sent_at
            FROM students s
            JOIN schools sc ON sc.id = s.school_id
            JOIN classes c ON c.id = s.class_id
            JOIN sections sec ON sec.id = s.section_id
            LEFT JOIN parents p ON p.id = s.parent_id
            LEFT JOIN users u ON u.id = p.user_id
            LEFT JOIN student_travel_status sts ON sts.student_id = s.id
            LEFT JOIN (
                SELECT ar.student_id, ar.reason
                FROM attendance_records ar
                WHERE ar.attendance_date = '{$today}' AND ar.session = 'morning'
            ) today_att ON today_att.student_id = s.id
            LEFT JOIN (
                SELECT m.student_id, MAX(m.created_at) AS created_at
                FROM messages m
                WHERE m.message_kind = 'absence_request' AND DATE(m.created_at) = '{$today}'
                GROUP BY m.student_id
            ) absence_notif ON absence_notif.student_id = s.id
            ORDER BY c.sort_order, sec.name, CAST(s.roll_no AS UNSIGNED), s.roll_no
        ");
        $studentsRaw = $stmtStudents->fetchAll();
        $students = array_map(function($s) {
            $s['sms_enabled'] = (bool)$s['sms_enabled'];
            return $s;
        }, $studentsRaw);

        // 5. Attendance
        $stmtAtt = $pdo->query("
            SELECT ar.id, ar.student_id, s.full_name AS student_name, ar.attendance_date, ar.session, ar.status, ar.reason, (ar.locked = 1) AS locked, ar.created_at
            FROM attendance_records ar
            JOIN students s ON s.id = ar.student_id
            ORDER BY ar.attendance_date DESC, CAST(s.roll_no AS UNSIGNED)
        ");
        $attendance = array_map(function($a) {
            $a['locked'] = (bool)$a['locked'];
            return $a;
        }, $stmtAtt->fetchAll());

        // 6. Reports
        $stmtReports = $pdo->query("
            SELECT sr.id, sr.report_title, sr.safety_score, sr.alert_count, sr.attendance_percent, sr.report_text,
                   c.name AS class_name, sec.name AS section_name, sr.created_at
            FROM safety_reports sr
            LEFT JOIN classes c ON c.id = sr.class_id
            LEFT JOIN sections sec ON sec.id = sr.section_id
            ORDER BY sr.created_at DESC
        ");
        $reports = $stmtReports->fetchAll();

        // 7. Incidents
        $stmtIncidents = $pdo->query("
            SELECT il.id, il.incident_code, il.incident_type, il.level, il.priority, il.status, il.handler_name, il.incident_time, il.detail,
                   s.full_name AS student_name, c.name AS class_name, sec.name AS section_name
            FROM incident_logs il
            LEFT JOIN students s ON s.id = il.student_id
            LEFT JOIN classes c ON c.id = s.class_id
            LEFT JOIN sections sec ON sec.id = s.section_id
            ORDER BY il.incident_time DESC
        ");
        $incidents = $stmtIncidents->fetchAll();

        // 8. API Tests
        $stmtTests = $pdo->query("SELECT id, test_name, service_name, status, detail, created_at FROM api_test_results ORDER BY created_at DESC LIMIT 50");
        $apiTests = $stmtTests->fetchAll();

        // 9. Timetable
        $timetable = self::buildTimetable($pdo, $schoolId);

        // 10. Academic Results
        $academicResults = AcademicResultService::listResults();

        return [
            'schools'         => $schools,
            'classes'         => $classes,
            'teachers'        => $teachers,
            'students'        => $students,
            'attendance'      => $attendance,
            'reports'         => $reports,
            'incidents'       => $incidents,
            'apiTests'        => $apiTests,
            'timetable'       => $timetable,
            'academicResults' => $academicResults,
            'role'            => $role,
            'schoolId'        => $schoolId,
        ];
    }

    public static function schoolSettings(?string $schoolId = null): array {
        $pdo = Database::getConnection();
        $sId = self::resolveSchoolId($pdo, $schoolId);

        $stmt = $pdo->prepare("SELECT id, name, code, address, city, state, country, phone, email, status, school_open_time, school_close_time, created_at, updated_at FROM schools WHERE id = ?");
        $stmt->execute([$sId]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new \OutOfBoundsException("School settings not found");
        }
        return $row;
    }

    public static function updateSchoolSettings(array $payload, ?string $actorUserId = null, ?string $schoolId = null): array {
        $pdo = Database::getConnection();
        $sId = self::resolveSchoolId($pdo, $schoolId ?: ($payload['schoolId'] ?? null));

        $allowed = [
            'name'            => 'name',
            'phone'           => 'phone',
            'email'           => 'email',
            'address'         => 'address',
            'city'            => 'city',
            'state'           => 'state',
            'country'         => 'country',
            'status'          => 'status',
            'schoolOpenTime'  => 'school_open_time',
            'schoolCloseTime' => 'school_close_time',
        ];

        $fields = [];
        $values = [];
        foreach ($allowed as $apiKey => $col) {
            if (isset($payload[$apiKey])) {
                $fields[] = "{$col} = ?";
                $values[] = $payload[$apiKey];
            }
        }

        if (empty($fields)) {
            throw new \InvalidArgumentException("No valid school settings supplied to update");
        }

        $values[] = $sId;
        $sql = "UPDATE schools SET " . implode(', ', $fields) . " WHERE id = ?";
        $pdo->prepare($sql)->execute($values);

        $updated = self::schoolSettings($sId);
        AuditService::writeAudit('school.settings_updated', 'school', $sId, $updated, $actorUserId, $sId);
        return $updated;
    }

    public static function markReadyToSchool(string $studentId, ?string $actorUserId = null): array {
        return self::updateTravelStatus($studentId, 'to_school', 'departed_from_home', $actorUserId, 'to_school', false);
    }

    public static function markReachedSchool(string $studentId, ?string $actorUserId = null): array {
        $payload = self::updateTravelStatus($studentId, 'reached_school', 'reached_school', $actorUserId, 'reached_school', false);

        $pdo = Database::getConnection();
        $today = date('Y-m-d');
        $stmtStudent = $pdo->prepare("SELECT school_id, class_id, section_id FROM students WHERE id = ?");
        $stmtStudent->execute([$studentId]);
        $st = $stmtStudent->fetch();

        if ($st) {
            $stmtAtt = $pdo->prepare("
                INSERT INTO attendance_records (id, school_id, student_id, class_id, section_id, attendance_date, session, status, marked_by, locked)
                VALUES (?, ?, ?, ?, ?, ?, 'morning', 'reached_school', ?, 1)
                ON DUPLICATE KEY UPDATE status = 'reached_school', marked_by = VALUES(marked_by), locked = 1, updated_at = NOW()
            ");
            $stmtAtt->execute([self::uuid(), $st['school_id'], $studentId, $st['class_id'], $st['section_id'], $today, $actorUserId]);
        }

        return $payload;
    }

    public static function markReachedHome(string $studentId, ?string $actorUserId = null): array {
        return self::updateTravelStatus($studentId, 'reached_home', 'reached_home', $actorUserId, 'reached_home', false);
    }


    public static function submitAttendance(string $studentId, string $status, ?string $actorUserId = null): array {
        if (!in_array($status, ['present', 'absent', 'late'], true)) {
            throw new \InvalidArgumentException("Invalid attendance status");
        }

        $travelStatus = ($status === 'present') ? 'present' : (($status === 'absent') ? 'absent' : 'reached_school');
        $payload = self::updateTravelStatus($studentId, $travelStatus, "attendance_{$status}", $actorUserId, $status, false);

        $pdo = Database::getConnection();
        $today = date('Y-m-d');
        $stmtStudent = $pdo->prepare("SELECT school_id, class_id, section_id FROM students WHERE id = ?");
        $stmtStudent->execute([$studentId]);
        $st = $stmtStudent->fetch();

        if ($st) {
            $isLocked = in_array($status, ['present', 'absent'], true);
            $stmtAtt = $pdo->prepare("
                INSERT INTO attendance_records (id, school_id, student_id, class_id, section_id, attendance_date, session, status, marked_by, locked)
                VALUES (?, ?, ?, ?, ?, ?, 'morning', ?, ?, ?)
                ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by), locked = VALUES(locked), updated_at = NOW()
            ");
            $stmtAtt->execute([self::uuid(), $st['school_id'], $studentId, $st['class_id'], $st['section_id'], $today, $status, $actorUserId, $isLocked ? 1 : 0]);
        }

        return $payload;
    }

    public static function submitGoOut(string $studentId, ?string $actorUserId = null): array {
        $payload = self::updateTravelStatus($studentId, 'going_home', 'go_out', $actorUserId, null, true);

        $pdo = Database::getConnection();
        $today = date('Y-m-d');
        $stmtStudent = $pdo->prepare("SELECT school_id, class_id, section_id FROM students WHERE id = ?");
        $stmtStudent->execute([$studentId]);
        $st = $stmtStudent->fetch();

        if ($st) {
            $stmtAtt = $pdo->prepare("
                INSERT INTO attendance_records (id, school_id, student_id, class_id, section_id, attendance_date, session, status, marked_by, locked)
                VALUES (?, ?, ?, ?, ?, ?, 'go_out', 'going_home', ?, TRUE)
                ON DUPLICATE KEY UPDATE status = 'going_home', marked_by = VALUES(marked_by), locked = TRUE, updated_at = NOW()
            ");
            $stmtAtt->execute([self::uuid(), $st['school_id'], $studentId, $st['class_id'], $st['section_id'], $today, $actorUserId]);
        }

        return $payload;
    }

    public static function setStudentSmsEnabled(string $studentId, bool $enabled, ?string $actorUserId = null): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            UPDATE parents p
            JOIN students s ON s.parent_id = p.id
            SET p.sms_enabled = ?, p.updated_at = NOW()
            WHERE s.id = ?
        ");
        $stmt->execute([$enabled ? 1 : 0, $studentId]);

        $stmtInfo = $pdo->prepare("
            SELECT s.id AS student_id, s.school_id, s.full_name AS student_name, p.id AS parent_id, p.phone AS parent_phone, (p.sms_enabled = 1) AS sms_enabled
            FROM students s
            JOIN parents p ON p.id = s.parent_id
            WHERE s.id = ?
        ");
        $stmtInfo->execute([$studentId]);
        $row = $stmtInfo->fetch();
        if (!$row) {
            throw new \OutOfBoundsException("Student parent record not found");
        }

        $row['sms_enabled'] = (bool)$row['sms_enabled'];
        AuditService::writeAudit('student.sms_enabled_updated', 'student', $studentId, $row, $actorUserId, $row['school_id']);
        return $row;
    }

    public static function moveTimetableBreak(string $sectionId, string $breakKey, int $afterPeriod, ?string $actorUserId = null): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            UPDATE timetable_breaks
            SET after_period = ?, updated_by = ?, updated_at = NOW()
            WHERE section_id = ? AND break_key = ?
        ");
        $stmt->execute([$afterPeriod, $actorUserId, $sectionId, $breakKey]);

        $stmtRow = $pdo->prepare("SELECT school_id, class_id, section_id, break_key, label, after_period, tone FROM timetable_breaks WHERE section_id = ? AND break_key = ?");
        $stmtRow->execute([$sectionId, $breakKey]);
        $row = $stmtRow->fetch();
        if (!$row) {
            throw new \OutOfBoundsException("Break not found");
        }

        AuditService::writeAudit('timetable.break_moved', 'timetable_break', $breakKey, $row, $actorUserId, $row['school_id']);
        return $row;
    }

    private static function updateTravelStatus(string $studentId, string $status, string $event, ?string $actorUserId, ?string $attendanceStatus = null, bool $sms = false): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            INSERT INTO student_travel_status (student_id, school_id, status, attendance_status, last_event, last_event_at, updated_by)
            SELECT id, school_id, ?, COALESCE(?, 'pending'), ?, NOW(), ?
            FROM students WHERE id = ?
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                attendance_status = COALESCE(VALUES(attendance_status), attendance_status),
                last_event = VALUES(last_event),
                last_event_at = NOW(),
                updated_by = VALUES(updated_by)
        ");
        $stmt->execute([$status, $attendanceStatus, $event, $actorUserId, $studentId]);

        $stmtInfo = $pdo->prepare("
            SELECT s.school_id, s.id AS student_id, sts.status, sts.attendance_status, sts.last_event, sts.last_event_at,
                   s.full_name, p.phone AS parent_phone, (p.sms_enabled = 1) AS sms_enabled
            FROM students s
            LEFT JOIN parents p ON p.id = s.parent_id
            LEFT JOIN student_travel_status sts ON sts.student_id = s.id
            WHERE s.id = ?
        ");
        $stmtInfo->execute([$studentId]);
        $row = $stmtInfo->fetch();
        if (!$row) {
            throw new \OutOfBoundsException("Student travel record not found");
        }

        $row['sms_enabled'] = (bool)$row['sms_enabled'];
        $row['event'] = $event;

        AuditService::writeAudit("travel.{$event}", 'student', $studentId, $row, $actorUserId, $row['school_id']);

        if ($sms && $row['sms_enabled'] && !empty($row['parent_phone'])) {
            $body = "SafeReach: {$row['full_name']} status updated to " . str_replace('_', ' ', $status) . ".";
            $smsResult = SmsService::sendParentSms($row['parent_phone'], $body);
            
            $pdo->prepare("INSERT INTO sms_delivery_logs (id, school_id, student_id, to_phone, body, provider_message_id, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                ->execute([self::uuid(), $row['school_id'], $studentId, $row['parent_phone'], $body, $smsResult['sid'] ?? null, $smsResult['status'] ?? 'unknown', $smsResult['reason'] ?? null]);
        }

        return $row;
    }

    private static function buildTimetable(\PDO $pdo, ?string $schoolId): array {
        $stmtSec = $pdo->query("
            SELECT c.id AS class_id, sec.id AS section_id, c.name AS class_name, sec.name AS section_name
            FROM teacher_assignments ta
            JOIN teachers t ON t.id = ta.teacher_id
            JOIN users u ON u.id = t.user_id
            JOIN classes c ON c.id = ta.class_id
            JOIN sections sec ON sec.id = ta.section_id
            WHERE ta.active = TRUE
            ORDER BY (u.full_name = 'Sarah Jenkins') DESC, c.sort_order, sec.name
            LIMIT 1
        ");
        $section = $stmtSec->fetch();

        if (!$section) {
            return [
                'className' => 'Class 4',
                'section'   => 'A',
                'breaks'    => [],
                'days'      => [],
            ];
        }

        $classId = $section['class_id'];
        $secId = $section['section_id'];

        $stmtBreaks = $pdo->prepare("SELECT break_key AS id, label, after_period AS afterPeriod, tone FROM timetable_breaks WHERE class_id = ? AND section_id = ? ORDER BY after_period");
        $stmtBreaks->execute([$classId, $secId]);
        $breaks = $stmtBreaks->fetchAll();

        $stmtPeriods = $pdo->prepare("SELECT day_name, period_no, subject FROM timetable_periods WHERE class_id = ? AND section_id = ? ORDER BY period_no");
        $stmtPeriods->execute([$classId, $secId]);
        $periodsRaw = $stmtPeriods->fetchAll();

        $daysMap = [];
        foreach (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as $day) {
            $daysMap[$day] = [];
        }
        foreach ($periodsRaw as $p) {
            $daysMap[$p['day_name']][] = $p['subject'];
        }

        $days = [];
        foreach ($daysMap as $dayName => $pList) {
            $days[] = [
                'id'      => strtolower($dayName),
                'label'   => $dayName,
                'periods' => $pList,
            ];
        }

        return [
            'className' => $section['class_name'],
            'section'   => $section['section_name'],
            'breaks'    => $breaks,
            'days'      => $days,
        ];
    }

    // ==========================================
    // Super Admin: School Onboarding & Requests
    // ==========================================

    public static function listSchoolRequests(): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT id, school_name, requester_name, requester_email, requester_phone, address, status, decision_reason, created_at FROM school_registration_requests ORDER BY created_at DESC");
        return $stmt->fetchAll();
    }

    public static function reviewSchoolRequest(string $requestId, string $decision, ?string $reason = null, ?string $actorUserId = null): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM school_registration_requests WHERE id = ?");
        $stmt->execute([$requestId]);
        $req = $stmt->fetch();
        if (!$req) {
            throw new \OutOfBoundsException("Registration request not found");
        }

        if ($decision === 'approved' || $decision === 'accepted') {
            $schoolId = self::uuid();
            $schoolCode = 'SAFE-' . strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $req['school_name']), 0, 8)) . '-' . rand(10, 99);
            
            // 1. Create School
            $pdo->prepare("
                INSERT INTO schools (id, name, code, address, phone, email, status, school_open_time, school_close_time)
                VALUES (?, ?, ?, ?, ?, ?, 'active', '08:00:00', '16:30:00')
            ")->execute([$schoolId, $req['school_name'], $schoolCode, $req['address'] ?? 'Campus Address', $req['requester_phone'] ?? '+910000000000', $req['requester_email']]);

            // 2. Resolve Role
            $roleStmt = $pdo->query("SELECT id FROM roles WHERE role_key = 'school_admin' LIMIT 1");
            $roleId = $roleStmt->fetchColumn();

            // 3. Create Admin User
            $adminUserId = self::uuid();
            $pdo->prepare("
                INSERT INTO users (id, school_id, role_id, full_name, email, phone, password_hash, status, terms_accepted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
            ")->execute([$adminUserId, $schoolId, $roleId, $req['requester_name'], $req['requester_email'], $req['requester_phone'], $req['password_hash']]);

            // 4. Update request status
            $pdo->prepare("UPDATE school_registration_requests SET status = 'approved', decision_reason = ?, decided_by = ?, decided_at = NOW() WHERE id = ?")
                ->execute([$reason ?: 'Approved by Super Admin', $actorUserId, $requestId]);

            AuditService::writeAudit('school.request_approved', 'school_registration_requests', $requestId, ['schoolId' => $schoolId, 'schoolName' => $req['school_name']], $actorUserId, $schoolId);

            return [
                'ok'        => true,
                'status'    => 'approved',
                'schoolId'  => $schoolId,
                'schoolCode'=> $schoolCode,
                'message'   => "School '{$req['school_name']}' successfully onboarded and activated.",
            ];
        } else {
            $pdo->prepare("UPDATE school_registration_requests SET status = 'rejected', decision_reason = ?, decided_by = ?, decided_at = NOW() WHERE id = ?")
                ->execute([$reason ?: 'Declined by Super Admin', $actorUserId, $requestId]);

            AuditService::writeAudit('school.request_rejected', 'school_registration_requests', $requestId, ['reason' => $reason], $actorUserId, null);

            return [
                'ok'      => true,
                'status'  => 'rejected',
                'message' => "School registration request has been declined.",
            ];
        }
    }

    public static function createSchool(array $payload, ?string $actorUserId = null): array {
        $pdo = Database::getConnection();
        $name = trim($payload['name'] ?? '');
        if (empty($name)) {
            throw new \InvalidArgumentException("School name is required");
        }

        $schoolId = self::uuid();
        $code = trim($payload['code'] ?? '') ?: ('SAFE-' . strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $name), 0, 8)) . '-' . rand(10, 99));
        $phone = $payload['phone'] ?? '+910000000000';
        $email = $payload['email'] ?? 'admin@' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name)) . '.edu';

        $pdo->prepare("
            INSERT INTO schools (id, name, code, address, city, state, country, phone, email, status, school_open_time, school_close_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        ")->execute([
            $schoolId,
            $name,
            $code,
            $payload['address'] ?? 'Campus Road',
            $payload['city'] ?? 'Chennai',
            $payload['state'] ?? 'Tamil Nadu',
            $payload['country'] ?? 'India',
            $phone,
            $email,
            $payload['schoolOpenTime'] ?? '08:00:00',
            $payload['schoolCloseTime'] ?? '16:30:00',
        ]);

        AuditService::writeAudit('school.created', 'school', $schoolId, ['name' => $name, 'code' => $code], $actorUserId, $schoolId);

        return self::schoolSettings($schoolId);
    }

    // ==========================================
    // School Admin: Classes & Sections
    // ==========================================

    public static function createClass(array $payload, ?string $actorUserId = null, ?string $schoolId = null): array {
        $pdo = Database::getConnection();
        $sId = self::resolveSchoolId($pdo, $schoolId);
        $name = trim($payload['name'] ?? '');
        $sectionName = trim($payload['sectionName'] ?? 'A');
        $room = trim($payload['room'] ?? "Room {$name}{$sectionName}");

        if (empty($name)) {
            throw new \InvalidArgumentException("Class name is required (e.g. Class 5)");
        }

        $stmtCheck = $pdo->prepare("SELECT id FROM classes WHERE school_id = ? AND name = ?");
        $stmtCheck->execute([$sId, $name]);
        $classId = $stmtCheck->fetchColumn();

        if (!$classId) {
            $classId = self::uuid();
            $sortOrder = (int)preg_replace('/[^0-9]/', '', $name) ?: 1;
            $pdo->prepare("INSERT INTO classes (id, school_id, name, sort_order) VALUES (?, ?, ?, ?)")
                ->execute([$classId, $sId, $name, $sortOrder]);
        }

        $stmtSec = $pdo->prepare("SELECT id FROM sections WHERE class_id = ? AND name = ?");
        $stmtSec->execute([$classId, $sectionName]);
        $sectionId = $stmtSec->fetchColumn();

        if (!$sectionId) {
            $sectionId = self::uuid();
            $pdo->prepare("INSERT INTO sections (id, school_id, class_id, name, room) VALUES (?, ?, ?, ?, ?)")
                ->execute([$sectionId, $sId, $classId, $sectionName, $room]);
        }

        AuditService::writeAudit('class.created', 'class', $classId, ['className' => $name, 'section' => $sectionName], $actorUserId, $sId);

        return [
            'ok'        => true,
            'classId'   => $classId,
            'sectionId' => $sectionId,
            'className' => $name,
            'section'   => $sectionName,
            'room'      => $room,
        ];
    }

    // ==========================================
    // School Admin: Staff & Incharge Assignment
    // ==========================================

    public static function createTeacher(array $payload, ?string $actorUserId = null, ?string $schoolId = null): array {
        $pdo = Database::getConnection();
        $sId = self::resolveSchoolId($pdo, $schoolId);

        $fullName = trim($payload['fullName'] ?? '');
        $email = trim($payload['email'] ?? '');
        $phone = trim($payload['phone'] ?? '+910000000000');
        $subject = trim($payload['subject'] ?? 'General');
        $qualification = trim($payload['qualification'] ?? 'B.Ed');
        $password = $payload['password'] ?? 'Teacher@2025';

        if (empty($fullName) || empty($email)) {
            throw new \InvalidArgumentException("Teacher name and email are required");
        }

        $roleStmt = $pdo->query("SELECT id FROM roles WHERE role_key = 'teacher' LIMIT 1");
        $roleId = $roleStmt->fetchColumn();

        $userId = self::uuid();
        $hash = Security::hashPassword($password);
        $pdo->prepare("
            INSERT INTO users (id, school_id, role_id, full_name, email, phone, password_hash, status, terms_accepted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
            ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), phone=VALUES(phone), status='active'
        ")->execute([$userId, $sId, $roleId, $fullName, $email, $phone, $hash]);

        $teacherId = self::uuid();
        $empCode = trim($payload['employeeCode'] ?? ('T-' . rand(10, 99) . 'P'));
        $pdo->prepare("
            INSERT INTO teachers (id, school_id, user_id, employee_code, subject, qualification, status)
            VALUES (?, ?, ?, ?, ?, ?, 'available')
            ON DUPLICATE KEY UPDATE employee_code=VALUES(employee_code), subject=VALUES(subject), status='available'
        ")->execute([$teacherId, $sId, $userId, $empCode, $subject, $qualification]);

        // Optional initial assignment
        if (!empty($payload['className']) && !empty($payload['sectionName'])) {
            self::assignTeacherToClass($pdo, $sId, $teacherId, $payload['className'], $payload['sectionName'], $payload['assignmentType'] ?? 'primary_incharge', $subject);
        }

        AuditService::writeAudit('teacher.created', 'teacher', $teacherId, ['name' => $fullName, 'email' => $email], $actorUserId, $sId);

        return [
            'ok'        => true,
            'teacherId' => $teacherId,
            'userId'    => $userId,
            'fullName'  => $fullName,
            'email'     => $email,
            'employeeCode' => $empCode,
        ];
    }

    public static function assignTeacherToClass(\PDO $pdo, string $schoolId, string $teacherId, string $className, string $sectionName, string $type, string $subject): void {
        $stmtC = $pdo->prepare("SELECT id FROM classes WHERE school_id = ? AND name = ?");
        $stmtC->execute([$schoolId, $className]);
        $classId = $stmtC->fetchColumn();
        if (!$classId) return;

        $stmtS = $pdo->prepare("SELECT id FROM sections WHERE class_id = ? AND name = ?");
        $stmtS->execute([$classId, $sectionName]);
        $sectionId = $stmtS->fetchColumn();
        if (!$sectionId) return;

        $pdo->prepare("
            INSERT INTO teacher_assignments (id, school_id, teacher_id, class_id, section_id, assignment_type, subject, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE assignment_type=VALUES(assignment_type), subject=VALUES(subject), active=TRUE
        ")->execute([self::uuid(), $schoolId, $teacherId, $classId, $sectionId, $type, $subject]);
    }

    // ==========================================
    // Student Lifecycle & Parent Provisioning
    // ==========================================

    public static function createStudent(array $payload, ?string $actorUserId = null, ?string $schoolId = null): array {
        $pdo = Database::getConnection();
        $sId = self::resolveSchoolId($pdo, $schoolId);

        $fullName = trim($payload['fullName'] ?? '');
        $rollNo = trim($payload['rollNo'] ?? '01');
        $className = trim($payload['className'] ?? 'Class 4');
        $sectionName = trim($payload['sectionName'] ?? 'A');
        $guardianName = trim($payload['guardianName'] ?? 'Parent / Guardian');
        $parentPhone = trim($payload['parentPhone'] ?? '+91 98765 00000');
        $parentEmail = strtolower(trim($payload['parentEmail'] ?? ''));
        $gender = trim($payload['gender'] ?? 'Not Specified');
        $dob = !empty($payload['dob']) ? trim($payload['dob']) : null;
        $emergencyNotes = trim($payload['emergencyNotes'] ?? '');
        $sendEmailInvite = isset($payload['sendEmailInvite']) ? (bool)$payload['sendEmailInvite'] : true;

        if (empty($fullName)) {
            throw new \InvalidArgumentException("Student full name is required");
        }

        // Get School Name for email
        $stmtSc = $pdo->prepare("SELECT name FROM schools WHERE id = ?");
        $stmtSc->execute([$sId]);
        $schoolName = $stmtSc->fetchColumn() ?: 'SafeReach School';

        // 1. Resolve Class and Section
        $stmtC = $pdo->prepare("SELECT id FROM classes WHERE school_id = ? AND name = ?");
        $stmtC->execute([$sId, $className]);
        $classId = $stmtC->fetchColumn();
        if (!$classId) {
            $classId = self::uuid();
            $sort = (int)preg_replace('/[^0-9]/', '', $className) ?: 1;
            $pdo->prepare("INSERT INTO classes (id, school_id, name, sort_order) VALUES (?, ?, ?, ?)")->execute([$classId, $sId, $className, $sort]);
        }

        $stmtS = $pdo->prepare("SELECT id FROM sections WHERE class_id = ? AND name = ?");
        $stmtS->execute([$classId, $sectionName]);
        $sectionId = $stmtS->fetchColumn();
        if (!$sectionId) {
            $sectionId = self::uuid();
            $pdo->prepare("INSERT INTO sections (id, school_id, class_id, name, room) VALUES (?, ?, ?, ?, ?)")->execute([$sectionId, $sId, $classId, $sectionName, "Room {$className}"]);
        }

        // 2. Resolve or Create Parent & User Account
        $existingParent = null;
        $parentUserId = null;
        $isExistingParent = false;
        $initialPassword = 'Parent@2025';

        if (!empty($parentEmail)) {
            // Check if user account already exists with this email
            $stmtUser = $pdo->prepare("SELECT u.id, u.full_name, p.id AS parent_id FROM users u LEFT JOIN parents p ON p.user_id = u.id WHERE LOWER(u.email) = ? LIMIT 1");
            $stmtUser->execute([$parentEmail]);
            $existingParent = $stmtUser->fetch();
        }

        if (!$existingParent && !empty($parentPhone)) {
            // Check by phone number in parents table
            $stmtParentPhone = $pdo->prepare("SELECT p.id AS parent_id, p.user_id, p.guardian_name FROM parents p WHERE p.school_id = ? AND p.phone = ? LIMIT 1");
            $stmtParentPhone->execute([$sId, $parentPhone]);
            $existingParent = $stmtParentPhone->fetch();
        }

        if ($existingParent && !empty($existingParent['parent_id'])) {
            $parentId = $existingParent['parent_id'];
            $parentUserId = $existingParent['user_id'] ?? null;
            $isExistingParent = true;
        } else {
            // Create New Parent
            $parentId = self::uuid();
            if (!empty($parentEmail)) {
                $roleStmt = $pdo->query("SELECT id FROM roles WHERE role_key = 'parent' LIMIT 1");
                $pRoleId = $roleStmt->fetchColumn() ?: 'r-parent';
                $parentUserId = self::uuid();
                $pHash = Security::hashPassword($initialPassword);
                $pdo->prepare("INSERT INTO users (id, school_id, role_id, full_name, email, phone, password_hash, status, terms_accepted_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())")
                    ->execute([$parentUserId, $sId, $pRoleId, $guardianName, $parentEmail, $parentPhone, $pHash]);
            }

            $pdo->prepare("INSERT INTO parents (id, school_id, user_id, guardian_name, phone, sms_enabled) VALUES (?, ?, ?, ?, ?, TRUE)")
                ->execute([$parentId, $sId, $parentUserId, $guardianName, $parentPhone]);
        }

        // 3. Create Student
        $studentId = self::uuid();
        $baseCode = sprintf("SAFE-%s%s-%02d", preg_replace('/[^0-9]/', '', $className) ?: '0', $sectionName, (int)$rollNo);
        $studentCode = $baseCode;
        $seq = 1;
        while (true) {
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM students WHERE student_code = ?");
            $stmtCheck->execute([$studentCode]);
            if ((int)$stmtCheck->fetchColumn() === 0) {
                break;
            }
            $studentCode = sprintf("%s-%02d", $baseCode, $seq++);
        }
        
        $pdo->prepare("
            INSERT INTO students (id, school_id, class_id, section_id, parent_id, student_code, full_name, roll_no, gender, date_of_birth, status, emergency_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        ")->execute([$studentId, $sId, $classId, $sectionId, $parentId, $studentCode, $fullName, $rollNo, $gender, $dob, $emergencyNotes]);

        // 4. Initialize Travel Status
        $pdo->prepare("INSERT INTO student_travel_status (student_id, school_id, status, attendance_status, last_event, last_event_at) VALUES (?, ?, 'at_home', 'pending', 'enrolled', NOW())")
            ->execute([$studentId, $sId]);

        // 5. Dispatch Parent Email
        $emailReceipt = null;
        if ($sendEmailInvite && !empty($parentEmail)) {
            if ($isExistingParent) {
                $emailReceipt = EmailService::sendSiblingLinkedEmail([
                    'schoolId'      => $sId,
                    'studentId'     => $studentId,
                    'parentUserId'  => $parentUserId,
                    'recipientEmail'=> $parentEmail,
                    'guardianName'  => $guardianName,
                    'studentName'   => $fullName,
                    'studentCode'   => $studentCode,
                    'className'     => $className,
                    'sectionName'   => $sectionName,
                    'schoolName'    => $schoolName,
                ]);
            } else {
                $emailReceipt = EmailService::sendParentWelcomeEmail([
                    'schoolId'      => $sId,
                    'studentId'     => $studentId,
                    'parentUserId'  => $parentUserId,
                    'recipientEmail'=> $parentEmail,
                    'guardianName'  => $guardianName,
                    'studentName'   => $fullName,
                    'studentCode'   => $studentCode,
                    'className'     => $className,
                    'sectionName'   => $sectionName,
                    'password'      => $initialPassword,
                    'schoolName'    => $schoolName,
                ]);
            }
        }

        AuditService::writeAudit('student.enrolled', 'student', $studentId, ['name' => $fullName, 'code' => $studentCode, 'class' => $className, 'parentEmail' => $parentEmail], $actorUserId, $sId);

        return [
            'ok'               => true,
            'studentId'        => $studentId,
            'studentCode'      => $studentCode,
            'fullName'         => $fullName,
            'className'        => $className,
            'sectionName'      => $sectionName,
            'rollNo'           => $rollNo,
            'guardianName'     => $guardianName,
            'parentEmail'      => $parentEmail,
            'isExistingParent' => $isExistingParent,
            'parentCredentials'=> [
                'email'    => $parentEmail,
                'password' => $isExistingParent ? '(Existing Password)' : $initialPassword,
            ],
            'emailDelivery'    => $emailReceipt,
        ];
    }

    public static function updateStudent(string $studentId, array $payload, ?string $actorUserId = null, ?string $schoolId = null): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT s.*, p.id AS parent_id, p.user_id AS parent_user_id, p.guardian_name, p.phone AS parent_phone, u.email AS parent_email
            FROM students s
            LEFT JOIN parents p ON p.id = s.parent_id
            LEFT JOIN users u ON u.id = p.user_id
            WHERE s.id = ?
        ");
        $stmt->execute([$studentId]);
        $st = $stmt->fetch();
        if (!$st) {
            throw new \OutOfBoundsException("Student not found");
        }

        $sId = $st['school_id'];
        $fullName = isset($payload['fullName']) ? trim($payload['fullName']) : $st['full_name'];
        $rollNo = isset($payload['rollNo']) ? trim($payload['rollNo']) : $st['roll_no'];
        $gender = isset($payload['gender']) ? trim($payload['gender']) : $st['gender'];
        $dob = isset($payload['dob']) ? trim($payload['dob']) : $st['date_of_birth'];
        $emergencyNotes = isset($payload['emergencyNotes']) ? trim($payload['emergencyNotes']) : $st['emergency_notes'];
        $guardianName = isset($payload['guardianName']) ? trim($payload['guardianName']) : $st['guardian_name'];
        $parentPhone = isset($payload['parentPhone']) ? trim($payload['parentPhone']) : $st['parent_phone'];
        $parentEmail = isset($payload['parentEmail']) ? strtolower(trim($payload['parentEmail'])) : $st['parent_email'];
        $smsEnabled = isset($payload['smsEnabled']) ? (bool)$payload['smsEnabled'] : true;

        // 1. Resolve Class/Section if changed
        $classId = $st['class_id'];
        $sectionId = $st['section_id'];
        if (!empty($payload['className'])) {
            $className = trim($payload['className']);
            $stmtC = $pdo->prepare("SELECT id FROM classes WHERE school_id = ? AND name = ?");
            $stmtC->execute([$sId, $className]);
            $cId = $stmtC->fetchColumn();
            if (!$cId) {
                $cId = self::uuid();
                $sort = (int)preg_replace('/[^0-9]/', '', $className) ?: 1;
                $pdo->prepare("INSERT INTO classes (id, school_id, name, sort_order) VALUES (?, ?, ?, ?)")->execute([$cId, $sId, $className, $sort]);
            }
            $classId = $cId;
        }

        if (!empty($payload['sectionName'])) {
            $sectionName = trim($payload['sectionName']);
            $stmtS = $pdo->prepare("SELECT id FROM sections WHERE class_id = ? AND name = ?");
            $stmtS->execute([$classId, $sectionName]);
            $sSecId = $stmtS->fetchColumn();
            if (!$sSecId) {
                $sSecId = self::uuid();
                $pdo->prepare("INSERT INTO sections (id, school_id, class_id, name, room) VALUES (?, ?, ?, ?, ?)")->execute([$sSecId, $sId, $classId, $sectionName, "Room {$sectionName}"]);
            }
            $sectionId = $sSecId;
        }

        // 2. Update Student Record
        $pdo->prepare("
            UPDATE students
            SET full_name = ?, roll_no = ?, gender = ?, date_of_birth = ?, emergency_notes = ?, class_id = ?, section_id = ?, updated_at = NOW()
            WHERE id = ?
        ")->execute([$fullName, $rollNo, $gender, $dob, $emergencyNotes, $classId, $sectionId, $studentId]);

        // 3. Update Parent & Linked User Record
        if ($st['parent_id']) {
            $pdo->prepare("
                UPDATE parents
                SET guardian_name = ?, phone = ?, sms_enabled = ?, updated_at = NOW()
                WHERE id = ?
            ")->execute([$guardianName, $parentPhone, $smsEnabled ? 1 : 0, $st['parent_id']]);

            if ($st['parent_user_id']) {
                $pdo->prepare("
                    UPDATE users
                    SET full_name = ?, email = ?, phone = ?, updated_at = NOW()
                    WHERE id = ?
                ")->execute([$guardianName, $parentEmail, $parentPhone, $st['parent_user_id']]);
            }
        }

        AuditService::writeAudit('student.updated', 'student', $studentId, ['fullName' => $fullName, 'rollNo' => $rollNo, 'guardianName' => $guardianName], $actorUserId, $sId);

        return [
            'ok'        => true,
            'studentId' => $studentId,
            'fullName'  => $fullName,
            'message'   => "Student {$fullName} updated successfully",
        ];
    }

    public static function deleteStudent(string $studentId, ?string $actorUserId = null): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id, school_id, full_name, student_code FROM students WHERE id = ?");
        $stmt->execute([$studentId]);
        $st = $stmt->fetch();
        if (!$st) {
            throw new \OutOfBoundsException("Student not found");
        }

        $pdo->prepare("DELETE FROM students WHERE id = ?")->execute([$studentId]);
        AuditService::writeAudit('student.deleted', 'student', $studentId, ['name' => $st['full_name'], 'code' => $st['student_code']], $actorUserId, $st['school_id']);

        return [
            'ok'        => true,
            'studentId' => $studentId,
            'message'   => "Student {$st['full_name']} removed successfully",
        ];
    }

    public static function bulkUploadStudents(array $rows, ?string $actorUserId = null, ?string $schoolId = null): array {
        if (empty($rows)) {
            throw new \InvalidArgumentException("No student rows provided for bulk upload");
        }

        $enrolled = [];
        $errors = [];

        foreach ($rows as $idx => $row) {
            try {
                $payload = [
                    'fullName'        => $row['fullName'] ?? $row['student_name'] ?? $row['name'] ?? '',
                    'rollNo'          => $row['rollNo'] ?? $row['roll_no'] ?? sprintf('%02d', $idx + 1),
                    'className'       => $row['className'] ?? $row['class_name'] ?? $row['grade'] ?? 'Class 4',
                    'sectionName'     => $row['sectionName'] ?? $row['section'] ?? 'A',
                    'gender'          => $row['gender'] ?? 'Not Specified',
                    'guardianName'    => $row['guardianName'] ?? $row['guardian_name'] ?? $row['parent_name'] ?? 'Parent / Guardian',
                    'parentPhone'     => $row['parentPhone'] ?? $row['parent_phone'] ?? $row['guardian_phone'] ?? '+91 98765 00000',
                    'parentEmail'     => $row['parentEmail'] ?? $row['parent_email'] ?? $row['guardian_email'] ?? '',
                    'emergencyNotes'  => $row['emergencyNotes'] ?? $row['emergency_notes'] ?? $row['notes'] ?? '',
                    'sendEmailInvite' => true,
                ];

                if (empty($payload['fullName'])) {
                    continue;
                }

                $res = self::createStudent($payload, $actorUserId, $schoolId);
                $enrolled[] = $res;
            } catch (\Exception $e) {
                $errors[] = [
                    'row'   => $idx + 1,
                    'name'  => $row['fullName'] ?? $row['student_name'] ?? "Row {$idx}",
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'ok'            => true,
            'totalProcessed'=> count($rows),
            'totalEnrolled' => count($enrolled),
            'totalFailed'   => count($errors),
            'enrolled'      => $enrolled,
            'errors'        => $errors,
        ];
    }

    public static function resendParentInvite(string $studentId, ?string $actorUserId = null): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT s.id, s.school_id, s.full_name, s.student_code, c.name AS class_name, sec.name AS section_name,
                   sc.name AS school_name,
                   p.guardian_name, p.user_id AS parent_user_id, u.email AS parent_email
            FROM students s
            JOIN schools sc ON sc.id = s.school_id
            JOIN classes c ON c.id = s.class_id
            JOIN sections sec ON sec.id = s.section_id
            LEFT JOIN parents p ON p.id = s.parent_id
            LEFT JOIN users u ON u.id = p.user_id
            WHERE s.id = ?
        ");
        $stmt->execute([$studentId]);
        $st = $stmt->fetch();
        if (!$st) {
            throw new \OutOfBoundsException("Student not found");
        }

        if (empty($st['parent_email'])) {
            throw new \InvalidArgumentException("No parent email associated with this student.");
        }

        $receipt = EmailService::sendParentWelcomeEmail([
            'schoolId'      => $st['school_id'],
            'studentId'     => $st['id'],
            'parentUserId'  => $st['parent_user_id'],
            'recipientEmail'=> $st['parent_email'],
            'guardianName'  => $st['guardian_name'] ?: 'Parent / Guardian',
            'studentName'   => $st['full_name'],
            'studentCode'   => $st['student_code'],
            'className'     => $st['class_name'],
            'sectionName'   => $st['section_name'],
            'password'      => 'Parent@2025',
            'schoolName'    => $st['school_name'] ?: 'SafeReach School',
        ]);

        AuditService::writeAudit('parent.invite_resent', 'student', $studentId, ['recipientEmail' => $st['parent_email']], $actorUserId, $st['school_id']);

        return [
            'ok'             => true,
            'studentId'      => $studentId,
            'studentName'    => $st['full_name'],
            'recipientEmail' => $st['parent_email'],
            'emailDelivery'  => $receipt,
            'message'        => "Invitation email dispatched to {$st['parent_email']}",
        ];
    }

    public static function promoteStudent(string $studentId, string $targetClassName, string $targetSectionName, ?string $actorUserId = null): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT s.id, s.school_id, s.full_name FROM students s WHERE s.id = ?");
        $stmt->execute([$studentId]);
        $st = $stmt->fetch();
        if (!$st) {
            throw new \OutOfBoundsException("Student not found");
        }

        $sId = $st['school_id'];
        $stmtC = $pdo->prepare("SELECT id FROM classes WHERE school_id = ? AND name = ?");
        $stmtC->execute([$sId, $targetClassName]);
        $classId = $stmtC->fetchColumn();
        if (!$classId) {
            $classId = self::uuid();
            $sort = (int)preg_replace('/[^0-9]/', '', $targetClassName) ?: 1;
            $pdo->prepare("INSERT INTO classes (id, school_id, name, sort_order) VALUES (?, ?, ?, ?)")->execute([$classId, $sId, $targetClassName, $sort]);
        }

        $stmtS = $pdo->prepare("SELECT id FROM sections WHERE class_id = ? AND name = ?");
        $stmtS->execute([$classId, $targetSectionName]);
        $sectionId = $stmtS->fetchColumn();
        if (!$sectionId) {
            $sectionId = self::uuid();
            $pdo->prepare("INSERT INTO sections (id, school_id, class_id, name, room) VALUES (?, ?, ?, ?, ?)")->execute([$sectionId, $sId, $classId, $targetSectionName, "Room {$targetClassName}"]);
        }

        $pdo->prepare("UPDATE students SET class_id = ?, section_id = ?, updated_at = NOW() WHERE id = ?")
            ->execute([$classId, $sectionId, $studentId]);

        AuditService::writeAudit('student.promoted', 'student', $studentId, ['targetClass' => $targetClassName, 'targetSection' => $targetSectionName], $actorUserId, $sId);

        return [
            'ok'        => true,
            'studentId' => $studentId,
            'className' => $targetClassName,
            'sectionName'=> $targetSectionName,
            'message'   => "Student {$st['full_name']} promoted to {$targetClassName}-{$targetSectionName}",
        ];
    }

    private static function resolveSchoolId(\PDO $pdo, ?string $schoolId): string {
        if (!empty($schoolId)) return $schoolId;
        $stmt = $pdo->query("SELECT id FROM schools LIMIT 1");
        $id = $stmt->fetchColumn();
        return $id ?: 'default-school';
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}

