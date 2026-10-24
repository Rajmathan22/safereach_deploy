<?php

require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Security.php';
require_once __DIR__ . '/../src/Router.php';
require_once __DIR__ . '/../src/Services/AuditService.php';
require_once __DIR__ . '/../src/Services/SmsService.php';
require_once __DIR__ . '/../src/Services/IntegrationStatusService.php';
require_once __DIR__ . '/../src/Services/IndustryMenuService.php';
require_once __DIR__ . '/../src/Services/SafetyProtocolService.php';
require_once __DIR__ . '/../src/Services/MessageService.php';
require_once __DIR__ . '/../src/Services/AcademicResultService.php';
require_once __DIR__ . '/../src/Services/EmailService.php';
require_once __DIR__ . '/../src/Services/SafeReachService.php';

use SafeReach\Config;
use SafeReach\Router;
use SafeReach\Services\AcademicResultService;
use SafeReach\Services\EmailService;
use SafeReach\Services\IndustryMenuService;
use SafeReach\Services\IntegrationStatusService;
use SafeReach\Services\MessageService;
use SafeReach\Services\SafeReachService;
use SafeReach\Services\SafetyProtocolService;

Config::load();

$router = new Router();

// Health Check
$router->get('/health', function () {
    return [
        'ok'      => true,
        'status'  => 'healthy',
        'service' => 'SafeReach PHP Backend',
        'time'    => date('c'),
    ];
});

// Master Bootstrap Data
$router->get('/api/v1/bootstrap', function ($params, $body, $query) {
    return SafeReachService::bootstrap($query['role'] ?? null, $query['schoolId'] ?? null);
});

// Database Seed Endpoint (can be called via browser or POST)
$router->get('/api/v1/seed', function () {
    $pdo = SafeReach\Database::getConnection();
    $sqlFile = dirname(__DIR__) . '/database/seed.sql';
    if (file_exists($sqlFile)) {
        $pdo->exec(file_get_contents($sqlFile));
    }
    return ['ok' => true, 'message' => 'Database seeded successfully with sample data'];
});
$router->post('/api/v1/seed', function () {
    $pdo = SafeReach\Database::getConnection();
    $sqlFile = dirname(__DIR__) . '/database/seed.sql';
    if (file_exists($sqlFile)) {
        $pdo->exec(file_get_contents($sqlFile));
    }
    return ['ok' => true, 'message' => 'Database seeded successfully with sample data'];
});

// Authentication
$router->post('/api/v1/auth/login', function ($params, $body) {
    return SafeReachService::login($body['email'] ?? '', $body['password'] ?? '');
});

// School Settings
$router->get('/api/v1/school-settings', function ($params, $body, $query) {
    return SafeReachService::schoolSettings($query['schoolId'] ?? null);
});
$router->patch('/api/v1/school-settings', function ($params, $body) {
    return SafeReachService::updateSchoolSettings($body, $body['actorUserId'] ?? null, $body['schoolId'] ?? null);
});

// Student Travel Lifecycle (4-Stage Workflow)
$router->post('/api/v1/student-travel/{id}/depart-home', function ($params, $body) {
    return SafeReachService::markReadyToSchool($params['id'], $body['actorUserId'] ?? null);
});
$router->post('/api/v1/student-travel/{id}/ready-to-school', function ($params, $body) {
    return SafeReachService::markReadyToSchool($params['id'], $body['actorUserId'] ?? null);
});
$router->post('/api/v1/student-travel/{id}/reached-school', function ($params, $body) {
    return SafeReachService::markReachedSchool($params['id'], $body['actorUserId'] ?? null);
});
$router->post('/api/v1/student-travel/{id}/reached-home', function ($params, $body) {
    return SafeReachService::markReachedHome($params['id'], $body['actorUserId'] ?? null);
});
$router->post('/api/v1/student-travel/{id}/attendance', function ($params, $body) {
    return SafeReachService::submitAttendance($params['id'], $body['status'] ?? '', $body['actorUserId'] ?? null);
});
$router->post('/api/v1/student-travel/out-of-school', function ($params, $body) {
    $studentIds = $body['studentIds'] ?? [];
    if (!is_array($studentIds)) {
        throw new \InvalidArgumentException("studentIds must be a list");
    }
    $records = [];
    foreach ($studentIds as $sId) {
        $records[] = SafeReachService::submitGoOut($sId, $body['actorUserId'] ?? null);
    }
    return ['ok' => true, 'records' => $records];
});
$router->post('/api/v1/student-travel/go-out', function ($params, $body) {
    $studentIds = $body['studentIds'] ?? [];
    if (!is_array($studentIds)) {
        throw new \InvalidArgumentException("studentIds must be a list");
    }
    $records = [];
    foreach ($studentIds as $sId) {
        $records[] = SafeReachService::submitGoOut($sId, $body['actorUserId'] ?? null);
    }
    return ['ok' => true, 'records' => $records];
});


