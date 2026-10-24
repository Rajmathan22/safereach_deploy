-- Migration 002: institution_type support for school AND college registration
-- Additive only: one new VARCHAR(20) column with DEFAULT 'school' on two tables.
-- Existing rows remain valid; every existing query keeps working unchanged.
--
-- MySQL 8.0 does not support `ADD COLUMN IF NOT EXISTS`, so each ALTER is
-- guarded by an information_schema check. Wrap in a stored procedure.

DELIMITER $$

CREATE PROCEDURE safereach_migrate_002()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'schools'
          AND COLUMN_NAME = 'institution_type'
    ) THEN
        ALTER TABLE schools
            ADD COLUMN institution_type VARCHAR(20) NOT NULL DEFAULT 'school'
            AFTER status;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'school_registration_requests'
          AND COLUMN_NAME = 'institution_type'
    ) THEN
        ALTER TABLE school_registration_requests
            ADD COLUMN institution_type VARCHAR(20) NOT NULL DEFAULT 'school'
            AFTER password_hash;
    END IF;
END$$

DELIMITER ;

CALL safereach_migrate_002();
DROP PROCEDURE safereach_migrate_002;