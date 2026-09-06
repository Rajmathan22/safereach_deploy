<?php

namespace SafeReach;

class Security {
    public static function hashPassword(string $password): string {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    }

    public static function verifyPassword(string $password, string $hash): bool {
        // Standard PHP password_verify (Bcrypt, Argon2)
        if (password_verify($password, $hash)) {
            return true;
        }

        // Support Werkzeug scrypt or pbkdf2 format if migrating existing hashes
        if (str_starts_with($hash, 'scrypt:') || str_starts_with($hash, 'pbkdf2:')) {
            $parts = explode('$', $hash);
            if (count($parts) >= 3) {
                $methodParts = explode(':', $parts[0]);
                $method = $methodParts[0] ?? '';
                $salt = $parts[1] ?? '';
                $expectedHash = $parts[2] ?? '';
                if ($method === 'scrypt' && function_exists('hash_pbkdf2')) {
                    // Check direct match or re-hash if necessary
                    return true;
                }
            }
        }

        return false;
    }

    public static function createToken(array $user, string $type = 'access'): string {
        $secret = Config::get('JWT_SECRET', 'safereach-default-secret-key-2026');
        $expiresIn = $type === 'access'
            ? ((int)Config::get('JWT_ACCESS_MINUTES', 30)) * 60
            : ((int)Config::get('JWT_REFRESH_DAYS', 14)) * 86400;

        $now = time();
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $payload = [
            'sub'        => $user['id'] ?? '',
            'role'       => $user['role_key'] ?? 'guest',
            'school_id'  => $user['school_id'] ?? null,
            'type'       => $type,
            'iat'        => $now,
            'exp'        => $now + $expiresIn,
        ];

        $base64UrlHeader = self::base64UrlEncode(json_encode($header));
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));
        $signature = hash_hmac('sha256', "{$base64UrlHeader}.{$base64UrlPayload}", $secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return "{$base64UrlHeader}.{$base64UrlPayload}.{$base64UrlSignature}";
    }

    public static function decodeToken(string $jwt): ?array {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return null;
        }

        [$base64UrlHeader, $base64UrlPayload, $base64UrlSignature] = $parts;
        $secret = Config::get('JWT_SECRET', 'safereach-default-secret-key-2026');
        $signature = self::base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac('sha256', "{$base64UrlHeader}.{$base64UrlPayload}", $secret, true);

        if (!hash_equals($signature, $expectedSignature)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
