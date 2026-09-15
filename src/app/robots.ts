import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suplementosexpress.com.br';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/checkout', '/conta'] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
