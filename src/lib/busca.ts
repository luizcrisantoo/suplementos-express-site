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
 * Relevancia. O banco devolve sem ordem util (LIKE nao ranqueia), entao a
 * ordenacao final sai daqui: nome da linha na frente, depois marca, depois preco.
 */
export function ordenarPorRelevancia<T extends { linha: string | null; nome: string; marca: string; preco_venda_cents: number }>(
  itens: T[], termo: string,
): T[] {
  const t = normalizarBusca(termo);
  const limpo = (s: string) => normalizarBusca(s);
  const nota = (i: T) => {
    const linha = limpo(i.linha ?? i.nome);
    if (linha === t) return 0;
    if (linha.startsWith(t)) return 1;
    if (linha.includes(t)) return 2;
    if (limpo(i.marca).includes(t)) return 3;
    return 4;
  };
  return [...itens].sort((a, b) => nota(a) - nota(b) || a.preco_venda_cents - b.preco_venda_cents);
}
