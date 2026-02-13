// Shared input validation and security hardening for all XP server variants

// Allowlisted event types — reject anything not in this set
export const VALID_EVENT_TYPES = new Set([
  'message', 'tool_use', 'task_complete', 'response',
  'claude_code', 'codex_cli', 'gemini_cli', 'cursor_ai', 'copilot',
  'activity', 'unknown'
]);

// Allowlisted CLI sources
export const VALID_SOURCES = new Set([
  'claude', 'codex', 'gemini', 'cursor', 'copilot', 'unknown'
]);

// Max body size for express.json() — XP events are tiny JSON payloads
export const MAX_BODY_SIZE = '1kb';

// Max raw body size for the standalone http server (xp-server.js)
export const MAX_RAW_BODY_BYTES = 1024;

/**
 * Validate and sanitize an XP event payload.
 * Returns { valid, type, source, error } — caller checks valid before proceeding.
 */
export function validateEvent(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Body must be a JSON object' };
  }

  const type = typeof body.type === 'string' ? body.type.slice(0, 32) : 'unknown';
  const source = typeof body.source === 'string' ? body.source.slice(0, 16) : 'unknown';

  if (!VALID_EVENT_TYPES.has(type)) {
    return { valid: false, error: `Invalid event type: ${type}` };
  }
  if (!VALID_SOURCES.has(source)) {
    return { valid: false, error: `Invalid source: ${source}` };
  }

  // Sanitize optional nested data — only allow known tool names
  let toolName = null;
  if (body.data && typeof body.data === 'object' && typeof body.data.tool === 'string') {
    toolName = body.data.tool.slice(0, 32);
  }

  return { valid: true, type, source, toolName };
}

/**
 * Express middleware that sets security headers on every response.
 */
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Type', 'application/json');
  next();
}

/**
 * Returns CORS + security headers for the raw http server (xp-server.js).
 */
export function getSecureHeaders() {
  return {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Type': 'application/json'
  };
}
