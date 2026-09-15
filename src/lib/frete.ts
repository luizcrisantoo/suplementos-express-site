import 'server-only';

export type Zona = {
  id: number; codigo: string; nome: string; bairros: string[];
  frete_cents: number; gratis_acima_cents: number; corte_hora: number;
};

/**
 * Calcula frete no SERVIDOR. O carrinho manda o CEP, nunca o valor do frete.
 * Retorna null quando o endereco esta fora da area: o checkout deve barrar.
 */
export function calcularFrete(zona: Zona | null, subtotalCents: number) {
  if (!zona || zona.codigo === 'Z4') return null;
  const gratis = zona.gratis_acima_cents > 0 && subtotalCents >= zona.gratis_acima_cents;
  return {
    zona: zona.codigo,
    valor_cents: gratis ? 0 : zona.frete_cents,
    gratis,
    falta_para_gratis_cents: gratis ? 0 : Math.max(0, zona.gratis_acima_cents - subtotalCents),
  };
}

/** Promessa de entrega a partir do horario de corte da zona (America/Recife, UTC-3). */
export function promessaEntrega(zona: Zona, agora = new Date()) {
  const recife = new Date(agora.getTime() - 3 * 3600_000);
  const hora = recife.getUTCHours();
  const dia = recife.getUTCDay(); // 0 = domingo
  const util = dia >= 1 && dia <= 6;
  if (util && hora < zona.corte_hora) return { hoje: true, texto: 'Chega hoje' };
  return { hoje: false, texto: 'Chega amanhã' };
}
