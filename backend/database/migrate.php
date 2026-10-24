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

    // schema.sql endswith plain CREATE INDEX statements and MySQL has no
    // CREATE INDEX IF NOT EXISTS form, so re-running schema.sql on an existing
    // database aborts with SQLSTATE 42000 / 1061 Duplicate key name. Drop the
    // statements whose index is already there; missing ones still run (and any
    // other schema error still fails loudly below).
    $sql = preg_replace_callback(
        '/^CREATE\s+INDEX\s+`?(\w+)`?\s+ON\s+`?(\w+)`?[^\n]*;[ \t]*\r?$/mi',
        function ($match) use ($pdo) {
            [, $index, $table] = $match;
            $check = $pdo->prepare(
                'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?'
            );
            $check->execute([$table, $index]);
            if ($check->fetchColumn()) {
                echo "✔ index {$index} already present.\n";
                return "-- skipped existing index {$index}";
            }
            echo "Creating index {$index}...\n";
            return $match[0];
        },
        $sql
    );

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
