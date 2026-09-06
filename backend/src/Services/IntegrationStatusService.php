<?php

namespace SafeReach\Services;

use SafeReach\Config;
use SafeReach\Database;

class IntegrationStatusService {
    public static function getStatus(): array {
        Config::load();

        $mysqlConfigured = false;
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->query("SELECT 1");
            $mysqlConfigured = ($stmt->fetchColumn() == 1);
        } catch (\Exception $e) {
            $mysqlConfigured = false;
        }

        $checks = [
            [
                'key' => 'mysql',
                'name' => 'MySQL 8.0 Primary Relational Store',
                'configured' => $mysqlConfigured,
                'required' => true,
                'usedFor' => 'Schools, users, students, attendance, timetable, results, messages, and reports.',
            ],
            [
                'key' => 'twilio',
                'name' => 'Twilio SMS Gateway',
                'configured' => !empty(Config::get('TWILIO_ACCOUNT_SID')) && !empty(Config::get('TWILIO_AUTH_TOKEN')),
                'required' => true,
                'usedFor' => 'Parent SMS alerts for attendance, late arrival, absence, and travel tracking.',
            ],
            [
                'key' => 'resend',
                'name' => 'Resend Email Service',
                'configured' => !empty(Config::get('RESEND_API_KEY')),
                'required' => false,
                'usedFor' => 'School onboarding invitations, password resets, and safety bulletins.',
            ],
            [
                'key' => 'google_sheets',
                'name' => 'Google Sheets Schema Export',
                'configured' => !empty(Config::get('GOOGLE_SHEET_ID')),
                'required' => false,
                'usedFor' => 'Live spreadsheet schema mirroring and backup views.',
            ],
        ];

        $missingRequired = [];
        foreach ($checks as $item) {
            if ($item['required'] && !$item['configured']) {
                $missingRequired[] = $item['key'];
            }
        }

        return [
            'ok' => count($missingRequired) === 0,
            'missingRequired' => $missingRequired,
            'integrations' => $checks,
        ];
    }
}
