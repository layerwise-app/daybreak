/**
 * Site-wide settings for Daybreak. Change names, navigation, button labels,
 * colors, and fonts here; every page reads from this file.
 */

export type NavLink = { label: string; href: string };
export type SocialLink = { label: string; href: string };

export const siteConfig = {
  company: 'Fennel Studio',
  companyCity: 'Melbourne',
  product: 'Daybreak',
  tagline: 'A to-do list that knows what time it is.',
  description:
    'Daybreak is a calendar and day planner for iPhone, iPad, and Mac that fits your to-dos into the time you really have. Coming spring 2027.',
  launch: 'Spring 2027',
  platforms: ['iPhone', 'iPad', 'Mac'] as const,

  /** Links in the header. Anchors point at sections on the home page. */
  nav: [
    { label: 'Features', href: '/#features' },
    { label: 'Plan my day', href: '/#plan' },
    { label: 'Devices', href: '/#devices' },
    { label: 'Questions', href: '/#questions' }
  ] satisfies NavLink[],

  /** Every button that asks a visitor to act points at the waitlist form. */
  cta: {
    primary: 'Join the waitlist',
    short: 'Join waitlist',
    href: '/#waitlist'
  },

  footerLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Questions', href: '/#questions' }
  ] satisfies NavLink[],

  /**
   * Shown in the footer when set, like
   * `{ label: 'Instagram', href: 'https://instagram.com/your-account' }`.
   */
  social: [] as SocialLink[],

  /**
   * Where new waitlist sign-ups are emailed, like `hello@yourstudio.com`.
   * Empty sends no email; sign-ups are always saved to the database.
   */
  ownerEmail: '',

  /**
   * The sunrise palette. These feed the CSS variables in `src/styles/app.css`
   * (`--color-paper`, `--color-peach`, …), so a change here recolors the site.
   */
  colors: {
    paper: '#fbf7f1',
    paperDeep: '#f3ece2',
    ink: '#1c1a17',
    inkSoft: '#4b463f',
    inkMuted: '#6b645a',
    peach: '#ffc3a0',
    peachSoft: '#ffe6d6',
    butter: '#ffd977',
    butterSoft: '#fff2cc',
    sky: '#9fd0f4',
    skySoft: '#dff0fc',
    coral: '#ef5f37'
  },

  /**
   * Self-hosted, open-license fonts. To change them, install another
   * `@fontsource-variable/*` package, import it in `src/styles/app.css`, and
   * set the family names here.
   */
  fonts: {
    sans: "'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif",
    numerals: "'Nunito Variable', ui-rounded, ui-sans-serif, system-ui, sans-serif"
  }
} as const;

export type SiteConfig = typeof siteConfig;
