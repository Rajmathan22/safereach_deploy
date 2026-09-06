<?php

namespace SafeReach\Services;

use SafeReach\Database;

class AuditService {
    public static function writeAudit(string $action, string $entityType, string $entityId, array $payload, ?string $actorUserId = null, ?string $schoolId = null): void {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("INSERT INTO audit_logs (id, action, entity_type, entity_id, payload, actor_user_id, school_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                self::uuid(),
                $action,
                $entityType,
                $entityId,
                json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                $actorUserId,
                $schoolId,
            ]);
        } catch (\Exception $e) {
            // Audit failures should not crash the main operational request
            error_log("Audit write error: " . $e->getMessage());
        }
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
