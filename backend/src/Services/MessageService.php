<?php

namespace SafeReach\Services;

use SafeReach\Database;

class MessageService {
    public static function listStudentMessages(string $studentId, int $limit = 100): array {
        $pdo = Database::getConnection();
        $limit = max(1, min($limit, 200));

        $stmt = $pdo->prepare("
            SELECT m.id, m.student_id, m.conversation_type, m.message_kind, m.body, m.created_at,
                   COALESCE(sender.full_name, CASE WHEN m.message_kind = 'absence_request' THEN 'SafeReach School' ELSE 'School' END) AS sender_name,
                   recipient.full_name AS recipient_name
            FROM messages m
            LEFT JOIN users sender ON sender.id = m.sender_id
            LEFT JOIN users recipient ON recipient.id = m.recipient_id
            WHERE m.student_id = ?
            ORDER BY m.created_at ASC
            LIMIT {$limit}
        ");
        $stmt->execute([$studentId]);
        return $stmt->fetchAll();
    }

    public static function sendParentMessage(string $studentId, string $body, ?string $actorUserId = null): array {
        return self::createMessage($studentId, $body, 'parent', $actorUserId, 'chat');
    }

    public static function submitAbsenceReason(string $studentId, string $reason, ?string $actorUserId = null): array {
        $message = self::createMessage($studentId, $reason, 'parent', $actorUserId, 'absence_reason');

        $pdo = Database::getConnection();
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("UPDATE attendance_records SET reason = ? WHERE student_id = ? AND attendance_date = ? AND session = 'morning' AND status = 'absent'");
        $stmt->execute([$reason, $studentId, $today]);

        AuditService::writeAudit('message.absence_reason_submitted', 'student', $studentId, $message, $actorUserId, $message['school_id'] ?? null);
        return $message;
    }

    public static function notifyAbsentParents(array $studentIds, ?string $actorUserId = null): array {
        if (empty($studentIds)) {
            return [];
        }

        $results = [];
        $uniqueIds = array_unique($studentIds);
        $pdo = Database::getConnection();

        foreach ($uniqueIds as $studentId) {
            $created = self::createAbsenceRequest($pdo, $studentId, $actorUserId);
            if ($created) {
                $results[] = $created;
            }
        }

        return $results;
    }

    private static function createMessage(string $studentId, string $body, string $senderRole, ?string $actorUserId, string $messageKind): array {
        $cleanBody = trim($body);
        if (empty($cleanBody)) {
            throw new \InvalidArgumentException("Message body cannot be empty");
        }

        $pdo = Database::getConnection();
        $stmtStudent = $pdo->prepare("SELECT s.id, s.school_id, s.class_id, s.section_id, s.parent_id, p.user_id AS parent_user_id FROM students s LEFT JOIN parents p ON p.id = s.parent_id WHERE s.id = ?");
        $stmtStudent->execute([$studentId]);
        $student = $stmtStudent->fetch();
        if (!$student) {
            throw new \OutOfBoundsException("Student was not found");
        }

        $senderId = $actorUserId ?: ($senderRole === 'parent' ? $student['parent_user_id'] : null);
        $id = self::uuid();

        $stmtIns = $pdo->prepare("INSERT INTO messages (id, school_id, conversation_type, message_kind, sender_id, recipient_id, class_id, section_id, student_id, body) VALUES (?, ?, 'parent_teacher', ?, ?, ?, ?, ?, ?, ?)");
        $stmtIns->execute([
            $id,
            $student['school_id'],
            $messageKind,
            $senderId,
            null,
            $student['class_id'],
            $student['section_id'],
            $studentId,
            $cleanBody,
        ]);

        $payload = [
            'id'                => $id,
            'school_id'         => $student['school_id'],
            'student_id'        => $studentId,
            'conversation_type' => 'parent_teacher',
            'message_kind'      => $messageKind,
            'body'              => $cleanBody,
            'created_at'        => date('c'),
        ];

        AuditService::writeAudit("message.{$messageKind}_sent", 'student', $studentId, $payload, $actorUserId, $student['school_id']);
        return $payload;
    }

    private static function createAbsenceRequest(\PDO $pdo, string $studentId, ?string $actorUserId): ?array {
        $stmt = $pdo->prepare("
            SELECT s.id, s.school_id, s.full_name, s.class_id, s.section_id, s.parent_id,
                   p.guardian_name, p.phone AS parent_phone, p.sms_enabled, p.user_id AS parent_user_id,
                   t.user_id AS teacher_user_id, u.full_name AS teacher_name
            FROM students s
            LEFT JOIN parents p ON p.id = s.parent_id
            LEFT JOIN teacher_assignments ta ON ta.class_id = s.class_id AND ta.section_id = s.section_id AND ta.assignment_type = 'primary_incharge' AND ta.active = TRUE
            LEFT JOIN teachers t ON t.id = ta.teacher_id
            LEFT JOIN users u ON u.id = t.user_id
            WHERE s.id = ?
        ");
        $stmt->execute([$studentId]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        $teacherName = $row['teacher_name'] ?: 'Class Teacher';
        $body = "{$row['full_name']} was marked absent today. Please reply with the absence reason in this app or via SMS.";

        $msgId = self::uuid();
        $pdo->prepare("INSERT INTO messages (id, school_id, conversation_type, message_kind, sender_id, recipient_id, class_id, section_id, student_id, body) VALUES (?, ?, 'parent_teacher', 'absence_request', ?, ?, ?, ?, ?, ?)")
            ->execute([
                $msgId,
                $row['school_id'],
                $actorUserId ?: $row['teacher_user_id'],
                $row['parent_user_id'],
                $row['class_id'],
                $row['section_id'],
                $studentId,
                $body,
            ]);

        $smsResult = null;
        if ($row['sms_enabled'] && !empty($row['parent_phone'])) {
            $smsBody = "SafeReach: {$row['full_name']} is absent today. Please reply with the reason in the SafeReach app.";
            $smsResult = SmsService::sendParentSms($row['parent_phone'], $smsBody);
        }

        return [
            'student_id'   => $studentId,
            'student_name' => $row['full_name'],
            'parent_phone' => $row['parent_phone'],
            'message'      => [
                'id'         => $msgId,
                'body'       => $body,
                'created_at' => date('c'),
            ],
            'sms'          => $smsResult,
        ];
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
