/**
 * Normalizacao do termo de busca.
 *
 * A coluna `busca` no banco ja esta sem acento, em minusculo e sem pontuacao
 * (a migracao 02 grava assim). Aqui o termo digitado passa pelo mesmo tratamento,
 * entao "proteína", "PROTEINA" e "proteina" caem no mesmo lugar sem precisar da
 * extensao unaccent no Postgres.
 *
 * O `%` sai fora de proposito: se ficasse, o cliente conseguiria mandar curinga
 * para dentro do LIKE e receber o catalogo inteiro.
 */
export function normalizarBusca(termo: string): string {
  return termo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+.& ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Ate 6 palavras de 2+ letras. Todas precisam aparecer (AND), nao qualquer uma. */
export function palavrasBusca(termo: string): string[] {
  return normalizarBusca(termo).split(' ').filter(p => p.length >= 2).slice(0, 6);
}

/**
 * Relevancia.
 *
 * O LIKE do Postgres responde sim/nao, nao ranqueia. Como a busca devolve no
 * maximo 60 grupos, a ordenacao final sai daqui:
 *
 *   1. o termo inteiro no nome da linha (igual > comeca com > contem)
 *   2. quantas palavras do termo aparecem no nome da linha
 *   3. quantas aparecem na marca
 *   4. linha com mais variacoes primeiro (proxy de linha conhecida:
 *      "Best Whey" com 18 sabores vence um item avulso qualquer)
 *   5. mais barato primeiro
 *
 * Sem o passo 4, procurar "whey chocolate" devolvia o creme de avela mais
 * barato da loja na frente das linhas de whey de verdade.
 */
export function ordenarPorRelevancia<T extends {
  linha: string | null; nome: string; marca: string;
  preco_venda_cents: number; qtd_variacoes?: number;
}>(itens: T[], termo: string): T[] {
  const t = normalizarBusca(termo);
  const palavras = palavrasBusca(termo);

  const nota = (i: T) => {
    const linha = normalizarBusca(i.linha ?? i.nome);
    const marca = normalizarBusca(i.marca);
    let n = 0;
    if (linha === t) n += 1000;
    else if (linha.startsWith(t)) n += 600;
    else if (linha.includes(t)) n += 300;
    for (const p of palavras) {
      if (linha.includes(p)) n += 40;
      if (marca.includes(p)) n += 15;
    }
    return n;
  };

  return [...itens].sort((a, b) =>
    nota(b) - nota(a) ||
    (b.qtd_variacoes ?? 1) - (a.qtd_variacoes ?? 1) ||
    a.preco_venda_cents - b.preco_venda_cents);
}
