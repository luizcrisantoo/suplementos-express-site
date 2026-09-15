'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { brl } from '@/lib/dinheiro';
import { useCarrinho } from './CarrinhoProvider';

export default function GavetaCarrinho() {
  const { linhas, subtotal_cents, mudarQtd, remover, aberto, fechar } = useCarrinho();
  const painel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', esc);
    painel.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [aberto, fechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-tinta/60" onClick={fechar} aria-hidden />
      <div
        ref={painel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Carrinho"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl outline-none"
      >
        <header className="flex items-center justify-between border-b border-neve-200 px-5 py-4">
          <h2 className="font-display text-lg font-extrabold">Seu carrinho</h2>
          <button onClick={fechar} aria-label="Fechar carrinho" className="text-2xl leading-none px-2">×</button>
        </header>

        {linhas.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-neve-600">Seu carrinho está vazio.</p>
            <Link href="/c/proteina" onClick={fechar}
                  className="rounded-lg bg-tinta px-5 py-2.5 font-semibold text-neve">Ver produtos</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-neve-200 overflow-y-auto px-5">
              {linhas.map(l => (
                <li key={l.id} className="flex gap-3 py-4">
                  <div className="relative h-16 w-16 flex-none rounded bg-neve-200/40">
                    {l.foto && <Image src={`/produtos/${l.foto}`} alt="" fill sizes="64px" className="object-contain p-1" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug line-clamp-2">{l.nome}</p>
                    <p className="mt-1 text-sm tabular">{brl(l.preco_cents)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded border border-neve-200">
                        <button onClick={() => mudarQtd(l.id, l.qtd - 1)} aria-label={`Diminuir ${l.nome}`} className="px-2 py-0.5">−</button>
                        <span className="w-7 text-center text-sm tabular">{l.qtd}</span>
                        <button onClick={() => mudarQtd(l.id, l.qtd + 1)} aria-label={`Aumentar ${l.nome}`} className="px-2 py-0.5">+</button>
                      </div>
                      <button onClick={() => remover(l.id)} className="text-xs text-neve-600 underline">remover</button>
                    </div>
                  </div>
                  <p className="font-semibold tabular">{brl(l.preco_cents * l.qtd)}</p>
                </li>
              ))}
            </ul>

            <footer className="border-t border-neve-200 p-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold tabular">{brl(subtotal_cents)}</span>
              </div>
              <p className="mt-1 text-xs text-neve-600">O frete é calculado na próxima etapa, pelo seu CEP.</p>
              <Link href="/carrinho" onClick={fechar}
                    className="mt-4 block rounded-lg bg-ouro px-5 py-3 text-center font-display font-bold text-tinta">
                Fechar pedido
              </Link>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
