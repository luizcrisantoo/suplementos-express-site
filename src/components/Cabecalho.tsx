'use client';
import Link from 'next/link';
import { Suspense } from 'react';
import Logo from './Logo';
import CampoBusca from './CampoBusca';
import { useCarrinho } from './CarrinhoProvider';
import { DESTAQUES } from '@/lib/categorias';



export default function Cabecalho() {
  const { quantidade, abrir } = useCarrinho();
  return (
    <header className="sticky top-0 z-40 bg-tinta text-neve">
      <p className="bg-ouro px-4 py-1.5 text-center text-[13px] font-semibold text-tinta">
        Pediu até 16h, recebe hoje · Frete grátis acima de R$ 149
      </p>

      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-5">
        <Link href="/" aria-label="Suplementos Express, página inicial" className="flex-none">
          <Logo altura={36} prioridade />
        </Link>

        {/* No desktop a busca fica no meio; no celular ela desce para a linha de baixo */}
        <Suspense fallback={<div className="hidden flex-1 sm:block" />}>
          <CampoBusca className="hidden flex-1 sm:block" />
        </Suspense>

        <button
          onClick={abrir}
          className="ml-auto flex-none rounded-full bg-ouro px-4 py-2 text-sm font-bold text-tinta sm:ml-0"
          aria-label={`Abrir carrinho com ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`}
        >
          Carrinho {quantidade > 0 && <span className="tabular">({quantidade})</span>}
        </button>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-3 sm:hidden">
        <Suspense fallback={null}>
          <CampoBusca />
        </Suspense>
      </div>

      {/* No celular esta faixa era `hidden`: o cliente ficava sem navegacao
          nenhuma por categoria. Agora ela rola na horizontal em vez de sumir. */}
      <nav className="relative border-t border-tinta-700" aria-label="Categorias">
        <ul className="mx-auto flex max-w-6xl gap-4 overflow-x-auto whitespace-nowrap px-4 py-2 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DESTAQUES.map(c => (
            <li key={c.slug}>
              <Link href={`/c/${c.slug}`} className="transition-colors hover:text-ouro">{c.curto}</Link>
            </li>
          ))}
          <li>
            <Link href="/categorias" className="font-semibold text-ouro hover:underline">
              Todas as categorias
            </Link>
          </li>
        </ul>
        {/* degrade na borda: sinaliza que ainda tem categoria para o lado */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-tinta to-transparent lg:hidden"
        />
      </nav>
    </header>
  );
}
