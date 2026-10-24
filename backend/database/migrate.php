<?php

require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/Database.php';

use SafeReach\Config;
use SafeReach\Database;

try {
    echo "Connecting to MySQL database...\n";
    $pdo = Database::getConnection();

    $schemaFile = __DIR__ . '/schema.sql';
    if (!file_exists($schemaFile)) {
        throw new Exception("schema.sql not found at {$schemaFile}");
    }

    echo "Applying schema.sql...\n";
    $sql = file_get_contents($schemaFile);
    $pdo->exec($sql);
    echo "✅ Schema applied successfully.\n";

    // Guarded column additions for existing databases. schema.sql only creates
    // missing tables (CREATE TABLE IF NOT EXISTS), so tables that were created
    // before a column existed would never receive it without this step.
    // Additive-only: each check makes rerunning migrate.php idempotent.
    $additions = [
        ['schools', 'institution_type', "ALTER TABLE schools ADD COLUMN institution_type VARCHAR(20) NOT NULL DEFAULT 'school' AFTER status"],
        ['school_registration_requests', 'institution_type', "ALTER TABLE school_registration_requests ADD COLUMN institution_type VARCHAR(20) NOT NULL DEFAULT 'school' AFTER password_hash"],
    ];
    foreach ($additions as [$table, $column, $ddl]) {
        $check = $pdo->prepare(
            "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
        );
        $check->execute([$table, $column]);
        if ($check->fetchColumn()) {
            echo "✔ {$table}.{$column} already present.\n";
            continue;
        }
        echo "Adding {$table}.{$column}...\n";
        $pdo->exec($ddl);
        echo "✅ {$table}.{$column} added.\n";
    };

    echo "Running seeder...\n";
    require_once __DIR__ . '/seed.php';

} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
