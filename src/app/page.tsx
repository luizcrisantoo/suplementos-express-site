import Link from 'next/link';
import { supabaseServidor } from '@/lib/supabase-server';
import CardProduto, { type ProdutoVitrine } from '@/components/CardProduto';

export const revalidate = 300;

const VITRINES = [
  { cat: 'proteina', titulo: 'Proteína' },
  { cat: 'creatina', titulo: 'Creatina' },
  { cat: 'pre-treino', titulo: 'Pré-treino' },
];

export default async function Home() {
  const sb = await supabaseServidor();
  const blocos = await Promise.all(
    VITRINES.map(async v => {
      const { data } = await sb.from('produto_publico')
        .select('id,slug,nome,marca,sabor,preco_venda_cents,preco_referencia_cents,foto,disponibilidade')
        .eq('categoria', v.cat).order('preco_venda_cents', { ascending: false }).limit(8);
      return { ...v, itens: (data ?? []) as ProdutoVitrine[] };
    }),
  );

  return (
    <>
      <section className="bg-tinta text-neve">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ouro">Recife e região</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Pediu até 16h,<br /><span className="text-ouro">recebe hoje.</span>
          </h1>
          <p className="mt-5 max-w-lg text-neve-400">
            Whey, creatina e pré-treino entregues no mesmo dia em Boa Viagem, Espinheiro,
            Graças, Casa Forte e mais 12 bairros. Frete grátis acima de R$ 149.
          </p>
          <Link href="/c/proteina"
                className="mt-8 inline-block rounded-lg bg-ouro px-6 py-3 font-display font-bold text-tinta">
            Ver o catálogo
          </Link>
        </div>
      </section>

      {blocos.map(b => (
        <section key={b.cat} className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold">{b.titulo}</h2>
            <Link href={`/c/${b.cat}`} className="text-sm font-semibold underline hover:text-ouro-700">ver tudo</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {b.itens.map(p => <CardProduto key={p.id} p={p} />)}
          </div>
        </section>
      ))}
    </>
  );
}
