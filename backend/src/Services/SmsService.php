<?php

namespace SafeReach\Services;

use SafeReach\Config;
use SafeReach\Database;

class SmsService {
    public static function sendParentSms(string $toPhone, string $body): array {
        Config::load();
        $isTestMode = Config::getBool('SMS_TEST_MODE', true);
        $accountSid = Config::get('TWILIO_ACCOUNT_SID');
        $authToken  = Config::get('TWILIO_AUTH_TOKEN');
        $fromPhone  = Config::get('TWILIO_FROM_PHONE');

        if ($isTestMode || empty($accountSid) || empty($authToken) || empty($fromPhone)) {
            return [
                'sid'    => 'MOCK_SMS_' . bin2hex(random_bytes(8)),
                'status' => 'delivered_mock',
                'to'     => $toPhone,
                'body'   => $body,
                'mode'   => 'development_mock',
            ];
        }

        // Real Twilio API dispatch
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json";
        $data = [
            'From' => $fromPhone,
            'To'   => $toPhone,
            'Body' => $body,
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_USERPWD, "{$accountSid}:{$authToken}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($response, true) ?: [];
        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'sid'    => $result['sid'] ?? 'TWILIO_OK',
                'status' => $result['status'] ?? 'sent',
                'to'     => $toPhone,
                'body'   => $body,
            ];
        }

        return [
            'sid'    => null,
            'status' => 'failed',
            'reason' => $result['message'] ?? "Twilio returned HTTP {$httpCode}",
            'to'     => $toPhone,
            'body'   => $body,
        ];
    }
}
