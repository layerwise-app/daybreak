/**
 * The waitlist form's rules, kept free of the database and email so they can
 * be tested: validation, the honeypot, the rate limit, duplicates, and the
 * daily cap on emails to the owner. `waitlist-store.ts` connects them to D1
 * and `env.EMAIL`.
 */

export const DEVICES = ['iphone', 'ipad', 'mac'] as const;
export type Device = (typeof DEVICES)[number];
export const DEVICE_LABELS: Record<Device, string> = {
  iphone: 'iPhone',
  ipad: 'iPad',
  mac: 'Mac'
};

/** Submissions allowed per visitor (salted IP hash) per window. */
export const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };
/** At most this many sign-up emails to the owner per UTC day. */
export const OWNER_EMAIL_DAILY_CAP = 100;
/** The hidden field bots fill in. People never see it. */
export const HONEYPOT_FIELD = 'website';

export type WaitlistInput = {
  email?: unknown;
  devices?: unknown;
  [HONEYPOT_FIELD]?: unknown;
};

export type FieldErrors = { email?: string; devices?: string };

export type JoinResult =
  | { status: 'joined'; position: number }
  | { status: 'duplicate' }
  | { status: 'invalid'; errors: FieldErrors }
  | { status: 'rate_limited' };

export type WaitlistEntry = { email: string; devices: Device[]; createdAt: Date };

export interface WaitlistStore {
  /** Submissions from `visitor` at or after `since` (ms). */
  countAttempts(visitor: string, since: number): Promise<number>;
  recordAttempt(visitor: string, at: number): Promise<void>;
  /** Saves the entry and returns its place in line, or `'duplicate'`. */
  insert(entry: WaitlistEntry): Promise<{ position: number } | 'duplicate'>;
  /** People on the list right now. */
  count(): Promise<number>;
  /** Owner emails sent at or after `since` (ms). */
  countOwnerEmailsSince(since: number): Promise<number>;
  markOwnerNotified(email: string): Promise<void>;
}

/** Sends one sign-up email to the owner. Resolves `true` when sent. */
export type OwnerNotifier = (
  ownerEmail: string,
  entry: WaitlistEntry & { position: number }
) => Promise<boolean>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isHoneypotFilled(input: WaitlistInput): boolean {
  const value = input[HONEYPOT_FIELD];
  return typeof value === 'string' ? value.trim() !== '' : value != null;
}

export function validateWaitlist(
  input: WaitlistInput
): { ok: true; email: string; devices: Device[] } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const email = typeof input.email === 'string' ? normalizeEmail(input.email) : '';
  if (!email) errors.email = 'Enter your email address.';
  else if (email.length > 254 || !EMAIL_PATTERN.test(email))
    errors.email = 'That doesn’t look like an email address. Check for typos.';

  const raw = Array.isArray(input.devices) ? input.devices : [];
  const devices = DEVICES.filter((d) => raw.includes(d));
  const unknown = raw.some((d) => !DEVICES.includes(d as Device));
  if (unknown || raw.length > DEVICES.length) errors.devices = 'Choose from iPhone, iPad, and Mac.';
  else if (devices.length === 0) errors.devices = 'Choose at least one device.';

  return errors.email || errors.devices ? { ok: false, errors } : { ok: true, email, devices };
}

/** SHA-256 of the IP address with a secret salt, as hex. The raw IP is never kept. */
export async function hashVisitor(ip: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function startOfUtcDay(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export async function joinWaitlist(
  input: WaitlistInput,
  ctx: {
    visitor: string;
    now: number;
    store: WaitlistStore;
    ownerEmail: string;
    notifyOwner: OwnerNotifier;
  }
): Promise<JoinResult> {
  const { store, visitor, now } = ctx;

  // Every submission counts toward the limit, valid or not.
  const recent = await store.countAttempts(visitor, now - RATE_LIMIT.windowMs);
  if (recent >= RATE_LIMIT.max) return { status: 'rate_limited' };
  await store.recordAttempt(visitor, now);

  // Bots get a convincing answer and nothing is saved.
  if (isHoneypotFilled(input)) {
    return { status: 'joined', position: (await store.count()) + 1 };
  }

  const valid = validateWaitlist(input);
  if (!valid.ok) return { status: 'invalid', errors: valid.errors };

  const entry: WaitlistEntry = {
    email: valid.email,
    devices: valid.devices,
    createdAt: new Date(now)
  };
  const saved = await store.insert(entry);
  if (saved === 'duplicate') return { status: 'duplicate' };

  // Email only the owner, never the address that was typed in.
  const owner = ctx.ownerEmail.trim();
  if (owner) {
    try {
      const sentToday = await store.countOwnerEmailsSince(startOfUtcDay(now));
      if (sentToday < OWNER_EMAIL_DAILY_CAP) {
        const sent = await ctx.notifyOwner(owner, { ...entry, position: saved.position });
        if (sent) await store.markOwnerNotified(entry.email);
      }
    } catch (error) {
      // The sign-up is saved; a failed email must not fail it.
      console.warn('[waitlist] owner email failed', error);
    }
  }

  return { status: 'joined', position: saved.position };
}
