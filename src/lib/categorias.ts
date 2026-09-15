/**
 * Lista unica de categorias do catalogo.
 *
 * Antes cada lugar tinha a sua: o cabecalho linkava 7, a pagina /c conhecia 20
 * e o rodape nenhuma. Resultado: 13 categorias (217 SKUs) existiam, respondiam
 * na URL, mas nao tinham link nenhum apontando para elas. So dava para chegar
 * pela busca ou adivinhando o endereco.
 *
 * `destaque` marca as que aparecem na faixa do cabecalho. Todas aparecem em
 * /categorias e no rodape.
 * A ordem e por tamanho de catalogo, entao o que tem mais produto vem primeiro.
 */
export type Categoria = { slug: string; nome: string; curto: string; destaque?: boolean };

export const CATEGORIAS: Categoria[] = [
  { slug: 'proteina',            nome: 'Proteína',              curto: 'Proteína',    destaque: true },
  { slug: 'barrinhas-e-snacks',  nome: 'Barrinhas e snacks',    curto: 'Snacks',      destaque: true },
  { slug: 'pre-treino',          nome: 'Pré-treino',            curto: 'Pré-treino',  destaque: true },
  { slug: 'creatina',            nome: 'Creatina',              curto: 'Creatina',    destaque: true },
  { slug: 'vitamina-mineral',    nome: 'Vitaminas e minerais',  curto: 'Vitaminas',   destaque: true },
  { slug: 'hipercalorico',       nome: 'Hipercalórico',         curto: 'Hipercalórico', destaque: true },
  { slug: 'termogenico',         nome: 'Termogênico',           curto: 'Termogênico', destaque: true },
  { slug: 'aminoacidos',         nome: 'Aminoácidos',           curto: 'Aminoácidos', destaque: true },
  { slug: 'pastas-e-cremes',     nome: 'Pastas e cremes',       curto: 'Pastas e cremes' },
  { slug: 'endurance',           nome: 'Endurance',             curto: 'Endurance' },
  { slug: 'bebidas-energeticos', nome: 'Bebidas e energéticos', curto: 'Bebidas' },
  { slug: 'molhos-e-caldas',     nome: 'Molhos e caldas',       curto: 'Molhos e caldas' },
  { slug: 'carboidrato',         nome: 'Carboidrato',           curto: 'Carboidrato' },
  { slug: 'colageno',            nome: 'Colágeno',              curto: 'Colágeno' },
  { slug: 'enzima-saude',        nome: 'Enzimas e saúde',       curto: 'Enzimas' },
  { slug: 'omega-oleos',         nome: 'Ômega e óleos',         curto: 'Ômega e óleos' },
  { slug: 'sono-imunidade',      nome: 'Sono e imunidade',      curto: 'Sono e imunidade' },
  { slug: 'vasodilatador',       nome: 'Vasodilatador',         curto: 'Vasodilatador' },
  { slug: 'natural',             nome: 'Natural',               curto: 'Natural' },
  { slug: 'precursor',           nome: 'Precursor',             curto: 'Precursor' },
];

export const DESTAQUES = CATEGORIAS.filter(c => c.destaque);

const POR_SLUG = new Map(CATEGORIAS.map(c => [c.slug, c]));

export function categoria(slug: string): Categoria | undefined {
  return POR_SLUG.get(slug);
}
