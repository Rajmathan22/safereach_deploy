<?php

namespace SafeReach\Services;

use SafeReach\Database;

class AcademicResultService {
    public static function listResults(): array {
        $pdo = Database::getConnection();

        $stmtExams = $pdo->query("
            SELECT re.id, re.school_id, re.class_id, re.section_id, re.name, re.active,
                   c.name AS class_name, sec.name AS section_name
            FROM result_exams re
            JOIN classes c ON c.id = re.class_id
            JOIN sections sec ON sec.id = re.section_id
            ORDER BY c.sort_order, sec.name, re.name
        ");
        $exams = $stmtExams->fetchAll();

        $stmtComp = $pdo->query("
            SELECT rc.id, rc.exam_id, rc.subject, rc.label, rc.maximum_marks, rc.sort_order
            FROM result_components rc
            JOIN result_exams re ON re.id = rc.exam_id
            ORDER BY re.name, rc.subject, rc.sort_order, rc.label
        ");
        $components = $stmtComp->fetchAll();

        $stmtMarks = $pdo->query("
            SELECT srm.student_id, srm.result_component_id, srm.marks_obtained, srm.updated_at
            FROM student_result_marks srm
            ORDER BY srm.updated_at DESC
        ");
        $marks = $stmtMarks->fetchAll();

        return [
            'exams'      => array_map(function($e) { $e['active'] = (bool)$e['active']; return $e; }, $exams),
            'components' => $components,
            'marks'      => $marks,
        ];
    }

    public static function saveExam(array $payload, ?string $actorUserId = null): array {
        $name = trim((string)($payload['name'] ?? ''));
        $classId = trim((string)($payload['classId'] ?? ''));
        $sectionId = trim((string)($payload['sectionId'] ?? ''));
        $components = $payload['components'] ?? [];

        if (empty($name) || empty($classId) || empty($sectionId)) {
            throw new \InvalidArgumentException("Exam name, class, and section are required");
        }
        if (!is_array($components) || empty($components)) {
            throw new \InvalidArgumentException("Add at least one subject mark component");
        }

        $pdo = Database::getConnection();
        $stmtSec = $pdo->prepare("SELECT school_id FROM sections WHERE id = ? AND class_id = ?");
        $stmtSec->execute([$sectionId, $classId]);
        $schoolId = $stmtSec->fetchColumn();
        if (!$schoolId) {
            throw new \OutOfBoundsException("Class section was not found");
        }

        $examId = $payload['examId'] ?? null;
        if (!empty($examId)) {
            $stmtUp = $pdo->prepare("UPDATE result_exams SET name = ?, updated_by = ? WHERE id = ? AND class_id = ? AND section_id = ?");
            $stmtUp->execute([$name, $actorUserId, $examId, $classId, $sectionId]);
        } else {
            $stmtCheck = $pdo->prepare("SELECT id FROM result_exams WHERE section_id = ? AND name = ?");
            $stmtCheck->execute([$sectionId, $name]);
            $existingId = $stmtCheck->fetchColumn();

            if ($existingId) {
                $examId = $existingId;
                $pdo->prepare("UPDATE result_exams SET updated_by = ? WHERE id = ?")->execute([$actorUserId, $examId]);
            } else {
                $examId = self::uuid();
                $pdo->prepare("INSERT INTO result_exams (id, school_id, class_id, section_id, name, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
                    ->execute([$examId, $schoolId, $classId, $sectionId, $name, $actorUserId, $actorUserId]);
            }
        }

        $stmtComp = $pdo->prepare("INSERT INTO result_components (id, exam_id, subject, label, maximum_marks, sort_order) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE maximum_marks = VALUES(maximum_marks), sort_order = VALUES(sort_order)");

        foreach ($components as $idx => $comp) {
            $subject = trim((string)($comp['subject'] ?? ''));
            $label = trim((string)($comp['label'] ?? ''));
            $maxMarks = (float)($comp['maximumMarks'] ?? 0);

            if (empty($subject) || empty($label) || $maxMarks <= 0) {
                throw new \InvalidArgumentException("Each component needs a valid subject, label, and maximum mark > 0");
            }

            $stmtComp->execute([self::uuid(), $examId, $subject, $label, $maxMarks, $idx + 1]);
        }

        AuditService::writeAudit('academic_result.exam_saved', 'result_exam', $examId, [
            'id' => $examId, 'name' => $name, 'class_id' => $classId, 'section_id' => $sectionId
        ], $actorUserId, $schoolId);

        return self::listResults();
    }

    public static function submitMarks(array $payload, ?string $actorUserId = null): array {
        $studentId = trim((string)($payload['studentId'] ?? ''));
        $examId = trim((string)($payload['examId'] ?? ''));
        $marks = $payload['marks'] ?? [];

        if (empty($studentId) || empty($examId)) {
            throw new \InvalidArgumentException("Student and Exam are required");
        }
        if (!is_array($marks) || empty($marks)) {
            throw new \InvalidArgumentException("No marks provided");
        }

        $pdo = Database::getConnection();
        $stmtStudent = $pdo->prepare("SELECT s.id, s.school_id, s.class_id, s.section_id FROM students s WHERE s.id = ?");
        $stmtStudent->execute([$studentId]);
        $student = $stmtStudent->fetch();
        if (!$student) {
            throw new \OutOfBoundsException("Student was not found");
        }

        $stmtSave = $pdo->prepare("INSERT INTO student_result_marks (id, student_id, result_component_id, marks_obtained, entered_by) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), entered_by = VALUES(entered_by)");

        foreach ($marks as $entry) {
            $componentId = trim((string)($entry['componentId'] ?? $entry['result_component_id'] ?? ''));
            $score = (float)($entry['marksObtained'] ?? $entry['marks_obtained'] ?? 0);

            if (!empty($componentId) && $score >= 0) {
                $stmtSave->execute([self::uuid(), $studentId, $componentId, $score, $actorUserId]);
            }
        }

        AuditService::writeAudit('academic_result.marks_submitted', 'student', $studentId, [
            'student_id' => $studentId, 'exam_id' => $examId, 'count' => count($marks)
        ], $actorUserId, $student['school_id']);

        return self::listResults();
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
