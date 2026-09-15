import 'server-only';

const BASE = 'https://api.mercadopago.com';

function token() {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!t) throw new Error('MERCADOPAGO_ACCESS_TOKEN ausente');
  return t;
}

type Pagador = { email: string; nome?: string; cpf?: string };

/**
 * Cria o pagamento. O cartao NUNCA passa por aqui: o SDK do Mercado Pago
 * tokeniza no navegador e o que chega e so `card_token`, descartavel.
 * `external_reference` e o id do pedido, que o webhook usa para casar de volta.
 */
export async function criarPagamento(args: {
  pedidoId: string;
  valorCents: number;
  meio: 'pix' | 'credito' | 'debito';
  descricao: string;
  pagador: Pagador;
  cardToken?: string;
  parcelas?: number;
  idempotencia: string;
}) {
  const corpo: Record<string, unknown> = {
    transaction_amount: Number((args.valorCents / 100).toFixed(2)),
    description: args.descricao,
    external_reference: args.pedidoId,
    notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/mercadopago`,
    payer: {
      email: args.pagador.email,
      ...(args.pagador.cpf
        ? { identification: { type: 'CPF', number: args.pagador.cpf.replace(/\D/g, '') } }
        : {}),
    },
  };

  if (args.meio === 'pix') {
    corpo.payment_method_id = 'pix';
    corpo.date_of_expiration = new Date(Date.now() + 30 * 60_000).toISOString();
  } else {
    if (!args.cardToken) throw new Error('card_token ausente');
    corpo.token = args.cardToken;
    corpo.installments = args.parcelas ?? 1;
    corpo.payment_method_id = undefined;   // o MP deduz pelo token
  }

  const r = await fetch(`${BASE}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': args.idempotencia,
    },
    body: JSON.stringify(corpo),
    cache: 'no-store',
  });

  const json = await r.json();
  if (!r.ok) {
    // nunca devolva o corpo cru do MP ao navegador: vaza detalhe interno
    console.error('[mp] falha', r.status, json?.message, json?.cause);
    throw new Error('pagamento_recusado');
  }

  const tx = json.point_of_interaction?.transaction_data;
  return {
    id: String(json.id),
    status: json.status as string,
    status_detail: json.status_detail as string | undefined,
    pix_qr: tx?.qr_code_base64 as string | undefined,
    pix_copia_cola: tx?.qr_code as string | undefined,
    expira_em: json.date_of_expiration as string | undefined,
  };
}
