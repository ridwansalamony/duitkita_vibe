import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token (64-char hex, URL-safe).
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a plain token using SHA-256. Store only the hash in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
