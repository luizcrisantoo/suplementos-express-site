import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseServidor } from '@/lib/supabase-server';
import CardProduto from '@/components/CardProduto';
import { COLUNAS_VITRINE, type ItemVitrine } from '@/lib/produto';
import { categoria as buscarCategoria } from '@/lib/categorias';

export const revalidate = 300;

// a lista de categorias mora em lib/categorias.ts

export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const { categoria } = await params;
  const nome = buscarCategoria(categoria)?.nome;
  if (!nome) return {};
  return {
    title: `${nome} com entrega no mesmo dia em Recife`,
    description: `${nome} com entrega no mesmo dia em Recife, Olinda e Jaboatão. Pediu até 16h, recebe hoje.`,
    alternates: { canonical: `/c/${categoria}` },
  };
}

export default async function Categoria({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  const cat = buscarCategoria(categoria);
  if (!cat) notFound();

  const sb = await supabaseServidor();
  // le a vitrine (uma linha por grupo), nao os SKUs soltos: senao o mesmo whey
  // ocupa a categoria inteira com 18 sabores.
  const { data } = await sb.from('vitrine')
    .select(COLUNAS_VITRINE)
    .eq('categoria', categoria)
    .order('preco_venda_cents', { ascending: true })
    .limit(200);

  const itens = (data ?? []) as unknown as ItemVitrine[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Você está em" className="text-sm text-neve-600">
        <Link href="/" className="hover:underline">Início</Link> <span aria-hidden>/</span>{' '}
        <Link href="/categorias" className="hover:underline">Categorias</Link> <span aria-hidden>/</span> {cat.nome}
      </nav>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{cat.nome}</h1>
      <p className="mt-1 text-sm text-neve-600 tabular">
        {itens.length} {itens.length === 1 ? 'produto' : 'produtos'}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {itens.map(p => <CardProduto key={p.id} p={p} />)}
      </div>
      {itens.length === 0 && (
        <p className="mt-10 rounded-card border border-neve-200 p-8 text-center text-neve-600">
          Nenhum produto nesta categoria por enquanto.
        </p>
      )}
    </div>
  );
}
