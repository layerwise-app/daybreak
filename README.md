<a href="https://layerwise.app" target="_blank" rel="noopener"><img src="https://layerwise.app/powered-by.png" alt="Powered by Layerwise" width="174" height="28" /></a>

# Daybreak

A landing page template for a calendar and day planner app: a scroll-driven hero
phone that plays a day from 7:00 to 22:00, eight live feature tiles, a "Plan my
day" demo, and a waitlist form. Daybreak, Fennel Studio, Ana Ruiz, and every quote
are fictional.

Built with TanStack Start, React, Tailwind CSS, and a D1 database, on Layerwise.

## Where things live

| What | File |
| --- | --- |
| Product and company name, tagline, navigation, button labels, social links, colors, fonts, `ownerEmail` | `src/site.config.ts` |
| Every headline, paragraph, tile, quote, and form message on the home page, in page order | `src/content/home.ts` |
| Questions and answers | `src/content/faq.ts` |
| Ana's Thursday: events, to-dos, and the week shown on the Mac | `src/content/sample-day.ts` |
| Screenshots or videos that replace drawn screens | `src/content/screens.ts` |
| Privacy and Terms text | `src/routes/privacy.tsx`, `src/routes/terms.tsx` |
| Pages listed in the sitemap | `sitemapPaths` in `src/lib/site.ts` |

## Rewrite the copy

Change the text in `src/content/home.ts` (home page) or `src/site.config.ts`
(name, tagline, nav, buttons). Components read from these files, so no component
needs editing. Changing Ana's events or to-dos in `src/content/sample-day.ts`
updates the hero phone, the tiles, and Plan my day together. Each to-do has a
`kind`: `work` to-dos stay inside `workHours`, and `personal` ones may also go
in the evening; nothing starts after `lastStart`. Run `pnpm test` after
changing the day: it checks every plan Shuffle can produce against these rules.

After changing a page title or the hero headline, run `pnpm share-images` to
redraw the link preview images in `public/og/`.

## Add an item

Questions and quotes are lists; add an entry and it appears in place.

- **A question:** add `{ question: '…', answer: '…' }` to `faq` in
  `src/content/faq.ts`. It shows in the Questions section, in list order.
- **A quote:** add `{ name: '…', role: '…', quote: '…' }` to `quotes.items` in
  `src/content/home.ts`.

Neither creates a page, so the sitemap doesn't change. A new page needs a route
in `src/routes/` with `seo({ title, description, path })`, and its path added to
`sitemapPaths` in `src/lib/site.ts`.

## Replace a drawn screen with a screenshot or video

Each product screen is a React component behind `ScreenSlot`. The slots are
`hero-today` (hero phone), `devices-iphone`, `devices-ipad`, `devices-mac`
(Everywhere you are), and `not-found` (404 page).

1. Prepare the image:
   ```bash
   pnpm add-images path/to/today.png --name today
   ```
   This writes 800, 1600, and 2880 px WebP files to `public/images/` and adds
   `today` (size and blur placeholder) to `src/content/images.json`. GIFs are
   copied as they are; SVG is rejected.
2. Point a slot at it in `src/content/screens.ts`:
   ```ts
   export const screens: Partial<Record<ScreenId, ScreenMedia>> = {
     'devices-iphone': { type: 'image', image: 'today', alt: 'Daybreak Today view on iPhone' }
   };
   ```
   For a video, put the file in `public/` and use
   `{ type: 'video', src: '/videos/week.mp4', poster: 'week', alt: '…' }`. The
   poster is an image name from step 1. Videos play muted, loop only while on
   screen, and show the poster when reduced motion is on.

Use a full-screen capture from the matching device: a portrait iPhone, a
landscape iPad, a Mac. Images fill the screen and are cropped at the edges if
the shape differs. To go back to the drawn screen, delete the entry.

## Change fonts and colors

- **Colors:** edit `colors` in `src/site.config.ts`. They become CSS variables
  (`--color-peach` and so on), so the whole site recolors.
- **Fonts:** both fonts are self-hosted from `@fontsource-variable` packages.
  To switch, `pnpm add @fontsource-variable/<font>`, swap the two `@import`
  lines at the top of `src/styles/app.css`, swap the two `.woff2?url` imports
  in `src/routes/__root.tsx` (they preload the fonts), and set the family names
  in `fonts` in `src/site.config.ts`. Pick open-license fonts.
- **Logo:** `public/logo.svg` and `LogoMark` in `src/components/site/Logo.tsx`.
  After changing the SVG, `pnpm icons` regenerates `logo.png` and every favicon.

## Waitlist sign-ups

Submissions are saved in the project's database. In Layerwise, open
**Database** and choose the `waitlist` table to see each email, the devices
picked, the position, and when they joined. Sign-ups from the local preview
stay in the local database; the published site has its own.

The other two tables support the form: `waitlist_attempts` holds salted hashes
for the 5-per-hour rate limit (no IP addresses are stored), and `app_secrets`
holds the salt. Leave both in place.

## Get an email for each sign-up

Set `ownerEmail` in `src/site.config.ts` to your address. Each new sign-up then
sends you one short email through Layerwise Email, at most 100 a day. Visitors
are never emailed. Leave it empty (the default) to only save sign-ups. Email is
sent once the site is published; in the local preview it lands in **Email →
Local** instead.

## Commands

```bash
pnpm check-types    # TypeScript
pnpm lint           # oxlint
pnpm test           # planner, quick add, reschedule, and waitlist rules
pnpm check:screens <site address>   # hour labels line up with events in every device frame (needs Google Chrome)
pnpm build
pnpm add-images <files…> [--name <name>]
pnpm share-images   # redraw public/og/*.png (needs Google Chrome)
pnpm icons          # logo.png and favicons from public/logo.svg
```

## Fonts and credits

- [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) by Mathieu
  Triay, SIL Open Font License 1.1 (`licenses/bricolage-grotesque-OFL.txt`).
- [Nunito](https://github.com/googlefonts/nunito) by Vernon Adams, Cyreal, and
  Jacques Le Bailly, SIL Open Font License 1.1 (`licenses/nunito-OFL.txt`).

The template has no maps, so it uses no Natural Earth data.
