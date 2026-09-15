'use client';
import { useState } from 'react';
import { useCarrinho, type Linha } from './CarrinhoProvider';

export default function BotaoComprar({ produto }: { produto: Omit<Linha, 'qtd'> }) {
  const { adicionar, abrir } = useCarrinho();
  const [qtd, setQtd] = useState(1);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-lg border border-neve-200">
        <button onClick={() => setQtd(q => Math.max(1, q - 1))} aria-label="Diminuir quantidade"
                className="px-3 py-2 text-lg font-bold">−</button>
        <span className="w-10 text-center font-semibold tabular" aria-live="polite">{qtd}</span>
        <button onClick={() => setQtd(q => Math.min(50, q + 1))} aria-label="Aumentar quantidade"
                className="px-3 py-2 text-lg font-bold">+</button>
      </div>
      <button
        onClick={() => { adicionar(produto, qtd); abrir(); }}
        className="flex-1 rounded-lg bg-tinta px-6 py-3 font-display font-bold text-neve transition-colors hover:bg-ouro hover:text-tinta"
      >
        Adicionar ao carrinho
      </button>
    </div>
  );
}
