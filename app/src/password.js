import crypto from 'node:crypto';

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, salt, SCRYPT_PARAMS.keylen, SCRYPT_PARAMS).toString('hex');
  return `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt}$${key}`;
}

export function verifyPassword(password, stored) {
  try {
    const [alg, N, r, p, salt, key] = String(stored).split('$');
    if (alg !== 'scrypt') return false;
    const calc = crypto.scryptSync(password, salt, Buffer.from(key, 'hex').length, {
      N: Number(N), r: Number(r), p: Number(p),
    });
    const expected = Buffer.from(key, 'hex');
    return calc.length === expected.length && crypto.timingSafeEqual(calc, expected);
  } catch {
    return false;
  }
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}
