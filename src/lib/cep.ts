import 'server-only';

/**
 * CEP vira zona de entrega. O bairro vem do ViaCEP e e comparado com a lista
 * da tabela `zona`. Isso roda no SERVIDOR: o navegador manda o CEP e recebe o
 * frete ja calculado, nunca o contrario.
 */
export type EnderecoCep = { cep: string; rua: string; bairro: string; cidade: string; uf: string };

// aceita null: a coluna zona.bairros e text[] e pode conter NULL
const semAcento = (s: string | null | undefined) =>
  (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export async function buscarCep(cep: string): Promise<EnderecoCep | null> {
  const limpo = cep.replace(/\D/g, '');
  if (limpo.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${limpo}/json/`, {
      next: { revalidate: 86400 },          // CEP nao muda todo dia
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.erro) return null;
    return { cep: limpo, rua: d.logradouro ?? '', bairro: d.bairro ?? '', cidade: d.localidade ?? '', uf: d.uf ?? '' };
  } catch { return null; }
}

/** Acha a zona pelo bairro. Fora da lista: null, e o checkout barra. */
export function zonaDoBairro<T extends { bairros: string[]; codigo: string }>(
  zonas: T[], bairro: string, cidade: string,
): T | null {
  const b = semAcento(bairro), c = semAcento(cidade);
  if (!b && !c) return null;
  for (const z of zonas) {
    // `?? []` e `x &&`: a zona Z4 ("fora de area") foi semeada com array[NULL],
    // entao bairros chega como [null]. Sem isso, qualquer bairro que nao casa
    // com Z1/Z2/Z3 chegava aqui e derrubava a rota com 500 em vez de dizer
    // "ainda nao entregamos ai". A migracao 03 conserta o dado; isto protege
    // o codigo de qualquer NULL que entre na lista de novo.
    if ((z.bairros ?? []).some(x => x && semAcento(x) === b)) return z;
  }
  // cidades inteiras que caem na Z3
  const z3 = zonas.find(z => z.codigo === 'Z3');
  if (z3 && ['olinda', 'jaboatao dos guararapes', 'camaragibe', 'paulista'].includes(c)) return z3;
  return null;
}
