import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServidor } from '@/lib/supabase-server';
import CardProduto from '@/components/CardProduto';
import { COLUNAS_VITRINE, type ItemVitrine } from '@/lib/produto';
import { palavrasBusca, ordenarPorRelevancia } from '@/lib/busca';
import { linkWhatsapp } from '@/lib/contato';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Busca',
  robots: { index: false, follow: true },   // pagina de resultado nao vai para o Google
};

export default async function Busca({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const termo = q.slice(0, 80);
  const palavras = palavrasBusca(termo);

  let itens: ItemVitrine[] = [];
  if (palavras.length) {
    const sb = await supabaseServidor();
    // cada palavra e um filtro a mais: PostgREST junta com AND, entao
    // "whey chocolate" so traz quem tem as duas coisas.
    let consulta = sb.from('vitrine').select(COLUNAS_VITRINE).limit(60);
    for (const p of palavras) consulta = consulta.like('busca', `%${p}%`);
    const { data } = await consulta;
    itens = ordenarPorRelevancia((data ?? []) as unknown as ItemVitrine[], termo);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-extrabold">
        {termo ? <>Resultados para “{termo}”</> : 'Buscar'}
      </h1>

      {palavras.length === 0 ? (
        <p className="mt-3 text-neve-600">Digite pelo menos duas letras para buscar.</p>
      ) : (
        <p className="mt-1 text-sm text-neve-600 tabular">
          {itens.length} {itens.length === 1 ? 'produto' : 'produtos'}
        </p>
      )}

      {itens.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {itens.map(p => <CardProduto key={p.id} p={p} />)}
        </div>
      )}

      {palavras.length > 0 && itens.length === 0 && (
        <div className="mt-8 rounded-card border border-neve-200 p-8 text-center">
          <p className="font-semibold">Não achei nada para “{termo}”.</p>
          <p className="mt-2 text-sm text-neve-600">
            Tenta o nome da marca ou só a primeira palavra do produto.
          </p>
          <a
            href={linkWhatsapp(`Oi! Procurei por "${termo}" no site e não achei. Vocês têm?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block rounded-lg bg-ok px-5 py-3 font-display text-sm font-bold text-white"
          >
            Perguntar no WhatsApp
          </a>
          <p className="mt-4 text-sm">
            <Link href="/c/proteina" className="underline hover:text-ouro-700">ver o catálogo</Link>
          </p>
        </div>
      )}
    </div>
  );
}
