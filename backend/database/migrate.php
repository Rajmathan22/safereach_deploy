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

    echo "Running seeder...\n";
    require_once __DIR__ . '/seed.php';

} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
