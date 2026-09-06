<?php

namespace SafeReach\Services;

use SafeReach\Database;

class SafetyProtocolService {
    public const DEFAULT_PROTOCOLS = [
        'parent' => [
            'Verify pickup person before handover',
            'Keep emergency contact number updated',
            'Confirm absence reason before 9:30 AM',
        ],
        'teacher' => [
            'Morning roll-call synchronized',
            'Dismissal badges prepared',
            'Emergency contact logs synced',
        ],
    ];

    public static function listProtocols(string $roleKey, ?string $schoolId = null): array {
        $role = self::cleanRole($roleKey);
        $pdo = Database::getConnection();
        $sId = self::resolveSchoolId($pdo, $schoolId);

        self::ensureDefaults($pdo, $sId, $role);

        $stmt = $pdo->prepare("SELECT id, school_id, role_key, label, checked, submitted, active, created_at, updated_at FROM safety_protocols WHERE school_id = ? AND role_key = ? AND active = TRUE ORDER BY created_at, label");
        $stmt->execute([$sId, $role]);
        $rows = $stmt->fetchAll();

        return array_map(function($r) {
            $r['checked'] = (bool)$r['checked'];
            $r['submitted'] = (bool)$r['submitted'];
            $r['active'] = (bool)$r['active'];
            return $r;
        }, $rows);
    }

    public static function createProtocol(string $roleKey, string $label, ?string $actorUserId = null, ?string $schoolId = null): array {
        $role = self::cleanRole($roleKey);
        $cleanLabel = trim($label);
        if (empty($cleanLabel)) {
            throw new \InvalidArgumentException("Protocol label cannot be empty");
        }

        $pdo = Database::getConnection();
        $sId = self::resolveSchoolId($pdo, $schoolId);
        $id = self::uuid();

        $stmt = $pdo->prepare("INSERT INTO safety_protocols (id, school_id, role_key, label, checked, submitted, active, created_by, updated_by) VALUES (?, ?, ?, ?, FALSE, FALSE, TRUE, ?, ?)");
        $stmt->execute([$id, $sId, $role, $cleanLabel, $actorUserId, $actorUserId]);

        $row = self::findProtocol($pdo, $id);
        AuditService::writeAudit('safety_protocol.created', 'safety_protocol', $id, $row, $actorUserId, $sId);
        return $row;
    }

    public static function updateProtocol(string $protocolId, array $payload, ?string $actorUserId = null): array {
        $pdo = Database::getConnection();
        $existing = self::findProtocol($pdo, $protocolId);
        if (!$existing) {
            throw new \OutOfBoundsException("Safety protocol not found");
        }

        $fields = [];
        $values = [];

        if (isset($payload['label'])) {
            $fields[] = "label = ?";
            $values[] = trim((string)$payload['label']);
        }
        if (isset($payload['checked'])) {
            $fields[] = "checked = ?";
            $values[] = $payload['checked'] ? 1 : 0;
        }
        if (isset($payload['submitted'])) {
            $fields[] = "submitted = ?";
            $values[] = $payload['submitted'] ? 1 : 0;
        }

        if (empty($fields)) {
            return $existing;
        }

        $fields[] = "updated_by = ?";
        $values[] = $actorUserId;
        $values[] = $protocolId;

        $sql = "UPDATE safety_protocols SET " . implode(', ', $fields) . " WHERE id = ?";
        $pdo->prepare($sql)->execute($values);

        $updated = self::findProtocol($pdo, $protocolId);
        AuditService::writeAudit('safety_protocol.updated', 'safety_protocol', $protocolId, $updated, $actorUserId, $updated['school_id']);
        return $updated;
    }

    public static function submitProtocols(string $roleKey, array $protocolIds, ?string $actorUserId = null, ?string $schoolId = null): array {
        $role = self::cleanRole($roleKey);
        $pdo = Database::getConnection();
        $sId = self::resolveSchoolId($pdo, $schoolId);

        if (!empty($protocolIds)) {
            $placeholders = implode(',', array_fill(0, count($protocolIds), '?'));
            $params = array_merge([1, 1, $actorUserId, $sId, $role], $protocolIds);
            $stmt = $pdo->prepare("UPDATE safety_protocols SET checked = ?, submitted = ?, updated_by = ? WHERE school_id = ? AND role_key = ? AND id IN ({$placeholders})");
            $stmt->execute($params);
        }

        return self::listProtocols($role, $sId);
    }

    public static function deleteProtocol(string $protocolId, ?string $actorUserId = null): array {
        $pdo = Database::getConnection();
        $existing = self::findProtocol($pdo, $protocolId);
        if (!$existing) {
            throw new \OutOfBoundsException("Safety protocol not found");
        }

        $stmt = $pdo->prepare("UPDATE safety_protocols SET active = FALSE, updated_by = ? WHERE id = ?");
        $stmt->execute([$actorUserId, $protocolId]);

        AuditService::writeAudit('safety_protocol.deleted', 'safety_protocol', $protocolId, ['id' => $protocolId], $actorUserId, $existing['school_id']);
        return ['ok' => true, 'id' => $protocolId];
    }

    private static function findProtocol(\PDO $pdo, string $id): ?array {
        $stmt = $pdo->prepare("SELECT id, school_id, role_key, label, checked, submitted, active, created_at, updated_at FROM safety_protocols WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row) {
            $row['checked'] = (bool)$row['checked'];
            $row['submitted'] = (bool)$row['submitted'];
            $row['active'] = (bool)$row['active'];
        }
        return $row ?: null;
    }

    private static function ensureDefaults(\PDO $pdo, string $schoolId, string $role): void {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM safety_protocols WHERE school_id = ? AND role_key = ?");
        $stmt->execute([$schoolId, $role]);
        if ($stmt->fetchColumn() == 0 && isset(self::DEFAULT_PROTOCOLS[$role])) {
            $ins = $pdo->prepare("INSERT INTO safety_protocols (id, school_id, role_key, label, checked, submitted, active) VALUES (?, ?, ?, ?, FALSE, FALSE, TRUE)");
            foreach (self::DEFAULT_PROTOCOLS[$role] as $label) {
                $ins->execute([self::uuid(), $schoolId, $role, $label]);
            }
        }
    }

    private static function resolveSchoolId(\PDO $pdo, ?string $schoolId): string {
        if (!empty($schoolId)) return $schoolId;
        $stmt = $pdo->query("SELECT id FROM schools LIMIT 1");
        $id = $stmt->fetchColumn();
        return $id ?: 'default-school';
    }

    private static function cleanRole(string $role): string {
        $r = strtolower(trim($role));
        if (!in_array($r, ['parent', 'teacher'], true)) {
            throw new \InvalidArgumentException("Role must be 'parent' or 'teacher'");
        }
        return $r;
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
