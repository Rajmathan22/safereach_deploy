<?php

namespace SafeReach;

class Config {
    private static array $env = [];
    private static bool $loaded = false;

    public static function load(): void {
        if (self::$loaded) {
            return;
        }

        $envFile = dirname(__DIR__) . '/.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || str_starts_with($line, '#')) {
                    continue;
                }
                if (str_contains($line, '=')) {
                    [$key, $value] = explode('=', $line, 2);
                    $key = trim($key);
                    $value = trim($value);
                    $value = trim($value, '"\'');
                    self::$env[$key] = $value;
                    if (!getenv($key)) {
                        putenv("{$key}={$value}");
                        $_ENV[$key] = $value;
                    }
                }
            }
        }

        self::$loaded = true;
    }

    public static function get(string $key, $default = null) {
        self::load();
        $val = getenv($key);
        if ($val !== false && $val !== '') {
            return $val;
        }
        return self::$env[$key] ?? $default;
    }

    public static function getBool(string $key, bool $default = false): bool {
        $val = strtolower((string)self::get($key, $default ? 'true' : 'false'));
        return in_array($val, ['true', '1', 'yes', 'on'], true);
    }
}
