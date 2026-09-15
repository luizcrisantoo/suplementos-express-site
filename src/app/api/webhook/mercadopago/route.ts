import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook de pagamento. Tres regras:
 *  1. Assinatura conferida antes de qualquer coisa. Sem assinatura valida, 401.
 *  2. Idempotente: o MP reenvia o mesmo evento; webhook_log barra o replay.
 *  3. O status vem da API do MP, nunca do corpo do request.
 */
function assinaturaValida(req: Request, corpoBruto: string) {
  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!segredo) return false;
  const cabecalho = req.headers.get('x-signature') ?? '';
  const requestId = req.headers.get('x-request-id') ?? '';
  const partes = Object.fromEntries(
    cabecalho.split(',').map(p => p.split('=').map(s => s.trim())) as [string, string][],
  );
  const ts = partes['ts'], v1 = partes['v1'];
  if (!ts || !v1) return false;

  const dataId = (() => { try { return JSON.parse(corpoBruto)?.data?.id ?? ''; } catch { return ''; } })();
  const manifesto = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const esperado = crypto.createHmac('sha256', segredo).update(manifesto).digest('hex');

  const a = Buffer.from(esperado), b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const bruto = await req.text();
  if (!assinaturaValida(req, bruto)) return NextResponse.json({ erro: 'assinatura' }, { status: 401 });

  let evento: any;
  try { evento = JSON.parse(bruto); } catch { return NextResponse.json({ erro: 'json' }, { status: 400 }); }
  if (evento.type !== 'payment') return NextResponse.json({ ok: true });

  const admin = supabaseAdmin();
  const eventoId = String(evento.data?.id ?? '');

  // replay: se ja registramos esse evento, saimos com 200 para o MP parar de reenviar
  const { error: dup } = await admin.from('webhook_log')
    .insert({ provedor: 'mercadopago', evento_id: eventoId, payload: evento });
  if (dup) return NextResponse.json({ ok: true, repetido: true });

  // a verdade sobre o pagamento vem da API do MP, nao do corpo recebido
  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${eventoId}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
    cache: 'no-store',
  });
  if (!resp.ok) return NextResponse.json({ erro: 'consulta' }, { status: 502 });
  const pagamento = await resp.json();

  const pedidoId = pagamento.external_reference as string | undefined;
  if (!pedidoId) return NextResponse.json({ ok: true });

  const mapa: Record<string, string> = {
    approved: 'pago', pending: 'aguardando_pagamento', in_process: 'aguardando_pagamento',
    rejected: 'cancelado', cancelled: 'cancelado', refunded: 'estornado', charged_back: 'estornado',
  };
  const novo = mapa[pagamento.status];
  if (!novo) return NextResponse.json({ ok: true });

  // confere o valor: pagamento parcial ou adulterado nao aprova pedido
  const { data: pedido } = await admin.from('pedido')
    .select('id,total_cents,status').eq('id', pedidoId).maybeSingle();
  if (!pedido) return NextResponse.json({ ok: true });

  const pagoCents = Math.round((pagamento.transaction_amount ?? 0) * 100);
  if (novo === 'pago' && pagoCents < pedido.total_cents)
    return NextResponse.json({ ok: true, aviso: 'valor divergente' });

  await admin.from('pedido')
    .update({ status: novo, mp_payment_id: String(pagamento.id) })
    .eq('id', pedidoId);

  return NextResponse.json({ ok: true });
}
