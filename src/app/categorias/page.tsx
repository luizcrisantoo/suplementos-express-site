import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServidor } from '@/lib/supabase-server';
import { CATEGORIAS } from '@/lib/categorias';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Todas as categorias',
  description:
    'Todo o catálogo da Suplementos Express por categoria: proteína, creatina, pré-treino, ' +
    'snacks, vitaminas e mais, com entrega no mesmo dia em Recife.',
  alternates: { canonical: '/categorias' },
};

export default async function Categorias() {
  const sb = await supabaseServidor();
  // uma coluna, uma linha por grupo: da para contar aqui sem view nova no banco
  const { data } = await sb.from('vitrine').select('categoria').limit(1000);

  const contagem = new Map<string, number>();
  for (const l of data ?? []) contagem.set(l.categoria, (contagem.get(l.categoria) ?? 0) + 1);
  const total = (data ?? []).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Você está em" className="text-sm text-neve-600">
        <Link href="/" className="hover:underline">Início</Link> <span aria-hidden>/</span> Categorias
      </nav>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Todas as categorias</h1>
      {total > 0 && (
        <p className="mt-1 text-sm text-neve-600 tabular">{total} produtos no catálogo</p>
      )}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIAS.map(c => {
          const n = contagem.get(c.slug) ?? 0;
          if (n === 0) return null;     // categoria sem produto nao vira link morto
          return (
            <li key={c.slug}>
              <Link
                href={`/c/${c.slug}`}
                className="flex items-center justify-between rounded-card border border-neve-200 px-4 py-3 transition-colors hover:border-tinta hover:bg-neve-200/30"
              >
                <span className="font-display font-bold">{c.nome}</span>
                <span className="text-sm text-neve-600 tabular">{n}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
