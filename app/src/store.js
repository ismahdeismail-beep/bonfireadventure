import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { destinations, packages } from './seed.js';
import { hashPassword } from './password.js';
import { uid } from './http.js';

export let db;

function fresh() {
  const now = new Date().toISOString();
  const users = [];

  // Optional staff seed — only if configured (keeps the repo free of any
  // hard-coded credentials, per ADR-0001).
  if (config.adminHandle && config.adminPassword) {
    users.push({
      id: uid(8),
      handle: config.adminHandle.toLowerCase(),
      name: 'Travel Desk',
      role: 'staff',
      passwordHash: hashPassword(config.adminPassword),
      consentAt: now,
      createdAt: now,
    });
  }

  return {
    meta: { version: 1, seededAt: now },
    destinations,
    packages,
    users,
    sessions: {},
    resetTokens: {},
    bookings: [],
  };
}

export function save() {
  const dir = path.dirname(config.dataFile);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${config.dataFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, config.dataFile);
}

export function init() {
  if (db) return db;
  if (fs.existsSync(config.dataFile)) {
    try {
      db = JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));
      // Ensure new seed fields exist on an older file.
      db.bookings ||= [];
      db.sessions ||= {};
      db.resetTokens ||= {};
      db.users ||= [];
      return db;
    } catch {
      // fall through to reseed on corruption
    }
  }
  db = fresh();
  save();
  return db;
}

export function reset() {
  db = fresh();
  save();
  return db;
}
