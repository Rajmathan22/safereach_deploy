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

    public static function listAuditLogs(?string $schoolId = null, int $limit = 200): array {
        $pdo = Database::getConnection();
        $params = [];
        $sql = "
            SELECT al.id, al.action, al.entity_type, al.entity_id, al.payload, al.actor_user_id,
                   COALESCE(u.full_name, 'System') AS actor_name,
                   COALESCE(r.name, 'System Administrator') AS actor_role,
                   al.school_id,
                   COALESCE(sc.name, 'Global') AS school_name,
                   al.created_at
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.actor_user_id
            LEFT JOIN roles r ON r.id = u.role_id
            LEFT JOIN schools sc ON sc.id = al.school_id
        ";

        if (!empty($schoolId)) {
            $sql .= " WHERE al.school_id = ?";
            $params[] = $schoolId;
        }

        $sql .= " ORDER BY al.created_at DESC LIMIT " . (int)$limit;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return array_map(function ($row) {
            if (isset($row['payload']) && is_string($row['payload'])) {
                $row['payload'] = json_decode($row['payload'], true) ?: $row['payload'];
            }
            return $row;
        }, $rows);
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
