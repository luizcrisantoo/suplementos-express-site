'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { brl } from '@/lib/dinheiro';
import { useCarrinho } from '@/components/CarrinhoProvider';
import CalculadoraFrete, { type ResultadoFrete } from '@/components/CalculadoraFrete';

export default function Carrinho() {
  const { linhas, subtotal_cents, mudarQtd, remover } = useCarrinho();
  const [frete, setFrete] = useState<ResultadoFrete | null>(null);
  const valorFrete = frete?.atende ? frete.frete?.valor_cents ?? 0 : 0;

  if (linhas.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold">Seu carrinho está vazio</h1>
        <Link href="/categorias" className="mt-6 inline-block rounded-lg bg-ouro px-6 py-3 font-display font-bold text-tinta">
          Ver o catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold">Seu carrinho</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-neve-200">
          {linhas.map(l => (
            <li key={l.id} className="flex gap-4 py-5">
              <div className="relative h-24 w-24 flex-none rounded bg-neve-200/40">
                {l.foto && <Image src={`/produtos/${l.foto}`} alt="" fill sizes="96px" className="object-contain p-2" />}
              </div>
              <div className="flex-1">
                <Link href={`/p/${l.slug}`} className="font-semibold hover:underline">{l.nome}</Link>
                <p className="mt-1 text-sm text-neve-600 tabular">{brl(l.preco_cents)} cada</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-neve-200">
                    <button onClick={() => mudarQtd(l.id, l.qtd - 1)} aria-label={`Diminuir ${l.nome}`} className="px-3 py-1">−</button>
                    <span className="w-8 text-center tabular">{l.qtd}</span>
                    <button onClick={() => mudarQtd(l.id, l.qtd + 1)} aria-label={`Aumentar ${l.nome}`} className="px-3 py-1">+</button>
                  </div>
                  <button onClick={() => remover(l.id)} className="text-sm text-neve-600 underline">remover</button>
                </div>
              </div>
              <p className="font-display font-bold tabular">{brl(l.preco_cents * l.qtd)}</p>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4 lg:sticky lg:top-28">
          <CalculadoraFrete subtotalCents={subtotal_cents} onResultado={setFrete} />

          <div className="rounded-card border border-neve-200 p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular">{brl(subtotal_cents)}</dd></div>
              <div className="flex justify-between">
                <dt>Frete</dt>
                <dd className="tabular">
                  {!frete ? <span className="text-neve-600">informe o CEP</span>
                    : frete.frete?.gratis ? <span className="text-ok">grátis</span> : brl(valorFrete)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-neve-200 pt-2 font-display text-lg font-extrabold">
                <dt>Total</dt><dd className="tabular">{brl(subtotal_cents + valorFrete)}</dd>
              </div>
            </dl>

            <Link
              href={frete?.atende ? '/checkout' : '#'}
              aria-disabled={!frete?.atende}
              className={`mt-4 block rounded-lg px-5 py-3 text-center font-display font-bold ${
                frete?.atende ? 'bg-ouro text-tinta' : 'pointer-events-none bg-neve-200 text-neve-600'
              }`}
            >
              Ir para o pagamento
            </Link>
            {!frete && <p className="mt-2 text-center text-xs text-neve-600">Consulte o CEP para liberar o pagamento.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
