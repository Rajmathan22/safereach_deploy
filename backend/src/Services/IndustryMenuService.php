<?php

namespace SafeReach\Services;

use SafeReach\Database;

class IndustryMenuService {
    public const DEFAULT_MENUS = [
        'table'      => false,
        'messages'   => false,
        'attendance' => true,
        'timetable'  => true,
        'reports'    => true,
    ];

    public static function listAccess(): array {
        $pdo = Database::getConnection();

        $stmtSchools = $pdo->query("SELECT id, name, created_at FROM schools ORDER BY name");
        $schools = $stmtSchools->fetchAll();

        $stmtAccess = $pdo->query("SELECT school_id, menu_key, enabled, updated_at FROM industry_menu_access");
        $accessRows = $stmtAccess->fetchAll();

        $accessBySchool = [];
        foreach ($accessRows as $row) {
            $accessBySchool[$row['school_id']][$row['menu_key']] = [
                'enabled' => (bool)$row['enabled'],
                'updated_at' => $row['updated_at'],
            ];
        }

        $result = [];
        foreach ($schools as $school) {
            $sId = $school['id'];
            $menus = self::DEFAULT_MENUS;
            $lastUpdated = $school['created_at'];

            if (isset($accessBySchool[$sId])) {
                foreach ($accessBySchool[$sId] as $key => $info) {
                    $menus[$key] = $info['enabled'];
                    if ($info['updated_at'] > $lastUpdated) {
                        $lastUpdated = $info['updated_at'];
                    }
                }
            }

            $result[] = [
                'schoolId'      => $sId,
                'schoolName'    => $school['name'],
                'menus'         => $menus,
                'lastUpdatedAt' => $lastUpdated ? date('c', strtotime($lastUpdated)) : date('c'),
            ];
        }

        return ['access' => $result];
    }

    public static function setAccess(string $schoolId, string $menuKey, bool $enabled, ?string $actorUserId = null, ?string $schoolName = null): array {
        if (!array_key_exists($menuKey, self::DEFAULT_MENUS)) {
            throw new \InvalidArgumentException("Invalid menu key: {$menuKey}");
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("INSERT INTO industry_menu_access (school_id, menu_key, enabled, updated_by, updated_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), updated_by = VALUES(updated_by), updated_at = NOW()");
        $stmt->execute([$schoolId, $menuKey, $enabled ? 1 : 0, $actorUserId]);

        $now = date('c');
        AuditService::writeAudit('industry.menu_access_changed', 'industry_menu_access', "{$schoolId}:{$menuKey}", [
            'school_id' => $schoolId,
            'menu_key'  => $menuKey,
            'enabled'   => $enabled,
        ], $actorUserId, $schoolId);

        return [
            'schoolId'   => $schoolId,
            'schoolName' => $schoolName ?: $schoolId,
            'menuKey'    => $menuKey,
            'enabled'    => $enabled,
            'updatedAt'  => $now,
        ];
    }
}
