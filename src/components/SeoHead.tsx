import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SeoHeadProps {
  /** Page-specific title; the localized brand suffix is appended automatically. */
  title: string;
  /** Plain-text description for <meta name="description"> and og:description. */
  description?: string;
  /** Absolute image URL for og:image (e.g. a Supabase Storage URL). */
  image?: string;
}

// Site-wide social-share fallback used when a page has no image of its own.
const DEFAULT_OG_IMAGE = '/twitter-card.png';

/**
 * Sets per-page document head (title + description + Open Graph) via
 * react-helmet-async. On live visits this keeps the browser-tab title and
 * social-share metadata correct per route; at build time the prerender step
 * (scripts/prerender.mjs) waits for these tags before snapshotting, so AI
 * crawlers and search engines see unique metadata per page instead of the
 * static index.html shell.
 */
const SeoHead = ({ title, description, image }: SeoHeadProps) => {
  const { t } = useTranslation();
  const suffix = t('meta.titleSuffix');
  const fullTitle = title ? `${title} | ${suffix}` : suffix;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta property="og:title" content={fullTitle} />
      {description && <meta name="description" content={description} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={image || DEFAULT_OG_IMAGE} />
      <meta name="twitter:image" content={image || DEFAULT_OG_IMAGE} />
    </Helmet>
  );
};

export default SeoHead;
