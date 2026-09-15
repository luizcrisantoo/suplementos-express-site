import 'server-only';

/**
 * Fonte unica de verdade do preco. Regra de ouro do checkout:
 * o navegador manda apenas { id, qtd }. Preco, frete e total sao
 * recalculados aqui a partir do banco. Nunca confie em valor do cliente.
 */
export type ItemPedido = { produto_id: string; qtd: number };

export type LinhaCalculada = {
  produto_id: string; nome: string; qtd: number;
  preco_cents: number; custo_cents: number; total_cents: number;
};

export function somarItens(linhas: LinhaCalculada[]) {
  return linhas.reduce(
    (a, l) => ({
      subtotal_cents: a.subtotal_cents + l.total_cents,
      custo_cents: a.custo_cents + l.custo_cents * l.qtd,
    }),
    { subtotal_cents: 0, custo_cents: 0 },
  );
}

const TAXA = { pix: 0.0099, credito: 0.0399, debito: 0.0199 } as const;

/** Margem liquida do pedido depois de frete e taxa do meio de pagamento. */
export function margemLiquida(args: {
  subtotal_cents: number; custo_cents: number; frete_cents: number;
  meio: keyof typeof TAXA;
}) {
  const taxa = Math.round(args.subtotal_cents * TAXA[args.meio]);
  return args.subtotal_cents - args.custo_cents - args.frete_cents - taxa;
}

/** Trava operacional: abaixo disso o pedido nao paga a entrega. */
export const MARGEM_MINIMA_CENTS = 1200;
