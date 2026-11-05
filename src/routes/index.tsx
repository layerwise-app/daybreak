import { createFileRoute } from '@tanstack/react-router';
import { Bento } from '~/components/home/Bento';
import { Everywhere } from '~/components/home/Everywhere';
import { Faq } from '~/components/home/Faq';
import { Hero } from '~/components/home/Hero';
import { PlanMyDay } from '~/components/home/PlanMyDay';
import { Quotes } from '~/components/home/Quotes';
import { Waitlist } from '~/components/home/Waitlist';
import { Footer } from '~/components/site/Footer';
import { Header } from '~/components/site/Header';
import { home } from '~/content/home';
import { site, siteUrl } from '~/lib/site';
import { siteConfig } from '~/site.config';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/')({
  head: () =>
    seo({
      title: home.seo.title,
      description: home.seo.description,
      path: '/',
      image: '/og/home.png',
      imageAlt: site.imageAlt,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteConfig.company,
          url: siteUrl('/'),
          logo: siteUrl('/logo.png'),
          address: { '@type': 'PostalAddress', addressLocality: siteConfig.companyCity, addressCountry: 'AU' }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: siteConfig.product,
          description: siteConfig.description,
          applicationCategory: 'ProductivityApplication',
          operatingSystem: 'iOS, iPadOS, macOS',
          url: siteUrl('/'),
          image: siteUrl('/og/home.png'),
          publisher: { '@type': 'Organization', name: siteConfig.company }
        }
      ]
    }),
  component: Home
});

function Home() {
  return (
    <>
      <Header />
      <main id='main'>
        <Hero />
        <Bento />
        <PlanMyDay />
        <Everywhere />
        <Quotes />
        <Faq />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}
