/**
 * Connects the waitlist rules in `~/lib/waitlist` to D1 and `env.EMAIL`.
 * Server code only.
 */
import { env } from 'cloudflare:workers';
import { and, count, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '~/db';
import { appSecrets, waitlist, waitlistAttempts } from '~/db/schema';
import {
  DEVICE_LABELS,
  RATE_LIMIT,
  type OwnerNotifier,
  type WaitlistStore
} from '~/lib/waitlist';
import { siteConfig } from '~/site.config';

export const d1WaitlistStore: WaitlistStore = {
  async countAttempts(visitor, since) {
    // Old attempts are only needed for the rate limit; drop them.
    await db
      .delete(waitlistAttempts)
      .where(lt(waitlistAttempts.createdAt, new Date(since - RATE_LIMIT.windowMs)));
    const [row] = await db
      .select({ n: count() })
      .from(waitlistAttempts)
      .where(
        and(eq(waitlistAttempts.visitor, visitor), gte(waitlistAttempts.createdAt, new Date(since)))
      );
    return row?.n ?? 0;
  },

  async recordAttempt(visitor, at) {
    await db.insert(waitlistAttempts).values({ visitor, createdAt: new Date(at) });
  },

  async insert(entry) {
    // The position is counted in the same statement that saves the row.
    const rows = await db
      .insert(waitlist)
      .values({
        email: entry.email,
        devices: entry.devices,
        createdAt: entry.createdAt,
        position: sql`(SELECT COUNT(*) + 1 FROM ${waitlist})`
      })
      .onConflictDoNothing({ target: waitlist.email })
      .returning({ position: waitlist.position });
    return rows[0] ? { position: rows[0].position } : 'duplicate';
  },

  async count() {
    const [row] = await db.select({ n: count() }).from(waitlist);
    return row?.n ?? 0;
  },

  async countOwnerEmailsSince(since) {
    const [row] = await db
      .select({ n: count() })
      .from(waitlist)
      .where(and(eq(waitlist.ownerNotified, true), gte(waitlist.createdAt, new Date(since))));
    return row?.n ?? 0;
  },

  async markOwnerNotified(email) {
    await db.update(waitlist).set({ ownerNotified: true }).where(eq(waitlist.email, email));
  }
};

/** A random salt made once per database, so IP hashes can't be matched elsewhere. */
export async function ipHashSalt(): Promise<string> {
  const fresh = [...crypto.getRandomValues(new Uint8Array(32))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  await db.insert(appSecrets).values({ name: 'ip-hash-salt', value: fresh }).onConflictDoNothing();
  const [row] = await db
    .select({ value: appSecrets.value })
    .from(appSecrets)
    .where(eq(appSecrets.name, 'ip-hash-salt'));
  return row?.value ?? fresh;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** Emails the owner about one sign-up. The recipient is always `ownerEmail`. */
export const emailOwner: OwnerNotifier = async (ownerEmail, entry) => {
  const devices = entry.devices.map((d) => DEVICE_LABELS[d]).join(', ');
  const position = entry.position.toLocaleString('en-AU');
  const { error } = await env.EMAIL.send({
    to: ownerEmail,
    subject: `New ${siteConfig.product} waitlist sign-up (#${position})`,
    text: `${entry.email} joined the ${siteConfig.product} waitlist as #${position}.\nDevices: ${devices}\n\nAll sign-ups are in your project's Database panel in Layerwise (table: waitlist).`,
    html: `<p><strong>${escapeHtml(entry.email)}</strong> joined the ${escapeHtml(siteConfig.product)} waitlist as <strong>#${position}</strong>.</p><p>Devices: ${escapeHtml(devices)}</p><p style="color:#6b645a">All sign-ups are in your project’s Database panel in Layerwise (table: waitlist).</p>`
  });
  if (error) {
    console.warn(`[waitlist] owner email: ${error.code} ${error.message}`);
    return false;
  }
  return true;
};
