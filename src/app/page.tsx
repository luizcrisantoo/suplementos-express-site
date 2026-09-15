import Link from 'next/link';
import { supabaseServidor } from '@/lib/supabase-server';
import CardProduto from '@/components/CardProduto';
import { COLUNAS_VITRINE, type ItemVitrine } from '@/lib/produto';
import { linkWhatsapp, MSG_PADRAO } from '@/lib/contato';

export const revalidate = 300;

const VITRINES = [
  { cat: 'proteina', titulo: 'Proteína' },
  { cat: 'creatina', titulo: 'Creatina' },
  { cat: 'pre-treino', titulo: 'Pré-treino' },
];

const GARANTIAS = [
  ['Entrega hoje', 'Pedidos até 16h'],
  ['Frete grátis', 'Acima de R$ 149'],
  ['Pix ou cartão', 'Até 6x sem juros'],
  ['100% original', 'Direto do distribuidor'],
];

export default async function Home() {
  const sb = await supabaseServidor();
  const blocos = await Promise.all(
    VITRINES.map(async v => {
      const { data } = await sb.from('vitrine')
        .select(COLUNAS_VITRINE)
        .eq('categoria', v.cat)
        .order('preco_venda_cents', { ascending: false })
        .limit(8);
      return { ...v, itens: (data ?? []) as unknown as ItemVitrine[] };
    }),
  );

  return (
    <>
      {/* Hero enxuta de proposito: a primeira dobra tem que mostrar produto,
          nao banner. O texto carrega a promessa, as garantias vao na faixa. */}
      <section className="bg-tinta text-neve">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-4 px-4 py-6 sm:py-10">
          <div className="min-w-[260px] flex-1">
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ouro">
              Recife e região metropolitana
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-[1.1] sm:text-4xl">
              Pediu até 16h, <span className="text-ouro">recebe hoje.</span>
            </h1>
            <p className="mt-2 max-w-md text-sm text-neve-400">
              Whey, creatina e pré-treino no mesmo dia em Recife, Olinda,
              Jaboatão e Camaragibe.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/c/proteina"
              className="rounded-lg bg-ouro px-5 py-3 font-display text-sm font-bold text-tinta"
            >
              Ver o catálogo
            </Link>
            <a
              href={linkWhatsapp(MSG_PADRAO)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-neve-400 px-5 py-3 font-display text-sm font-bold text-neve transition-colors hover:border-ouro hover:text-ouro"
            >
              Pedir no WhatsApp
            </a>
          </div>
        </div>

        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-2 border-t border-tinta-700 px-4 py-3 sm:grid-cols-4">
          {GARANTIAS.map(([t, s]) => (
            <li key={t} className="text-xs leading-tight">
              <span className="font-display font-bold text-neve">{t}</span>
              <span className="block text-neve-400">{s}</span>
            </li>
          ))}
        </ul>
      </section>

      {blocos.map(b => (
        <section key={b.cat} className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold">{b.titulo}</h2>
            <Link href={`/c/${b.cat}`} className="text-sm font-semibold underline hover:text-ouro-700">
              ver tudo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {b.itens.map(p => <CardProduto key={p.id} p={p} />)}
          </div>
        </section>
      ))}
    </>
  );
}
