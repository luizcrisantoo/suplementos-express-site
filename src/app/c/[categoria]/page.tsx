import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseServidor } from '@/lib/supabase-server';
import CardProduto, { type ProdutoVitrine } from '@/components/CardProduto';

export const revalidate = 300;

const NOMES: Record<string, string> = {
  'proteina': 'Proteína', 'creatina': 'Creatina', 'pre-treino': 'Pré-treino',
  'hipercalorico': 'Hipercalórico', 'barrinhas-e-snacks': 'Barrinhas e snacks',
  'vitamina-mineral': 'Vitaminas e minerais', 'termogenico': 'Termogênico',
  'colageno': 'Colágeno', 'aminoacidos': 'Aminoácidos', 'carboidrato': 'Carboidrato',
  'endurance': 'Endurance', 'bebidas-energeticos': 'Bebidas e energéticos',
  'pastas-e-cremes': 'Pastas e cremes', 'molhos-e-caldas': 'Molhos e caldas',
  'omega-oleos': 'Ômega e óleos', 'enzima-saude': 'Enzimas e saúde',
  'sono-imunidade': 'Sono e imunidade', 'vasodilatador': 'Vasodilatador',
  'natural': 'Natural', 'precursor': 'Precursor',
};

export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const { categoria } = await params;
  const nome = NOMES[categoria];
  if (!nome) return {};
  return {
    title: `${nome} com entrega no mesmo dia em Recife`,
    description: `${nome} com entrega no mesmo dia em Recife, Olinda e Jaboatão. Pediu até 16h, recebe hoje.`,
    alternates: { canonical: `/c/${categoria}` },
  };
}

export default async function Categoria({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  if (!NOMES[categoria]) notFound();

  const sb = await supabaseServidor();
  const { data } = await sb.from('produto_publico')
    .select('id,slug,nome,marca,sabor,preco_venda_cents,preco_referencia_cents,foto,disponibilidade')
    .eq('categoria', categoria).order('preco_venda_cents', { ascending: true }).limit(120);

  const itens = (data ?? []) as ProdutoVitrine[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Você está em" className="text-sm text-neve-600">
        <a href="/" className="hover:underline">Início</a> <span aria-hidden>/</span> {NOMES[categoria]}
      </nav>
      <h1 className="mt-2 font-display text-3xl font-extrabold">{NOMES[categoria]}</h1>
      <p className="mt-1 text-sm text-neve-600 tabular">{itens.length} produtos</p>

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
