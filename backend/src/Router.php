<?php

namespace SafeReach;

class Router {
    private array $routes = [];

    public function get(string $path, callable $handler): void {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): void {
        $this->addRoute('PUT', $path, $handler);
    }

    public function patch(string $path, callable $handler): void {
        $this->addRoute('PATCH', $path, $handler);
    }

    public function delete(string $path, callable $handler): void {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, callable $handler): void {
        // Convert {param} placeholders to named regex groups
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $path);
        $pattern = '#^' . $pattern . '$#';
        $this->routes[] = [
            'method'  => $method,
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    public function handleCors(): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        $allowedOrigins = Config::get('FRONTEND_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000');
        $originList = array_map('trim', explode(',', $allowedOrigins));

        if (in_array($origin, $originList, true) || in_array('*', $originList, true) || str_ends_with($origin, '.vercel.app')) {
            header("Access-Control-Allow-Origin: {$origin}");
        } else {
            header("Access-Control-Allow-Origin: *");
        }

        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    public function dispatch(): void {
        $this->handleCors();

        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        // Normalize base uri (strip trailing slash except root)
        if ($uri !== '/' && str_ends_with($uri, '/')) {
            $uri = rtrim($uri, '/');
        }

        $rawBody = file_get_contents('php://input');
        $jsonBody = json_decode($rawBody, true) ?: [];

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method && !($method === 'HEAD' && $route['method'] === 'GET')) {
                continue;
            }

            if (preg_match($route['pattern'], $uri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                try {
                    $response = call_user_func($route['handler'], $params, $jsonBody, $_GET);
                    $this->jsonResponse($response);
                    return;
                } catch (\InvalidArgumentException $e) {
                    $this->errorResponse('bad_request', $e->getMessage(), 400);
                    return;
                } catch (\OutOfBoundsException $e) {
                    $this->errorResponse('not_found', $e->getMessage(), 404);
                    return;
                } catch (\DomainException $e) {
                    $this->errorResponse('forbidden', $e->getMessage(), 403);
                    return;
                } catch (\Exception $e) {
                    $this->errorResponse('server_error', $e->getMessage(), 500);
                    return;
                }
            }
        }

        $this->errorResponse('not_found', "Endpoint not found: {$method} {$uri}", 404);
    }

    public function jsonResponse($data, int $status = 200, array $headers = []): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        foreach ($headers as $k => $v) {
            header("{$k}: {$v}");
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public function errorResponse(string $code, string $message, int $status = 400): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'      => false,
            'code'    => $code,
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
