import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

/**
 * A link from `site.config.ts`: `/#section` goes to a home page section,
 * `/page` to a page, and anything else is an external link in a new tab.
 */
export function SiteLink({
  href,
  className,
  children,
  onClick
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  // Section links are plain anchors: they scroll on the home page and load it
  // from other pages, without marking every section as the current page.
  if (href.startsWith('/#') || href.startsWith('#')) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} target='_blank' rel='noopener noreferrer' onClick={onClick}>
      {children}
    </a>
  );
}
