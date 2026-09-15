'use client';
import Image from 'next/image';
import Link from 'next/link';
import { brl } from '@/lib/dinheiro';
import { useCarrinho } from './CarrinhoProvider';

export type ProdutoVitrine = {
  id: string; slug: string; nome: string; marca: string; sabor: string | null;
  preco_venda_cents: number; preco_referencia_cents: number; foto: string | null;
  disponibilidade: string;
};

export default function CardProduto({ p }: { p: ProdutoVitrine }) {
  const { adicionar, abrir } = useCarrinho();
  const economia = p.preco_referencia_cents - p.preco_venda_cents;

  return (
    <article className="group flex flex-col rounded-card border border-neve-200 bg-white transition-shadow hover:shadow-lg">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-t-card bg-neve-200/40">
        {p.foto ? (
          <Image src={`/produtos/${p.foto}`} alt={p.nome} fill sizes="(max-width:640px) 45vw, 240px"
                 className="object-contain p-3 transition-transform group-hover:scale-105" />
        ) : <div className="grid h-full place-items-center text-xs text-neve-600">sem foto</div>}
        {economia > 0 && (
          <span className="absolute left-2 top-2 rounded bg-ouro px-2 py-0.5 text-[11px] font-bold text-tinta tabular">
            -{Math.round((economia / p.preco_referencia_cents) * 100)}%
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neve-600">{p.marca}</p>
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">
          <Link href={`/p/${p.slug}`} className="hover:underline">{p.nome}</Link>
        </h3>
        <p className="mt-auto pt-2">
          {economia > 0 && (
            <span className="mr-2 text-xs text-neve-600 line-through tabular">{brl(p.preco_referencia_cents)}</span>
          )}
          <span className="font-display text-lg font-extrabold tabular">{brl(p.preco_venda_cents)}</span>
        </p>
        <button
          onClick={() => { adicionar({ id: p.id, slug: p.slug, nome: p.nome, preco_cents: p.preco_venda_cents, foto: p.foto }); abrir(); }}
          className="mt-2 rounded-lg bg-tinta px-3 py-2 text-sm font-bold text-neve transition-colors hover:bg-ouro hover:text-tinta"
        >
          Adicionar
        </button>
      </div>
    </article>
  );
}
