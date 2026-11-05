import { createFileRoute, Link } from '@tanstack/react-router';
import { TextPage } from '~/components/site/PageShell';
import { siteConfig } from '~/site.config';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/privacy')({
  head: () =>
    seo({
      title: `Privacy — ${siteConfig.product}`,
      description: `How ${siteConfig.product} handles your data: your plans stay on your devices and in your iCloud, with no ads and no selling data.`,
      path: '/privacy',
      image: '/og/privacy.png',
      imageAlt: `${siteConfig.product} privacy`
    }),
  component: Privacy
});

function Privacy() {
  const { product, company } = siteConfig;
  return (
    <TextPage eyebrow='Privacy' title='Your day is yours.' updated='5 November 2026'>
      <p>
        {product} is a calendar and day planner made by {company}. We wrote this page to be read, not
        skimmed past. The short version: your plans stay with you, and we don’t make money from your
        data.
      </p>

      <h2>Your plans stay on your devices</h2>
      <p>
        Your events, to-dos, habits, and plans live on your iPhone, iPad, and Mac, and sync between them
        through your own iCloud account. {company} doesn’t run servers that store them, so we can’t read
        them, share them, or lose them.
      </p>
      <p>
        When {product} shows calendars from accounts you’ve added to your device, like Google or Exchange,
        it reads them through your device. Nothing passes through us.
      </p>

      <h2>No ads, no selling data</h2>
      <ul>
        <li>There are no ads in {product}, and there won’t be.</li>
        <li>We don’t sell, rent, or trade personal information. Not to advertisers, not to anyone.</li>
        <li>We don’t use third-party tracking in the app.</li>
      </ul>

      <h2>What the waitlist stores</h2>
      <p>When you join the waitlist on this site, we save:</p>
      <ul>
        <li>your email address,</li>
        <li>the devices you said you’d use {product} on,</li>
        <li>your place in line and the time you joined.</li>
      </ul>
      <p>
        To stop spam, we also keep a scrambled, one-way code made from your internet address for up to
        two hours. We never store the address itself. We use your email only to invite you to the beta
        and to tell you when {product} launches: at most two emails. To be removed, reply to either email
        and we’ll delete your entry.
      </p>

      <h2>This website</h2>
      <p>
        This site doesn’t use advertising cookies or cross-site trackers. Like most websites, our host
        keeps short-lived server logs to keep the site running and secure.
      </p>

      <h2>Changes and questions</h2>
      <p>
        If we change how we handle data, we’ll update this page and the date above, and email the
        waitlist if the change matters to you. You can also read our <Link to='/terms'>terms</Link>.
      </p>
    </TextPage>
  );
}
