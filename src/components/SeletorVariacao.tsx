'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import type { Variacao } from '@/lib/produto';

/**
 * Chips de tamanho e sabor.
 *
 * Cada variacao e um SKU proprio com URL propria, entao trocar de sabor e uma
 * navegacao de verdade (bom para SEO e para compartilhar link) e nao um estado
 * de cliente. Quando a combinacao escolhida nao existe (ex: 1kg so em chocolate),
 * o chip cai para a primeira variacao daquele eixo em vez de dar 404.
 */
export default function SeletorVariacao({
  variacoes, atual,
}: {
  variacoes: Variacao[];
  atual: Variacao;
}) {
  const router = useRouter();

  const { tamanhos, sabores } = useMemo(() => {
    const unicos = (vs: (string | null)[]) =>
      [...new Set(vs.filter((v): v is string => !!v))];
    // tamanho ordena pelo peso de verdade (1kg > 900g), nao por texto
    const gramas = (t: string) => {
      // peso/volume manda; "Display 15 un 40g" vale 40g, nao 15 un
      const m = t.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b/i)
             ?? t.match(/(\d+(?:[.,]\d+)?)\s*(caps|un)\b/i);
      if (!m) return Number.MAX_SAFE_INTEGER;
      const n = parseFloat(m[1]!.replace(',', '.'));
      const u = m[2]!.toLowerCase();
      return u === 'kg' || u === 'l' ? n * 1000 : n;
    };
    return {
      tamanhos: unicos(variacoes.map(v => v.tamanho))
        .sort((a, b) => gramas(a) - gramas(b) || a.localeCompare(b, 'pt-BR')),
      sabores: unicos(variacoes.map(v => v.sabor))
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    };
  }, [variacoes]);

  /** Alvo ao clicar num chip: mantem o outro eixo se a combinacao existir. */
  function alvo(eixo: 'tamanho' | 'sabor', valor: string): Variacao | undefined {
    const outro = eixo === 'tamanho' ? 'sabor' : 'tamanho';
    return (
      variacoes.find(v => v[eixo] === valor && v[outro] === atual[outro]) ??
      variacoes.find(v => v[eixo] === valor)
    );
  }

  function Eixo({
    titulo, eixo, valores,
  }: { titulo: string; eixo: 'tamanho' | 'sabor'; valores: string[] }) {
    if (valores.length < 2) return null;
    return (
      <fieldset className="mt-5">
        <legend className="text-xs font-semibold uppercase tracking-widest text-neve-600">
          {titulo}
          <span className="ml-2 font-normal normal-case tracking-normal text-tinta">
            {atual[eixo] ?? '-'}
          </span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {valores.map(valor => {
            const destino = alvo(eixo, valor);
            const ativo = atual[eixo] === valor;
            const esgotado = destino?.disponibilidade === 'indisponivel';
            if (!destino) return null;
            return (
              <Link
                key={valor}
                href={`/p/${destino.slug}`}
                scroll={false}
                aria-current={ativo ? 'true' : undefined}
                onMouseEnter={() => router.prefetch(`/p/${destino.slug}`)}
                className={[
                  'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                  ativo
                    ? 'border-tinta bg-tinta text-neve'
                    : 'border-neve-200 bg-white text-tinta hover:border-tinta',
                  esgotado ? 'line-through opacity-50' : '',
                ].join(' ')}
              >
                {valor}
              </Link>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <div>
      <Eixo titulo="Tamanho" eixo="tamanho" valores={tamanhos} />
      <Eixo titulo="Sabor" eixo="sabor" valores={sabores} />
    </div>
  );
}
