/**
 * Tipos e rotulos do catalogo.
 *
 * A NE cadastra cada sabor e cada tamanho como um SKU separado, entao o mesmo
 * whey aparece 18 vezes. No banco, `grupo` junta os SKUs da mesma linha:
 *
 *   grupo   atlhetica-nutrition--best-whey
 *   linha   Best Whey                 (nome limpo, sem sabor e sem tamanho)
 *   tamanho Pote 900g
 *   sabor   Cookies e Cream
 *
 * As listagens leem a view `vitrine` (uma linha por grupo). A pagina do produto
 * le `produto_publico` (um SKU) mais os irmaos do mesmo grupo.
 */

export type ItemVitrine = {
  grupo: string;
  id: string;
  slug: string;
  nome: string;
  linha: string | null;
  marca: string;
  categoria: string;
  sabor: string | null;
  tamanho: string | null;
  foto: string | null;
  disponibilidade: string;
  preco_venda_cents: number;
  preco_referencia_cents: number;
  preco_max_cents: number;
  qtd_sabores: number;
  qtd_tamanhos: number;
  qtd_variacoes: number;
};

export const COLUNAS_VITRINE =
  'grupo,id,slug,nome,linha,marca,categoria,sabor,tamanho,foto,disponibilidade,' +
  'preco_venda_cents,preco_referencia_cents,preco_max_cents,qtd_sabores,qtd_tamanhos,qtd_variacoes';

export type Variacao = {
  id: string;
  slug: string;
  sabor: string | null;
  tamanho: string | null;
  preco_venda_cents: number;
  disponibilidade: string;
};

export const COLUNAS_VARIACAO = 'id,slug,sabor,tamanho,preco_venda_cents,disponibilidade';

/** Nome curto, para card e cabecalho: "Best Whey". */
export function nomeLinha(p: { linha: string | null; nome: string }): string {
  return p.linha?.trim() || p.nome;
}

/** Nome completo, para carrinho e pedido: "Best Whey - Pote 900g - Cookies e Cream". */
export function nomeCompleto(p: {
  linha: string | null; nome: string; tamanho: string | null; sabor: string | null;
}): string {
  const partes = [nomeLinha(p), p.tamanho, p.sabor].filter(Boolean);
  return partes.join(' · ');
}

/** Selo do card: "12 sabores", "2 tamanhos", "6 opções". Null quando nao ha variacao. */
export function seloVariacao(p: {
  qtd_sabores: number; qtd_tamanhos: number; qtd_variacoes: number;
}): string | null {
  if (p.qtd_variacoes <= 1) return null;
  if (p.qtd_sabores > 1 && p.qtd_tamanhos > 1) return `${p.qtd_variacoes} opções`;
  if (p.qtd_sabores > 1) return `${p.qtd_sabores} sabores`;
  if (p.qtd_tamanhos > 1) return `${p.qtd_tamanhos} tamanhos`;
  return `${p.qtd_variacoes} opções`;
}
