import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { Device } from '~/lib/waitlist';

// After changing a table, run `pnpm run db:generate --name <what_changed>`
// and `pnpm run db:migrate`. Migrations reach the published database on publish.

/** One row per person on the waitlist. Shown in Layerwise → Database. */
export const waitlist = sqliteTable(
  'waitlist',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    /** Devices they'd use Daybreak on: `iphone`, `ipad`, `mac`. */
    devices: text('devices', { mode: 'json' }).$type<Device[]>().notNull(),
    /** Their place in line when they joined. */
    position: integer('position').notNull(),
    /** Whether the owner was emailed about this sign-up. */
    ownerNotified: integer('owner_notified', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
  },
  (table) => [index('waitlist_created_at_idx').on(table.createdAt)]
);

/**
 * Recent form submissions, for the rate limit. `visitor` is a salted SHA-256
 * hash of the IP address; raw addresses are never stored, and rows older than
 * two hours are deleted.
 */
export const waitlistAttempts = sqliteTable(
  'waitlist_attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    visitor: text('visitor').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
  },
  (table) => [
    index('waitlist_attempts_visitor_idx').on(table.visitor, table.createdAt),
    index('waitlist_attempts_created_at_idx').on(table.createdAt)
  ]
);

/** Server-only values generated on first use, like the IP hash salt. */
export const appSecrets = sqliteTable('app_secrets', {
  name: text('name').primaryKey(),
  value: text('value').notNull()
});