// Student SMS Preferences
$router->patch('/api/v1/students/{id}/sms-enabled', function ($params, $body) {
    if (!isset($body['enabled']) || !is_bool($body['enabled'])) {
        throw new \InvalidArgumentException("enabled must be true or false");
    }
    return SafeReachService::setStudentSmsEnabled($params['id'], $body['enabled'], $body['actorUserId'] ?? null);
});

// Messages & Communication
$router->get('/api/v1/messages', function ($params, $body, $query) {
    $studentId = $query['studentId'] ?? '';
    if (empty($studentId)) {
        throw new \InvalidArgumentException("studentId is required");
    }
    return MessageService::listStudentMessages($studentId);
});
$router->post('/api/v1/messages', function ($params, $body) {
    return MessageService::sendParentMessage($body['studentId'] ?? '', $body['body'] ?? '', $body['actorUserId'] ?? null);
});
$router->post('/api/v1/messages/absence-reason', function ($params, $body) {
    return MessageService::submitAbsenceReason($body['studentId'] ?? '', $body['reason'] ?? '', $body['actorUserId'] ?? null);
});
$router->post('/api/v1/attendance/absence-notifications', function ($params, $body) {
    $studentIds = $body['studentIds'] ?? [];
    if (!is_array($studentIds)) {
        throw new \InvalidArgumentException("studentIds must be a list");
    }
    return [
        'ok'            => true,
        'notifications' => MessageService::notifyAbsentParents($studentIds, $body['actorUserId'] ?? null),
    ];
});

// Academic Results
$router->get('/api/v1/academic-results', function () {
    return AcademicResultService::listResults();
});
$router->post('/api/v1/academic-results/exams', function ($params, $body) {
    return AcademicResultService::saveExam($body, $body['actorUserId'] ?? null);
});
$router->post('/api/v1/academic-results/marks', function ($params, $body) {
    return AcademicResultService::submitMarks($body, $body['actorUserId'] ?? null);
});

// Safety Protocols
$router->get('/api/v1/safety-protocols', function ($params, $body, $query) {
    return SafetyProtocolService::listProtocols($query['role'] ?? '', $query['schoolId'] ?? null);
});
$router->post('/api/v1/safety-protocols', function ($params, $body) {
    return SafetyProtocolService::createProtocol($body['role'] ?? '', $body['label'] ?? '', $body['actorUserId'] ?? null, $body['schoolId'] ?? null);
});
$router->patch('/api/v1/safety-protocols/{id}', function ($params, $body) {
    return SafetyProtocolService::updateProtocol($params['id'], $body, $body['actorUserId'] ?? null);
});
$router->post('/api/v1/safety-protocols/submit', function ($params, $body) {
    return SafetyProtocolService::submitProtocols($body['role'] ?? '', $body['protocolIds'] ?? [], $body['actorUserId'] ?? null, $body['schoolId'] ?? null);
});
$router->delete('/api/v1/safety-protocols/{id}', function ($params, $body) {
    return SafetyProtocolService::deleteProtocol($params['id'], $body['actorUserId'] ?? null);
});

// Industry Menu Access
$router->get('/api/v1/industry-menu-access', function () {
    return IndustryMenuService::listAccess();
});
$router->put('/api/v1/industry-menu-access/{schoolId}/{menuKey}', function ($params, $body) {
    return IndustryMenuService::setAccess(
        $params['schoolId'],
        $params['menuKey'],
        (bool)($body['enabled'] ?? true),
        $body['actorUserId'] ?? null,
        $body['schoolName'] ?? null
    );
});

