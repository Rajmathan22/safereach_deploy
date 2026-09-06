<?php

namespace SafeReach\Services;

use SafeReach\Config;
use SafeReach\Database;

class EmailService {
    public static function sendParentWelcomeEmail(array $params): array {
        $pdo = Database::getConnection();

        $schoolId      = $params['schoolId'] ?? null;
        $studentId     = $params['studentId'] ?? null;
        $parentUserId  = $params['parentUserId'] ?? null;
        $recipientEmail= trim($params['recipientEmail'] ?? '');
        $guardianName  = trim($params['guardianName'] ?? 'Parent / Guardian');
        $studentName   = trim($params['studentName'] ?? 'Student');
        $studentCode   = trim($params['studentCode'] ?? '');
        $className     = trim($params['className'] ?? 'Class');
        $sectionName   = trim($params['sectionName'] ?? 'A');
        $password      = $params['password'] ?? 'Parent@2025';
        $schoolName    = trim($params['schoolName'] ?? 'SafeReach School');
        $loginUrl      = $params['loginUrl'] ?? 'http://localhost:3000/login/parent';

        if (empty($recipientEmail)) {
            return ['ok' => false, 'reason' => 'No recipient email provided'];
        }

        $subject = "Welcome to SafeReach - Parent Portal Access for {$studentName}";

        $bodyHtml = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{$subject}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 28px 24px; }
        .student-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin: 20px 0; }
        .student-box table { width: 100%; border-collapse: collapse; }
        .student-box td { padding: 4px 0; font-size: 14px; }
        .student-box td.label { color: #0369a1; font-weight: 600; width: 130px; }
        .creds-box { background: #fefce8; border: 1px dashed #facc15; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .creds-box p { margin: 4px 0; font-size: 14px; }
        .creds-box strong { color: #854d0e; }
        .btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 16px 0; text-align: center; }
        .features { margin: 24px 0 10px 0; padding-top: 20px; border-top: 1px solid #f1f5f9; }
        .feature-item { display: flex; align-items: flex-start; margin-bottom: 12px; font-size: 13px; color: #475569; }
        .feature-item span { font-weight: bold; color: #0f172a; margin-right: 6px; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>SafeReach Portal</h1>
            <p>Student Safety & School Reach Tracking System</p>
        </div>
        <div class="content">
            <p>Dear <strong>{$guardianName}</strong>,</p>
            <p>Your child has been enrolled into <strong>{$schoolName}</strong> on the SafeReach student safety platform. You now have access to monitor their daily transit, attendance, and academic progress.</p>
            
            <div class="student-box">
                <table>
                    <tr><td class="label">Student Name:</td><td><strong>{$studentName}</strong></td></tr>
                    <tr><td class="label">Class & Section:</td><td>{$className} - Section {$sectionName}</td></tr>
                    <tr><td class="label">Student Code:</td><td><code>{$studentCode}</code></td></tr>
                </table>
            </div>

            <div class="creds-box">
                <p><strong>Your Parent Login Credentials:</strong></p>
                <p>Portal URL: <a href="{$loginUrl}" style="color:#0284c7;">{$loginUrl}</a></p>
                <p>Email: <strong>{$recipientEmail}</strong></p>
                <p>Temporary Password: <strong>{$password}</strong></p>
            </div>

            <div style="text-align: center;">
                <a href="{$loginUrl}" class="btn">Log In to SafeReach Parent Portal</a>
            </div>

            <div class="features">
                <p style="font-size:13px; font-weight:bold; margin-bottom:8px; color:#334155;">What you can do in the SafeReach Parent Portal:</p>
                <div class="feature-item">
                    <span>🛡️ Live Travel Tracker:</span> Tap "Start Trip to School" in the morning and receive instant "Reached School Safely" check-in notifications.
                </div>
                <div class="feature-item">
                    <span>📋 Attendance & Absences:</span> View live morning attendance and submit absence explanation notes directly to the class teacher.
                </div>
                <div class="feature-item">
                    <span>👨‍👩‍👧‍👦 Multi-Child Switcher:</span> Seamlessly switch between all your enrolled children from a single dashboard.
                </div>
                <div class="feature-item">
                    <span>📊 Exam Results & Marks:</span> Access term examination results, subject breakdowns, and printable progress cards.
                </div>
            </div>
        </div>
        <div class="footer">
            &copy; 2026 {$schoolName} &bull; Powered by SafeReach Student Safety System
        </div>
    </div>
</body>
</html>
HTML;

        $logId = self::uuid();
        $stmt = $pdo->prepare("
            INSERT INTO email_delivery_logs (id, school_id, student_id, recipient_email, subject, template_name, body_html, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'parent_welcome_credentials', ?, 'sent', NOW())
        ");
        $stmt->execute([$logId, $schoolId, $studentId, $recipientEmail, $subject, $bodyHtml]);

        // Also create an in-app notification if parent user ID is provided
        if (!empty($parentUserId)) {
            $notifId = self::uuid();
            $stmtNotif = $pdo->prepare("
                INSERT INTO notifications (id, school_id, audience_role, user_id, title, body, event_type, created_at)
                VALUES (?, ?, 'parent', ?, ?, ?, 'parent_welcome', NOW())
            ");
            $stmtNotif->execute([
                $notifId,
                $schoolId,
                $parentUserId,
                "Welcome to SafeReach - {$studentName}",
                "Your parent portal is activated for {$studentName} ({$className}-{$sectionName}). You can monitor morning travel and attendance."
            ]);
        }

        return [
            'ok'             => true,
            'logId'          => $logId,
            'recipientEmail' => $recipientEmail,
            'subject'        => $subject,
            'status'         => 'delivered',
            'temporaryPassword' => $password,
        ];
    }

    public static function sendSiblingLinkedEmail(array $params): array {
        $pdo = Database::getConnection();

        $schoolId      = $params['schoolId'] ?? null;
        $studentId     = $params['studentId'] ?? null;
        $parentUserId  = $params['parentUserId'] ?? null;
        $recipientEmail= trim($params['recipientEmail'] ?? '');
        $guardianName  = trim($params['guardianName'] ?? 'Parent / Guardian');
        $studentName   = trim($params['studentName'] ?? 'Student');
        $studentCode   = trim($params['studentCode'] ?? '');
        $className     = trim($params['className'] ?? 'Class');
        $sectionName   = trim($params['sectionName'] ?? 'A');
        $schoolName    = trim($params['schoolName'] ?? 'SafeReach School');
        $loginUrl      = $params['loginUrl'] ?? 'http://localhost:3000/login/parent';

        if (empty($recipientEmail)) {
            return ['ok' => false, 'reason' => 'No recipient email provided'];
        }

        $subject = "New Child Linked: {$studentName} added to your SafeReach Portal";

        $bodyHtml = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{$subject}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 20px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #0284c7; padding: 24px; text-align: center; color: #ffffff; }
        .content { padding: 24px; }
        .box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 18px 0; }
        .btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h2 style="margin:0;">Child Linked to Your SafeReach Account</h2>
        </div>
        <div class="content">
            <p>Dear <strong>{$guardianName}</strong>,</p>
            <p><strong>{$studentName}</strong> has been enrolled at {$schoolName} and automatically linked to your existing SafeReach Parent account.</p>
            
            <div class="box">
                <p><strong>Child Details:</strong></p>
                <p>Name: <strong>{$studentName}</strong></p>
                <p>Class: <strong>{$className} - {$sectionName}</strong></p>
                <p>Student Code: <code>{$studentCode}</code></p>
            </div>

            <p>You can use your <strong>existing password</strong> to log in. In your dashboard, simply tap the child selector at the top to toggle between your children.</p>
            
            <p style="text-align:center; margin: 24px 0;">
                <a href="{$loginUrl}" class="btn">Open Parent Dashboard</a>
            </p>
        </div>
    </div>
</body>
</html>
HTML;

        $logId = self::uuid();
        $stmt = $pdo->prepare("
            INSERT INTO email_delivery_logs (id, school_id, student_id, recipient_email, subject, template_name, body_html, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'parent_sibling_linked', ?, 'sent', NOW())
        ");
        $stmt->execute([$logId, $schoolId, $studentId, $recipientEmail, $subject, $bodyHtml]);

        if (!empty($parentUserId)) {
            $notifId = self::uuid();
            $stmtNotif = $pdo->prepare("
                INSERT INTO notifications (id, school_id, audience_role, user_id, title, body, event_type, created_at)
                VALUES (?, ?, 'parent', ?, ?, ?, 'sibling_linked', NOW())
            ");
            $stmtNotif->execute([
                $notifId,
                $schoolId,
                $parentUserId,
                "New Child Linked: {$studentName}",
                "{$studentName} ({$className}-{$sectionName}) has been added to your parent portal. Use the child switcher to monitor."
            ]);
        }

        return [
            'ok'             => true,
            'logId'          => $logId,
            'recipientEmail' => $recipientEmail,
            'subject'        => $subject,
            'status'         => 'delivered',
            'isExistingParent' => true,
        ];
    }

    public static function listDeliveryLogs(int $limit = 50): array {
        $pdo = Database::getConnection();
        $limit = max(1, min($limit, 100));
        $stmt = $pdo->prepare("
            SELECT l.id, l.school_id, l.student_id, l.recipient_email, l.subject, l.template_name, l.status, l.created_at,
                   s.full_name AS student_name
            FROM email_delivery_logs l
            LEFT JOIN students s ON s.id = l.student_id
            ORDER BY l.created_at DESC
            LIMIT {$limit}
        ");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
