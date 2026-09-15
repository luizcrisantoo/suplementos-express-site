'use client';
import Image from 'next/image';
import Link from 'next/link';
import { brl } from '@/lib/dinheiro';
import { nomeLinha, nomeCompleto, seloVariacao, type ItemVitrine } from '@/lib/produto';
import { useCarrinho } from './CarrinhoProvider';

export type { ItemVitrine };

export default function CardProduto({ p }: { p: ItemVitrine }) {
  const { adicionar, abrir } = useCarrinho();
  const economia = p.preco_referencia_cents - p.preco_venda_cents;
  const selo = seloVariacao(p);
  const faixa = p.preco_max_cents > p.preco_venda_cents;

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-neve-200 bg-white transition-shadow hover:shadow-lg">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square bg-white">
        {p.foto ? (
          <Image
            src={`/produtos/${p.foto}`}
            alt={nomeLinha(p)}
            fill
            sizes="(max-width:640px) 45vw, (max-width:1024px) 30vw, 240px"
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-neve-600">sem foto</div>
        )}
        {economia > 0 && (
          <span className="absolute left-2 top-2 rounded bg-ouro px-2 py-0.5 text-[11px] font-bold text-tinta tabular">
            -{Math.round((economia / p.preco_referencia_cents) * 100)}%
          </span>
        )}
        {selo && (
          <span className="absolute bottom-2 left-2 rounded-full border border-neve-200 bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-neve-600">
            {selo}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neve-600">{p.marca}</p>
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">
          <Link href={`/p/${p.slug}`} className="hover:underline">{nomeLinha(p)}</Link>
        </h3>

        <div className="mt-auto pt-2">
          {/* "a partir de" em linha propria: no celular ele quebrava no meio */}
          {faixa && <span className="block text-[11px] leading-none text-neve-600">a partir de</span>}
          <div className="flex items-baseline gap-2">
            {economia > 0 && !faixa && (
              <s className="text-xs text-neve-600 tabular">{brl(p.preco_referencia_cents)}</s>
            )}
            <span className="font-display text-lg font-extrabold tabular">{brl(p.preco_venda_cents)}</span>
          </div>
        </div>

        {selo ? (
          <Link
            href={`/p/${p.slug}`}
            className="mt-2 rounded-lg border border-tinta px-3 py-2 text-center text-sm font-bold text-tinta transition-colors hover:bg-tinta hover:text-neve"
          >
            Escolher
          </Link>
        ) : (
          <button
            onClick={() => {
              adicionar({
                id: p.id, slug: p.slug, nome: nomeCompleto(p),
                preco_cents: p.preco_venda_cents, foto: p.foto,
              });
              abrir();
            }}
            className="mt-2 rounded-lg bg-tinta px-3 py-2 text-sm font-bold text-neve transition-colors hover:bg-ouro hover:text-tinta"
          >
            Adicionar
          </button>
        )}
      </div>
    </article>
  );
}
