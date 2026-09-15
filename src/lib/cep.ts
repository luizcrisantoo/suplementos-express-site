import 'server-only';

/**
 * CEP vira zona de entrega. O bairro vem do ViaCEP e e comparado com a lista
 * da tabela `zona`. Isso roda no SERVIDOR: o navegador manda o CEP e recebe o
 * frete ja calculado, nunca o contrario.
 */
export type EnderecoCep = { cep: string; rua: string; bairro: string; cidade: string; uf: string };

const semAcento = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

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
  for (const z of zonas) {
    if (z.bairros.some(x => semAcento(x) === b)) return z;
  }
  // cidades inteiras que caem na Z3
  const z3 = zonas.find(z => z.codigo === 'Z3');
  if (z3 && ['olinda', 'jaboatao dos guararapes', 'camaragibe', 'paulista'].includes(c)) return z3;
  return null;
}
