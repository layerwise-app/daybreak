import { describe, expect, it, vi } from 'vitest';
import {
  OWNER_EMAIL_DAILY_CAP,
  RATE_LIMIT,
  hashVisitor,
  joinWaitlist,
  validateWaitlist,
  type OwnerNotifier,
  type WaitlistEntry,
  type WaitlistStore
} from '~/lib/waitlist';

function memoryStore() {
  const rows: (WaitlistEntry & { position: number; notified: boolean })[] = [];
  const attempts: { visitor: string; at: number }[] = [];
  const store: WaitlistStore = {
    countAttempts: async (visitor, since) =>
      attempts.filter((a) => a.visitor === visitor && a.at >= since).length,
    recordAttempt: async (visitor, at) => {
      attempts.push({ visitor, at });
    },
    insert: async (entry) => {
      if (rows.some((r) => r.email === entry.email)) return 'duplicate';
      const position = rows.length + 1;
      rows.push({ ...entry, position, notified: false });
      return { position };
    },
    count: async () => rows.length,
    countOwnerEmailsSince: async (since) =>
      rows.filter((r) => r.notified && r.createdAt.getTime() >= since).length,
    markOwnerNotified: async (email) => {
      const row = rows.find((r) => r.email === email);
      if (row) row.notified = true;
    }
  };
  return { store, rows, attempts };
}

const NOW = Date.UTC(2027, 2, 11, 9, 30);

function setup(overrides: { ownerEmail?: string; notify?: OwnerNotifier } = {}) {
  const memory = memoryStore();
  const notifyOwner = vi.fn<OwnerNotifier>(overrides.notify ?? (async () => true));
  let visitor = 'visitor-a';
  let now = NOW;
  const join = (input: Record<string, unknown>) =>
    joinWaitlist(input, {
      visitor,
      now,
      store: memory.store,
      ownerEmail: overrides.ownerEmail ?? '',
      notifyOwner
    });
  return {
    ...memory,
    notifyOwner,
    join,
    as: (v: string) => {
      visitor = v;
    },
    at: (t: number) => {
      now = t;
    }
  };
}

const valid = { email: 'ana@example.com', devices: ['iphone', 'mac'] };

describe('validateWaitlist', () => {
  it('accepts an email and at least one device', () => {
    expect(validateWaitlist({ email: '  Ana@Example.com ', devices: ['mac'] })).toEqual({
      ok: true,
      email: 'ana@example.com',
      devices: ['mac']
    });
  });

  it('requires a real-looking email', () => {
    for (const email of ['', 'ana', 'ana@', 'ana@example', 'a b@example.com', 42]) {
      const result = validateWaitlist({ email, devices: ['mac'] });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.email).toBeTruthy();
    }
    expect(validateWaitlist({ email: `${'a'.repeat(250)}@x.com`, devices: ['mac'] }).ok).toBe(false);
  });

  it('requires at least one known device', () => {
    for (const devices of [[], undefined, 'mac', ['android'], ['mac', 'watch']]) {
      const result = validateWaitlist({ email: 'ana@example.com', devices });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.devices).toBeTruthy();
    }
  });

  it('keeps devices in a fixed order without repeats', () => {
    const result = validateWaitlist({ email: 'a@b.co', devices: ['mac', 'iphone', 'mac'] });
    expect(result).toMatchObject({ ok: true, devices: ['iphone', 'mac'] });
  });
});