// Super Admin: School Onboarding & Requests
$router->get('/api/v1/super-admin/requests', function () {
    return SafeReachService::listSchoolRequests();
});
// Public: submit a school OR college registration request (pending approval)
$router->post('/api/v1/super-admin/requests', function ($params, $body) {
    return SafeReachService::createSchoolRequest($body ?? []);
});
$router->get('/api/v1/super-admin/audit-logs', function ($params, $body, $query) {
    $schoolId = $query['schoolId'] ?? null;
    $limit = (int)($query['limit'] ?? 200);
    return AuditService::listAuditLogs($schoolId, $limit);
});
$router->post('/api/v1/super-admin/requests/{id}/review', function ($params, $body) {
    return SafeReachService::reviewSchoolRequest(
        $params['id'],
        $body['decision'] ?? 'approved',
        $body['reason'] ?? null,
        $body['actorUserId'] ?? null
    );
});
$router->post('/api/v1/super-admin/schools', function ($params, $body) {
    return SafeReachService::createSchool($body, $body['actorUserId'] ?? null);
});

// School Admin & Class Teacher: Class, Teacher, Student Operations & Parent Provisioning
$router->post('/api/v1/classes', function ($params, $body) {
    return SafeReachService::createClass($body, $body['actorUserId'] ?? null, $body['schoolId'] ?? null);
});
$router->post('/api/v1/teachers', function ($params, $body) {
    return SafeReachService::createTeacher($body, $body['actorUserId'] ?? null, $body['schoolId'] ?? null);
});
$router->post('/api/v1/students', function ($params, $body) {
    return SafeReachService::createStudent($body, $body['actorUserId'] ?? null, $body['schoolId'] ?? null);
});
$router->put('/api/v1/students/{id}', function ($params, $body) {
    return SafeReachService::updateStudent($params['id'], $body, $body['actorUserId'] ?? null, $body['schoolId'] ?? null);
});
$router->patch('/api/v1/students/{id}', function ($params, $body) {
    return SafeReachService::updateStudent($params['id'], $body, $body['actorUserId'] ?? null, $body['schoolId'] ?? null);
});
$router->delete('/api/v1/students/{id}', function ($params, $body) {
    return SafeReachService::deleteStudent($params['id'], $body['actorUserId'] ?? null);
});
$router->post('/api/v1/students/bulk-upload', function ($params, $body) {
    $rows = $body['rows'] ?? $body['students'] ?? $body;
    if (!is_array($rows)) {
        throw new \InvalidArgumentException("students must be a list");
    }
    return SafeReachService::bulkUploadStudents($rows, $body['actorUserId'] ?? null, $body['schoolId'] ?? null);
});
$router->post('/api/v1/students/{id}/resend-parent-invite', function ($params, $body) {
    return SafeReachService::resendParentInvite($params['id'], $body['actorUserId'] ?? null);
});
$router->post('/api/v1/students/{id}/promote', function ($params, $body) {
    return SafeReachService::promoteStudent(
        $params['id'],
        $body['className'] ?? '',
        $body['sectionName'] ?? 'A',
        $body['actorUserId'] ?? null
    );
});

// Email Delivery Logs
$router->get('/api/v1/email-logs', function () {
    return EmailService::listDeliveryLogs();
});

// Timetable Management
$router->get('/api/v1/timetables', function ($params, $body, $query) {
    return SafeReachService::getTimetable(
        $query['className'] ?? $query['class_name'] ?? null,
        $query['section'] ?? $query['section_name'] ?? null,
        $query['schoolId'] ?? null
    );
});
$router->get('/api/v1/timetables/all', function ($params, $body, $query) {
    return SafeReachService::listAllTimetables($query['schoolId'] ?? null);
});
$router->post('/api/v1/timetables', function ($params, $body) {
    return SafeReachService::saveTimetable($body, $body['actorUserId'] ?? null, $body['schoolId'] ?? null);
});
$router->put('/api/v1/timetables', function ($params, $body) {
    return SafeReachService::saveTimetable($body, $body['actorUserId'] ?? null, $body['schoolId'] ?? null);
});

// Dispatch current request
$router->dispatch();
