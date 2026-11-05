import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader, getRequestIP } from '@tanstack/react-start/server';
import { HONEYPOT_FIELD, hashVisitor, joinWaitlist, type WaitlistInput } from '~/lib/waitlist';
import { d1WaitlistStore, emailOwner, ipHashSalt } from '~/server/waitlist-store';
import { siteConfig } from '~/site.config';

/** The waitlist form posts here. All checks happen on the server. */
export const submitWaitlist = createServerFn({ method: 'POST' })
  .validator((data: unknown): WaitlistInput => {
    const input = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
    return {
      email: input.email,
      devices: input.devices,
      [HONEYPOT_FIELD]: input[HONEYPOT_FIELD]
    };
  })
  .handler(async ({ data }) => {
    const ip =
      getRequestHeader('cf-connecting-ip') ||
      getRequestIP({ xForwardedFor: true }) ||
      'unknown';
    const visitor = await hashVisitor(ip, await ipHashSalt());
    return joinWaitlist(data, {
      visitor,
      now: Date.now(),
      store: d1WaitlistStore,
      ownerEmail: siteConfig.ownerEmail,
      notifyOwner: emailOwner
    });
  });
