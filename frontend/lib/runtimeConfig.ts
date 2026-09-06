function isLocalDevServer() {
  if (typeof window === 'undefined') return false;
  return (
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) &&
    (window.location.port === '5173' || window.location.port === '5174')
  );
}

// In EC2/Docker production behind Nginx reverse proxy, /api/v1 routes directly to same host.
// In standalone local vite dev (port 5173), fallback to http://localhost:5000/api/v1.
// If VITE_SAFEREACH_API_URL is explicitly set during build/env, use that value.
export const apiBaseUrl =
  import.meta.env.VITE_SAFEREACH_API_URL ||
  (isLocalDevServer() ? 'http://localhost:5000/api/v1' : '/api/v1');

export const socketBaseUrl =
  import.meta.env.VITE_SAFEREACH_WS_URL ||
  (isLocalDevServer() ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : ''));

