import type { MetadataRoute } from 'next';
import { supabaseServidor } from '@/lib/supabase-server';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suplementosexpress.com.br';
  const sb = await supabaseServidor();
  const { data } = await sb.from('produto_publico').select('slug,categoria').limit(2000);

  const cats = [...new Set((data ?? []).map(p => p.categoria))];
  return [
    { url: site, changeFrequency: 'daily', priority: 1 },
    ...cats.map(c => ({ url: `${site}/c/${c}`, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...(data ?? []).map(p => ({ url: `${site}/p/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
  ];
}
