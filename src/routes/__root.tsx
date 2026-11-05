/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext
} from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type * as React from 'react';
import sansFont from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2?url';
import numeralFont from '@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2?url';
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary';
import { NotFound } from '~/components/NotFound';
import { site } from '~/lib/site';
import { siteConfig } from '~/site.config';
import { seo } from '~/utils/seo';
import '~/styles/app.css';

/** `site.config.ts` colors and fonts as CSS variables. */
const themeCss = `:root{${Object.entries({
  paper: siteConfig.colors.paper,
  'paper-deep': siteConfig.colors.paperDeep,
  ink: siteConfig.colors.ink,
  'ink-soft': siteConfig.colors.inkSoft,
  'ink-muted': siteConfig.colors.inkMuted,
  peach: siteConfig.colors.peach,
  'peach-soft': siteConfig.colors.peachSoft,
  butter: siteConfig.colors.butter,
  'butter-soft': siteConfig.colors.butterSoft,
  sky: siteConfig.colors.sky,
  'sky-soft': siteConfig.colors.skySoft,
  coral: siteConfig.colors.coral,
  'font-site-sans': siteConfig.fonts.sans,
  'font-site-numerals': siteConfig.fonts.numerals
})
  .map(([name, value]) => `--${name}:${value}`)
  .join(';')}}`;

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  // Site-wide defaults; each page's `seo()` overrides tags with the same name.
  head: ({ matches }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: siteConfig.colors.paper },
      ...(site.googleSiteVerification
        ? [{ name: 'google-site-verification', content: site.googleSiteVerification }]
        : []),
      // Only the root route matched: this is the 404 page.
      ...(matches.length <= 1 || matches.some((m) => m.status === 'notFound')
        ? seo({
            title: `Page not found — ${site.name}`,
            description: 'This page isn’t on anyone’s calendar.',
            image: '/og/404.png',
            noindex: true
          }).meta
        : seo({ title: site.name, description: site.description }).meta)
    ],
    links: [
      { rel: 'preload', href: sansFont, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'preload', href: numeralFont, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' }
    ]
  }),
  errorComponent: (props) => (
    <RootDocument>
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  notFoundComponent: () => <NotFound />,
  component: RootComponent
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
