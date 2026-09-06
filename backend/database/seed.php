<?php

require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Security.php';

use SafeReach\Config;
use SafeReach\Database;
use SafeReach\Security;

function uuid(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function runSeed() {
    $pdo = Database::getConnection();
    echo "Seeding SafeReach MySQL database...\n";

    $mainPassword = getenv('SEED_MAIN_ADMIN_PASSWORD') ?: 'MainAdmin@2025';
    $adminPassword = getenv('SEED_ADMIN_PASSWORD') ?: 'Admin@2025';
    $teacherPassword = getenv('SEED_TEACHER_PASSWORD') ?: 'Teacher@2025';
    $parentPassword = getenv('SEED_PARENT_PASSWORD') ?: 'Parent@2025';
    $phone = getenv('TWILIO_TEST_TO_PHONE') ?: '+910000000000';

    // 1. Roles
    $roles = [
        ['main_admin', 'Main Admin', 'SafeReach Main Admin access'],
        ['school_admin', 'School Administrator', 'SafeReach School Administrator access'],
        ['teacher', 'Class Incharge', 'SafeReach Class Incharge access'],
        ['assistant_incharge', 'Assistant Incharge', 'SafeReach Assistant Incharge access'],
        ['parent', 'Parent / Guardian', 'SafeReach Parent / Guardian access'],
    ];
    $roleIds = [];
    $stmtRole = $pdo->prepare("SELECT id FROM roles WHERE role_key = ?");
    $stmtRoleIns = $pdo->prepare("INSERT INTO roles (id, role_key, name, description) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description)");
    foreach ($roles as [$key, $name, $desc]) {
        $stmtRole->execute([$key]);
        $existingId = $stmtRole->fetchColumn();
        $id = $existingId ?: uuid();
        $stmtRoleIns->execute([$id, $key, $name, $desc]);
        $roleIds[$key] = $existingId ?: $id;
    }

    // 2. Permissions
    $permissions = [
        ["app.main_admin.school.accept", "Accept school registration requests"],
        ["app.main_admin.school.reject", "Reject school registration requests"],
        ["app.admin.student.add", "Add student records"],
        ["app.admin.student.edit", "Edit student records"],
        ["app.admin.student.delete", "Delete student records"],
        ["app.admin.student.move_next_standard", "Move existing student to next standard"],
        ["app.admin.teacher.create", "Create teacher accounts"],
        ["app.admin.teacher.assign_incharge", "Assign primary and assistant incharge"],
        ["app.teacher.student.edit_assigned", "Edit assigned class students"],
        ["app.teacher.attendance.submit", "Submit attendance"],
        ["app.teacher.go_out.submit", "Submit go-out attendance"],
        ["app.teacher.results.enter", "Enter assigned class student results"],
        ["app.admin.results.configure", "Configure result exams and mark limits"],
        ["app.parent.child.ready_to_school", "Mark child ready for school"],
        ["app.parent.child.reached_home", "Confirm child reached home"],
        ["app.timetable.edit", "Edit timetable subjects and break timing"],
        ["app.notification.read", "Read allowed notifications"],
    ];
    $permIds = [];
    $stmtPerm = $pdo->prepare("SELECT id FROM permissions WHERE permission_key = ?");
    $stmtPermIns = $pdo->prepare("INSERT INTO permissions (id, permission_key, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE description=VALUES(description)");
    foreach ($permissions as [$key, $desc]) {
        $stmtPerm->execute([$key]);
        $existingId = $stmtPerm->fetchColumn();
        $id = $existingId ?: uuid();
        $stmtPermIns->execute([$id, $key, $desc]);
        $permIds[$key] = $existingId ?: $id;
    }

    // 3. School
    $stmtSchool = $pdo->prepare("SELECT id FROM schools WHERE code = 'SAFE-ACADEMY-01'");
    $stmtSchool->execute();
    $schoolId = $stmtSchool->fetchColumn();
    if (!$schoolId) {
        $schoolId = uuid();
        $pdo->prepare("INSERT INTO schools (id, name, code, address, city, state, country, phone, email, status, school_open_time, school_close_time) VALUES (?, 'SafeReach Academy', 'SAFE-ACADEMY-01', '12 Knowledge Park', 'Chennai', 'Tamil Nadu', 'India', ?, 'admin@safereach.school', 'active', '08:00:00', '16:30:00')")
            ->execute([$schoolId, $phone]);
    }

    // Helper for users
    $ensureUser = function($schoolId, $roleId, $fullName, $email, $password, $phone) use ($pdo) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $existingId = $stmt->fetchColumn();
        $hash = Security::hashPassword($password);
        if ($existingId) {
            $pdo->prepare("UPDATE users SET school_id = ?, role_id = ?, full_name = ?, phone = ?, password_hash = ? WHERE id = ?")
                ->execute([$schoolId, $roleId, $fullName, $phone, $hash, $existingId]);
            return $existingId;
        }
        $id = uuid();
        $pdo->prepare("INSERT INTO users (id, school_id, role_id, full_name, email, phone, password_hash, status, terms_accepted_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())")
            ->execute([$id, $schoolId, $roleId, $fullName, $email, $phone, $hash]);
        return $id;
    };

    // Platform Main Admin & School Admin
    $ensureUser(null, $roleIds['main_admin'], 'SafeReach Platform Owner', 'main@safereach.local', $mainPassword, $phone);
    $ensureUser(null, $roleIds['main_admin'], 'SafeReach Platform Owner', 'mainadmin@demo.safereach.edu', $mainPassword, $phone);
    $schoolAdminId = $ensureUser($schoolId, $roleIds['school_admin'], 'Priya Raman', 'admin@safereach.school', $adminPassword, $phone);
    $ensureUser($schoolId, $roleIds['school_admin'], 'Priya Raman', 'admin@demo.safereach.edu', $adminPassword, $phone);

    // 4. Class Setup & Teachers
    $classData = [
        [4, "A", "Sarah Jenkins", "James Anderson"],
        [5, "A", "Elena Roy", "David Kumar"],
        [6, "A", "Priya Nair", "Ravi Menon"],
        [7, "A", "Anika Sharma", "Kiran Patel"],
        [8, "A", "Meera Iyer", "Arjun Singh"],
    ];
    $subjects = ["English", "Mathematics", "Science", "Social Studies", "Computer"];
    $days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    $teacherIds = [];
    foreach ($classData as $idx => [$grade, $sec, $primaryName, $assistantName]) {
        foreach ([false => $primaryName, true => $assistantName] as $isAssistant => $name) {
            $email = strtolower(str_replace(' ', '.', $name)) . '@safereach.school';
            $roleKey = $isAssistant ? 'assistant_incharge' : 'teacher';
            $uId = $ensureUser($schoolId, $roleIds[$roleKey], $name, $email, $teacherPassword, $phone);
            
            // Demo account mapping for teacher
            if ($name === 'Sarah Jenkins') {
                $ensureUser($schoolId, $roleIds['teacher'], 'Sarah Jenkins', 'teacher@demo.safereach.edu', $teacherPassword, $phone);
            }

            $empCode = sprintf("T-%02d%s", $idx + 1, $isAssistant ? 'A' : 'P');
            $subject = $subjects[($idx + ($isAssistant ? 1 : 0)) % count($subjects)];

            $stmtT = $pdo->prepare("SELECT id FROM teachers WHERE user_id = ?");
            $stmtT->execute([$uId]);
            $tId = $stmtT->fetchColumn();
            if ($tId) {
                $pdo->prepare("UPDATE teachers SET employee_code = ?, subject = ?, qualification = 'B.Ed / SafeReach Faculty', status = 'available' WHERE id = ?")
                    ->execute([$empCode, $subject, $tId]);
            } else {
                $tId = uuid();
                $pdo->prepare("INSERT INTO teachers (id, school_id, user_id, employee_code, subject, qualification, status) VALUES (?, ?, ?, ?, ?, 'B.Ed / SafeReach Faculty', 'available')")
                    ->execute([$tId, $schoolId, $uId, $empCode, $subject]);
            }
            $teacherIds[$name] = $tId;
        }
    }

    // 5. Parents
    $parentNames = [
        "Sarah Thompson", "Nisha Sharma", "Ravi Patel", "Meena Gupta", "Arun Kumar", "Kavya Iyer",
        "Sanjay Rao", "Lakshmi Nair", "Vikram Singh", "Divya Menon", "Rahul Verma", "Pooja Das",
        "Manoj Shah", "Anita Joshi", "Deepak Kapoor", "Renu Bhat", "Suresh Reddy", "Asha Pillai",
        "Naveen George", "Swathi Krishnan", "Harish Mehta", "Neha Malhotra", "Girish Jain", "Rekha Sethi",
        "Sunil Shetty", "Maya Chandra", "Rajesh Prasad", "Shilpa Bose", "Karthik Rao", "Anjali Thomas",
    ];
    $parentIds = [];
    foreach ($parentNames as $index => $pName) {
        $pEmail = sprintf("parent%02d@safereach.school", $index + 1);
        $pUserId = $ensureUser($schoolId, $roleIds['parent'], $pName, $pEmail, $parentPassword, $phone);
        
        if ($index === 0) {
            $ensureUser($schoolId, $roleIds['parent'], 'Sarah Thompson', 'parent@demo.safereach.edu', $parentPassword, $phone);
        }

        $stmtP = $pdo->prepare("SELECT id FROM parents WHERE user_id = ?");
        $stmtP->execute([$pUserId]);
        $pId = $stmtP->fetchColumn();
        if ($pId) {
            $pdo->prepare("UPDATE parents SET guardian_name = ?, phone = ?, sms_enabled = TRUE WHERE id = ?")
                ->execute([$pName, $phone, $pId]);
        } else {
            $pId = uuid();
            $pdo->prepare("INSERT INTO parents (id, school_id, user_id, guardian_name, phone, sms_enabled) VALUES (?, ?, ?, ?, ?, TRUE)")
                ->execute([$pId, $schoolId, $pUserId, $pName, $phone]);
        }
        $parentIds[$index + 1] = $pId;
    }

    // 6. Classes, Sections, Assignments, Timetables, Exams, Students
    $firstNames = ["Leo", "Maya", "Aarav", "Ananya", "Vihaan", "Diya", "Arjun", "Isha", "Kabir", "Riya", "Aditya", "Meera", "Rohan", "Kavya", "Ishaan", "Nila", "Arnav", "Saanvi", "Vivaan", "Tara"];
    $lastNames = ["Thompson", "Sharma", "Patel", "Gupta", "Kumar", "Iyer", "Rao", "Nair", "Singh", "Menon"];
    $studentNumber = 1;

    foreach ($classData as [$grade, $sectionName, $primaryName, $assistantName]) {
        $className = "Class {$grade}";
        $stmtC = $pdo->prepare("SELECT id FROM classes WHERE school_id = ? AND name = ?");
        $stmtC->execute([$schoolId, $className]);
        $classId = $stmtC->fetchColumn();
        if (!$classId) {
            $classId = uuid();
            $pdo->prepare("INSERT INTO classes (id, school_id, name, sort_order) VALUES (?, ?, ?, ?)")
                ->execute([$classId, $schoolId, $className, $grade]);
        }

        $stmtS = $pdo->prepare("SELECT id FROM sections WHERE class_id = ? AND name = ?");
        $stmtS->execute([$classId, $sectionName]);
        $sectionId = $stmtS->fetchColumn();
        if (!$sectionId) {
            $sectionId = uuid();
            $pdo->prepare("INSERT INTO sections (id, school_id, class_id, name, room) VALUES (?, ?, ?, ?, ?)")
                ->execute([$sectionId, $schoolId, $classId, $sectionName, "Room {$grade}{$sectionName}"]);
        }

        // Assignments
        $primaryTeacherId = $teacherIds[$primaryName];
        $assistantTeacherId = $teacherIds[$assistantName];

        $insAssign = $pdo->prepare("INSERT INTO teacher_assignments (id, school_id, teacher_id, class_id, section_id, assignment_type, subject, active) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)");
        $checkAssign = $pdo->prepare("SELECT id FROM teacher_assignments WHERE school_id = ? AND teacher_id = ? AND class_id = ? AND section_id = ? AND assignment_type = ?");

        foreach ([
            [$primaryTeacherId, 'primary_incharge', $subjects[0]],
            [$assistantTeacherId, 'assistant_incharge', $subjects[1]]
        ] as [$tId, $type, $subj]) {
            $checkAssign->execute([$schoolId, $tId, $classId, $sectionId, $type]);
            if (!$checkAssign->fetchColumn()) {
                $insAssign->execute([uuid(), $schoolId, $tId, $classId, $sectionId, $type, $subj]);
            }
        }

        // Timetable periods
        $stmtPeriod = $pdo->prepare("INSERT INTO timetable_periods (id, school_id, class_id, section_id, day_name, period_no, subject) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE subject=VALUES(subject)");
        foreach ($days as $dayIdx => $day) {
            for ($periodNo = 1; $periodNo <= 8; $periodNo++) {
                $subj = $subjects[($dayIdx + $periodNo - 1) % count($subjects)];
                $stmtPeriod->execute([uuid(), $schoolId, $classId, $sectionId, $day, $periodNo, $subj]);
            }
        }

        // Timetable breaks
        $stmtBreak = $pdo->prepare("INSERT INTO timetable_breaks (id, school_id, class_id, section_id, break_key, label, after_period, tone) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE label=VALUES(label), after_period=VALUES(after_period), tone=VALUES(tone)");
        foreach ([
            ["interval1", "Interval-1", 2, "interval"],
            ["lunch", "Lunch", 4, "lunch"],
            ["interval2", "Interval-2", 6, "interval"]
        ] as [$bKey, $bLabel, $bAfter, $bTone]) {
            $stmtBreak->execute([uuid(), $schoolId, $classId, $sectionId, $bKey, $bLabel, $bAfter, $bTone]);
        }

        // Exam & components
        $stmtExam = $pdo->prepare("SELECT id FROM result_exams WHERE section_id = ? AND name = 'Quarterly'");
        $stmtExam->execute([$sectionId]);
        $examId = $stmtExam->fetchColumn();
        if (!$examId) {
            $examId = uuid();
            $pdo->prepare("INSERT INTO result_exams (id, school_id, class_id, section_id, name, created_by, updated_by) VALUES (?, ?, ?, ?, 'Quarterly', ?, ?)")
                ->execute([$examId, $schoolId, $classId, $sectionId, $schoolAdminId, $schoolAdminId]);
        }

        $componentIds = [];
        $stmtComp = $pdo->prepare("INSERT INTO result_components (id, exam_id, subject, label, maximum_marks, sort_order) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE maximum_marks=VALUES(maximum_marks), sort_order=VALUES(sort_order)");
        foreach ($subjects as $subj) {
            foreach ([["Internal 1", 25, 1], ["Internal 2", 25, 2], ["Exam", 50, 3]] as [$cLabel, $cMax, $cOrder]) {
                $cId = uuid();
                $stmtComp->execute([$cId, $examId, $subj, $cLabel, $cMax, $cOrder]);
                $stmtCompCheck = $pdo->prepare("SELECT id FROM result_components WHERE exam_id = ? AND subject = ? AND label = ?");
                $stmtCompCheck->execute([$examId, $subj, $cLabel]);
                $componentIds[] = [$stmtCompCheck->fetchColumn(), $cMax];
            }
        }

        // 20 Students per class
        for ($rollNo = 1; $rollNo <= 20; $rollNo++) {
            if ($studentNumber === 1) {
                $fullName = "Leo Thompson";
                $pIdx = 1;
            } else if ($studentNumber === 2) {
                $fullName = "Maya Thompson";
                $pIdx = 1;
            } else {
                $fName = $firstNames[($studentNumber - 1) % count($firstNames)];
                $lName = $lastNames[($studentNumber - 1) % count($lastNames)];
                $fullName = "{$fName} {$lName}";
                $pIdx = (($studentNumber - 3) % 29) + 2;
            }
            $studentCode = sprintf("SAFE-%d%s-%02d", $grade, $sectionName, $rollNo);
            $pId = $parentIds[$pIdx] ?? $parentIds[1];

            $stmtSt = $pdo->prepare("SELECT id FROM students WHERE student_code = ?");
            $stmtSt->execute([$studentCode]);
            $studentId = $stmtSt->fetchColumn();
            if (!$studentId) {
                $studentId = uuid();
                $pdo->prepare("INSERT INTO students (id, school_id, class_id, section_id, parent_id, student_code, full_name, roll_no, emergency_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'No critical notes')")
                    ->execute([$studentId, $schoolId, $classId, $sectionId, $pId, $studentCode, $fullName, (string)$rollNo]);
            } else {
                $pdo->prepare("UPDATE students SET full_name = ?, roll_no = ?, parent_id = ? WHERE id = ?")
                    ->execute([$fullName, (string)$rollNo, $pId, $studentId]);
            }

            // Travel Status
            $pdo->prepare("INSERT INTO student_travel_status (student_id, school_id, status, attendance_status, last_event, last_event_at) VALUES (?, ?, 'at_home', 'pending', 'seeded_school_dataset', NOW()) ON DUPLICATE KEY UPDATE status='at_home', attendance_status='pending'")
                ->execute([$studentId, $schoolId]);

            // Sample Attendance for yesterday
            $attStatus = ($rollNo === 20) ? 'absent' : (($rollNo === 19) ? 'late' : 'present');
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            $pdo->prepare("INSERT INTO attendance_records (id, school_id, student_id, class_id, section_id, attendance_date, session, status, reason, marked_by, locked) VALUES (?, ?, ?, ?, ?, ?, 'morning', ?, ?, ?, TRUE) ON DUPLICATE KEY UPDATE status=VALUES(status)")
                ->execute([uuid(), $schoolId, $studentId, $classId, $sectionId, $yesterday, $attStatus, ($attStatus !== 'present' ? 'Seeded attendance history' : null), $schoolAdminId]);

            // Marks for top 3 students
            if ($rollNo <= 3) {
                $stmtMark = $pdo->prepare("INSERT INTO student_result_marks (id, student_id, result_component_id, marks_obtained, entered_by) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained)");
                foreach ($componentIds as [$compKey, $maxMark]) {
                    $score = max(0, $maxMark - (($rollNo + (int)$maxMark) % 6));
                    $stmtMark->execute([uuid(), $studentId, $compKey, $score, $schoolAdminId]);
                }
            }

            $studentNumber++;
        }

        // Safety report per class
        $pdo->prepare("INSERT INTO safety_reports (id, school_id, class_id, section_id, report_title, safety_score, alert_count, attendance_percent, report_text) VALUES (?, ?, ?, ?, ?, 96, 0, 100.00, ?)")
            ->execute([uuid(), $schoolId, $classId, $sectionId, "Class {$grade}{$sectionName} Safety", "Stored safety report for Class {$grade}-{$sectionName}."]);
    }

    // 7. Safety Protocols
    $protocols = [
        'parent' => [
            "Verify pickup person before handover",
            "Keep emergency contact number updated",
            "Confirm absence reason before 9:30 AM",
        ],
        'teacher' => [
            "Morning roll-call synchronized",
            "Dismissal badges prepared",
            "Emergency contact logs synced",
        ],
    ];
    $stmtProto = $pdo->prepare("INSERT INTO safety_protocols (id, school_id, role_key, label, checked, submitted, active) VALUES (?, ?, ?, ?, FALSE, FALSE, TRUE)");
    foreach ($protocols as $roleKey => $items) {
        foreach ($items as $label) {
            $stmtProto->execute([uuid(), $schoolId, $roleKey, $label]);
        }
    }

    // 8. Incident Log & API test result
    $stmtFirstStudent = $pdo->prepare("SELECT id FROM students WHERE student_code = 'SAFE-4A-01'");
    $stmtFirstStudent->execute();
    $firstStId = $stmtFirstStudent->fetchColumn();

    $pdo->prepare("INSERT INTO incident_logs (id, school_id, student_id, incident_code, incident_type, level, priority, status, handler_name, detail) VALUES (?, ?, ?, 'INC-SAFE-001', 'Medical Check', 'Low', 'Normal', 'accepted', 'School Nurse', 'Seeded low-priority health check.') ON DUPLICATE KEY UPDATE status=VALUES(status)")
        ->execute([uuid(), $schoolId, $firstStId]);

    $pdo->prepare("INSERT INTO api_test_results (id, test_name, service_name, status, detail) VALUES (?, 'school_dataset_seed', 'MySQL Database', 'passed', 'Seeded 1 school, 42 users, 5 classes, 100 students, timetables, and quarterly exams.')")
        ->execute([uuid()]);

    echo "✅ SafeReach MySQL database seeded successfully with 100 students, 10 teachers, classes, and master records.\n";
}

if (php_sapi_name() === 'cli' || basename(__FILE__) == basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    runSeed();
}
