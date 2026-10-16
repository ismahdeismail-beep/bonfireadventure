import crypto from 'node:crypto';

export function uid(bytes = 8) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/**
 * Security headers — the live site ships none of these (audit: no CSP, HSTS or
 * X-Frame-Options). Requirement 4 / R4.9–R4.10.
 */
export function securityHeaders() {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "img-src 'self' data:",
      "style-src 'self'",
      "script-src 'self'",
      "connect-src 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };
}

export function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    ...securityHeaders(),
    ...headers,
  });
  res.end(body);
}

export function html(res, body, status = 200, headers = {}) {
  send(res, status, body, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
}

export function redirect(res, location, headers = {}) {
  send(res, 302, '', { Location: location, ...headers });
}

export function notFound(res) {
  send(res, 404, 'Not found');
}

export async function readForm(req, limitBytes = 100_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const params = new URLSearchParams(raw);
      resolve(Object.fromEntries(params.entries()));
    });
    req.on('error', reject);
  });
}

export function json(res, data, status = 200) {
  send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8' });
}
