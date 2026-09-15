import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseServidor } from '@/lib/supabase-server';
import { brl } from '@/lib/dinheiro';
import BotaoComprar from '@/components/BotaoComprar';
import SeletorVariacao from '@/components/SeletorVariacao';
import { linkWhatsapp } from '@/lib/contato';
import { COLUNAS_VARIACAO, nomeLinha, nomeCompleto, type Variacao } from '@/lib/produto';

export const revalidate = 300;

type Produto = {
  id: string; slug: string; nome: string; marca: string; categoria: string;
  grupo: string | null; linha: string | null; tamanho: string | null;
  sabor: string | null; peso: string | null; volume: string | null; capsulas: number | null;
  preco_venda_cents: number; preco_referencia_cents: number;
  descricao: string | null; beneficios: string[]; modo_uso: string | null;
  nutricional: string | null; foto: string | null; disponibilidade: string;
};

async function buscar(slug: string) {
  const sb = await supabaseServidor();
  const { data } = await sb.from('produto_publico').select('*').eq('slug', slug).maybeSingle();
  return data as Produto | null;
}

/** Os outros SKUs da mesma linha: e o que vira os chips de tamanho e sabor. */
async function irmaos(grupo: string | null): Promise<Variacao[]> {
  if (!grupo) return [];
  const sb = await supabaseServidor();
  const { data } = await sb.from('produto_publico')
    .select(COLUNAS_VARIACAO)
    .eq('grupo', grupo)
    .order('preco_venda_cents', { ascending: true });
  return (data ?? []) as unknown as Variacao[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await buscar(slug);
  if (!p) return {};
  return {
    title: `${nomeCompleto(p)} - ${p.marca}`,
    description: (p.descricao ?? '').slice(0, 155),
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: { images: p.foto ? [`/produtos/${p.foto}`] : [] },
  };
}

export default async function PaginaProduto({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await buscar(slug);
  if (!p) notFound();

  const variacoes = await irmaos(p.grupo);
  const temVariacao = variacoes.length > 1;
  const economia = p.preco_referencia_cents - p.preco_venda_cents;
  const titulo = nomeLinha(p);
  const completo = nomeCompleto(p);

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: completo,
    brand: { '@type': 'Brand', name: p.marca },
    description: p.descricao ?? undefined,
    offers: {
      '@type': 'Offer', priceCurrency: 'BRL', price: (p.preco_venda_cents / 100).toFixed(2),
      availability: p.disponibilidade === 'indisponivel'
        ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square rounded-card border border-neve-200 bg-white lg:sticky lg:top-28 lg:self-start">
          {p.foto && (
            <Image src={`/produtos/${p.foto}`} alt={completo} fill priority
                   sizes="(max-width:1024px) 100vw, 500px" className="object-contain p-6" />
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neve-600">{p.marca}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight">{titulo}</h1>
          {temVariacao && (p.tamanho || p.sabor) && (
            <p className="mt-1 text-sm text-neve-600">
              {[p.tamanho, p.sabor].filter(Boolean).join(' · ')}
            </p>
          )}

          <div className="mt-5 flex items-end gap-3">
            {economia > 0 && <s className="text-neve-600 tabular">{brl(p.preco_referencia_cents)}</s>}
            <span className="font-display text-4xl font-extrabold tabular">{brl(p.preco_venda_cents)}</span>
          </div>
          <p className="mt-1 text-sm text-ok">No Pix. Em até 6x sem juros no cartão.</p>

          {temVariacao && <SeletorVariacao variacoes={variacoes} atual={{
            id: p.id, slug: p.slug, sabor: p.sabor, tamanho: p.tamanho,
            preco_venda_cents: p.preco_venda_cents, disponibilidade: p.disponibilidade,
          }} />}

          <p className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ouro-100 px-3 py-2 text-sm font-semibold text-ouro-700">
            {p.disponibilidade === 'pronta_entrega'
              ? 'Pronta entrega: pediu até 16h, recebe hoje'
              : 'Sob encomenda: chega em até 24h'}
          </p>

          <BotaoComprar produto={{
            id: p.id, slug: p.slug, nome: completo,
            preco_cents: p.preco_venda_cents, foto: p.foto,
          }} />

          <a
            href={linkWhatsapp(`Oi! Queria saber sobre o ${completo} (${p.marca}).`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-neve-600 underline hover:text-ok"
          >
            Tirar uma dúvida no WhatsApp
          </a>

          {p.descricao && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-bold">Sobre o produto</h2>
              <p className="mt-2 leading-relaxed text-tinta-700">{p.descricao}</p>
            </section>
          )}

          {p.beneficios?.length > 0 && (
            <section className="mt-6">
              <h2 className="font-display text-lg font-bold">Destaques</h2>
              <ul className="mt-2 space-y-1.5">
                {p.beneficios.map(b => (
                  <li key={b} className="flex gap-2 text-tinta-700">
                    <span aria-hidden className="text-ouro-700">✓</span>{b}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.modo_uso && (
            <section className="mt-6">
              <h2 className="font-display text-lg font-bold">Como usar</h2>
              <p className="mt-2 text-tinta-700">{p.modo_uso}</p>
            </section>
          )}

          <p className="mt-8 border-t border-neve-200 pt-4 text-xs leading-relaxed text-neve-600">
            Suplemento alimentar. Não substitui uma alimentação equilibrada e não possui
            finalidade terapêutica. Consulte um nutricionista ou médico.
          </p>
        </div>
      </div>
    </div>
  );
}