describe('joinWaitlist', () => {
  it('saves a sign-up and returns the place in line', async () => {
    const t = setup();
    expect(await t.join(valid)).toEqual({ status: 'joined', position: 1 });
    t.as('visitor-b');
    expect(await t.join({ ...valid, email: 'sam@example.com' })).toEqual({
      status: 'joined',
      position: 2
    });
    expect(t.rows.map((r) => r.email)).toEqual(['ana@example.com', 'sam@example.com']);
  });

  it('says "already on the list" for the same email and adds no row', async () => {
    const t = setup();
    await t.join(valid);
    expect(await t.join({ ...valid, email: 'ANA@example.com ' })).toEqual({ status: 'duplicate' });
    expect(t.rows).toHaveLength(1);
  });

  it('returns field errors and saves nothing for bad input', async () => {
    const t = setup();
    const result = await t.join({ email: 'nope', devices: [] });
    expect(result.status).toBe('invalid');
    expect(t.rows).toHaveLength(0);
  });

  it('pretends to accept honeypot submissions but saves nothing', async () => {
    const t = setup({ ownerEmail: 'owner@example.com' });
    const result = await t.join({ ...valid, website: 'https://spam.example' });
    expect(result.status).toBe('joined');
    expect(t.rows).toHaveLength(0);
    expect(t.notifyOwner).not.toHaveBeenCalled();
  });

  it('allows five submissions per visitor per hour', async () => {
    const t = setup();
    for (let i = 0; i < RATE_LIMIT.max; i++) {
      expect((await t.join({ ...valid, email: `p${i}@example.com` })).status).toBe('joined');
    }
    expect(await t.join({ ...valid, email: 'p9@example.com' })).toEqual({ status: 'rate_limited' });
    expect(t.rows).toHaveLength(RATE_LIMIT.max);

    // Another visitor is unaffected, and the first can try again an hour later.
    t.as('visitor-b');
    expect((await t.join({ ...valid, email: 'q@example.com' })).status).toBe('joined');
    t.as('visitor-a');
    t.at(NOW + RATE_LIMIT.windowMs + 1);
    expect((await t.join({ ...valid, email: 'p9@example.com' })).status).toBe('joined');
  });

  it('counts invalid and duplicate submissions toward the limit', async () => {
    const t = setup();
    for (let i = 0; i < RATE_LIMIT.max; i++) await t.join({ email: 'bad', devices: [] });
    expect(await t.join(valid)).toEqual({ status: 'rate_limited' });
  });

  it('emails nobody when ownerEmail is empty', async () => {
    const t = setup();
    await t.join(valid);
    expect(t.notifyOwner).not.toHaveBeenCalled();
  });

  it('emails only the owner, never the visitor', async () => {
    const t = setup({ ownerEmail: 'owner@example.com' });
    await t.join(valid);
    expect(t.notifyOwner).toHaveBeenCalledTimes(1);
    expect(t.notifyOwner.mock.calls[0][0]).toBe('owner@example.com');
    expect(t.notifyOwner.mock.calls[0][1]).toMatchObject({ email: 'ana@example.com', position: 1 });
  });

  it('stops emailing after the daily cap but keeps saving', async () => {
    const t = setup({ ownerEmail: 'owner@example.com' });
    for (let i = 0; i < OWNER_EMAIL_DAILY_CAP + 3; i++) {
      t.as(`visitor-${i}`);
      expect((await t.join({ ...valid, email: `p${i}@example.com` })).status).toBe('joined');
    }
    expect(t.rows).toHaveLength(OWNER_EMAIL_DAILY_CAP + 3);
    expect(t.notifyOwner).toHaveBeenCalledTimes(OWNER_EMAIL_DAILY_CAP);

    // The next UTC day starts a fresh allowance.
    t.at(NOW + 24 * 60 * 60 * 1000);
    t.as('tomorrow');
    await t.join({ ...valid, email: 'next-day@example.com' });
    expect(t.notifyOwner).toHaveBeenCalledTimes(OWNER_EMAIL_DAILY_CAP + 1);
  });

  it('still saves the sign-up when the email fails', async () => {
    const t = setup({
      ownerEmail: 'owner@example.com',
      notify: async () => {
        throw new Error('down');
      }
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await t.join(valid)).toEqual({ status: 'joined', position: 1 });
    expect(t.rows).toHaveLength(1);
    warn.mockRestore();
  });
});

describe('hashVisitor', () => {
  it('is stable, salted, and never contains the IP', async () => {
    const a = await hashVisitor('203.0.113.7', 'salt-1');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(await hashVisitor('203.0.113.7', 'salt-1'));
    expect(a).not.toBe(await hashVisitor('203.0.113.7', 'salt-2'));
    expect(a).not.toContain('203');
  });
});
