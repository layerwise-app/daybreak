import { createFileRoute, Link } from '@tanstack/react-router';
import { TextPage } from '~/components/site/PageShell';
import { siteConfig } from '~/site.config';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/terms')({
  head: () =>
    seo({
      title: `Terms — ${siteConfig.product}`,
      description: `The plain-language terms for using the ${siteConfig.product} website and joining its waitlist.`,
      path: '/terms',
      image: '/og/terms.png',
      imageAlt: `${siteConfig.product} terms`
    }),
  component: Terms
});

function Terms() {
  const { product, company, companyCity } = siteConfig;
  return (
    <TextPage eyebrow='Terms' title='The fine print, kept short.' updated='5 November 2026'>
      <p>
        These terms cover this website and the {product} waitlist. {product} is made by {company}, a small
        studio in {companyCity}, Australia. By using the site, you agree to them.
      </p>

      <h2>The waitlist</h2>
      <p>
        Joining is free and doesn’t commit you to anything. A place in line is our best guess at the order
        we’ll send beta invites in, not a promise of a date or a spot. One entry per person, please.
      </p>

      <h2>The app isn’t out yet</h2>
      <p>
        {product} is still being made. Features shown on this site, including the demos, may change before
        launch. When the app is released, it will come with its own terms through the App Store.
      </p>

      <h2>Using this site</h2>
      <ul>
        <li>Don’t try to break, overload, or misuse the site or the waitlist form.</li>
        <li>The words, designs, and drawings here belong to {company}. Please don’t copy them.</li>
        <li>The people and quotes on this site are illustrations, not real customers.</li>
      </ul>

      <h2>Liability</h2>
      <p>
        We work hard to keep the site accurate and running, but it’s provided as it is. To the extent the
        law allows, {company} isn’t liable for losses from using it. Nothing here limits rights you have
        under Australian Consumer Law.
      </p>

      <h2>Changes</h2>
      <p>
        If these terms change, we’ll update this page and the date above. How we handle your information is
        in our <Link to='/privacy'>privacy policy</Link>.
      </p>
    </TextPage>
  );
}
