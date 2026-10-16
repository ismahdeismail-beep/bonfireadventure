import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = path.dirname(fileURLToPath(import.meta.url));
export const APP_DIR = path.resolve(srcDir, '..');

// Minimal .env loader (no dependency). Real environment always wins.
const envPath = path.join(APP_DIR, '.env');
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

export const config = {
  appDir: APP_DIR,
  publicDir: path.join(APP_DIR, 'public'),
  dataFile: process.env.DATA_FILE || path.join(APP_DIR, 'data', 'db.json'),

  // Storage — 'supabase' (shared Postgres) or 'json' (local file fallback).
  // Auto-detected: Supabase wins whenever its URL + service key are present.
  storeDriver: (process.env.STORE || '').trim().toLowerCase(),
  supabaseUrl: (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, ''),
  supabaseAnonKey: (process.env.SUPABASE_ANON_KEY || '').trim(),
  supabaseServiceKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),

  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 3000),
  isProd: process.env.NODE_ENV === 'production',

  sessionSecret: process.env.SESSION_SECRET || 'dev-insecure-change-me',
  sessionTtlMs: 1000 * 60 * 60 * 24 * 7, // 7 days
  resetTtlMs: 1000 * 60 * 30,            // 30 minutes

  // Requirement 2 / ADR-0002 — one entry point, off unless configured.
  whatsappNumber: (process.env.WHATSAPP_NUMBER || '').trim(),
  whatsappPlacement: process.env.WHATSAPP_PLACEMENT || 'package-only',

  // Requirement 3
  childRate: Number(process.env.CHILD_RATE || 0.7),
  depositRate: Number(process.env.DEPOSIT_RATE || 0.2),

  // Optional staff seed
  adminHandle: (process.env.ADMIN_HANDLE || '').trim(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
};

// Derived: Supabase needs a URL and the server-only service key. When either is
// missing we fall back to the JSON file driver so the repo still runs with no
// configuration at all (and no secrets committed).
config.supabaseReady = Boolean(config.supabaseUrl && config.supabaseServiceKey);
if (!['supabase', 'json'].includes(config.storeDriver)) {
  config.storeDriver = config.supabaseReady ? 'supabase' : 'json';
}
if (config.storeDriver === 'supabase' && !config.supabaseReady) {
  throw new Error('STORE=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}
