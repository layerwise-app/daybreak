import { defineConfig } from 'vitest/config';

// Tests run in Node without the Cloudflare and TanStack plugins.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { include: ['tests/**/*.test.ts'] }
});
