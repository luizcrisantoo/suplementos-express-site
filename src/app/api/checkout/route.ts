import { NextResponse } from 'next/server';
import { checkoutSchema } from '@/lib/validacao';
import { supabaseServidor, supabaseAdmin } from '@/lib/supabase-server';
import { calcularFrete, type Zona } from '@/lib/frete';
import { margemLiquida, MARGEM_MINIMA_CENTS, type LinhaCalculada } from '@/lib/preco';
import { criarPagamento } from '@/lib/mercadopago';
import { identidade, permitido } from '@/lib/rate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cria o pedido e o pagamento. Invariantes que nao podem cair:
 *  1. O navegador manda id e qtd. Preco, frete e total vem do banco.
 *  2. Pedido nasce 'aguardando_pagamento'. So o webhook marca 'pago'.
 *  3. idempotency_key impede pedido duplicado por clique duplo ou retry.
 *  4. Endereco fora de zona nao finaliza.
 *  5. O cartao nunca chega aqui: so o token descartavel do SDK.
 */
export async function POST(req: Request) {
  const sb = await supabaseServidor();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: 'Faça login para finalizar' }, { status: 401 });

  if (!(await permitido(`checkout:${auth.user.id}`, 10, 300)))
    return NextResponse.json({ erro: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });

  let bruto: unknown;
  try { bruto = await req.json(); } catch { return NextResponse.json({ erro: 'Payload inválido' }, { status: 400 }); }

  const parsed = checkoutSchema.safeParse(bruto);
  if (!parsed.success) return NextResponse.json({ erro: 'Dados inválidos' }, { status: 422 });
  const { itens, endereco_id, meio, idempotency_key, card_token, parcelas } = parsed.data;

  if (meio !== 'pix' && !card_token)
    return NextResponse.json({ erro: 'Dados do cartão não chegaram' }, { status: 422 });

  const admin = supabaseAdmin();

  // idempotencia: mesma chave, mesma resposta
  const { data: existente } = await admin.from('pedido')
    .select('id,numero,total_cents,status,pix_qr,pix_copia_cola')
    .eq('idempotency_key', idempotency_key).maybeSingle();
  if (existente) return NextResponse.json({ pedido: existente, repetido: true });

  const { data: endereco } = await sb.from('endereco')
    .select('id,cliente_id,zona_id').eq('id', endereco_id).maybeSingle();
  if (!endereco || endereco.cliente_id !== auth.user.id || !endereco.zona_id)
    return NextResponse.json({ erro: 'Endereço inválido' }, { status: 403 });

  // PRECO VEM DO BANCO
  const ids = [...new Set(itens.map(i => i.produto_id))];
  const { data: produtos } = await admin.from('produto')
    .select('id,nome,preco_venda_cents,custo_ne_cents,ativo,disponibilidade').in('id', ids);
  if (!produtos || produtos.length !== ids.length)
    return NextResponse.json({ erro: 'Algum item saiu do catálogo' }, { status: 409 });

  const linhas: LinhaCalculada[] = [];
  for (const it of itens) {
    const p = produtos.find(x => x.id === it.produto_id)!;
    if (!p.ativo || p.disponibilidade === 'indisponivel')
      return NextResponse.json({ erro: `${p.nome} está indisponível` }, { status: 409 });
    linhas.push({
      produto_id: p.id, nome: p.nome, qtd: it.qtd,
      preco_cents: p.preco_venda_cents, custo_cents: p.custo_ne_cents,
      total_cents: p.preco_venda_cents * it.qtd,
    });
  }

  const subtotal_cents = linhas.reduce((s, l) => s + l.total_cents, 0);
  const custo_cents = linhas.reduce((s, l) => s + l.custo_cents * l.qtd, 0);

  const { data: zona } = await admin.from('zona').select('*').eq('id', endereco.zona_id).maybeSingle();
  const frete = calcularFrete(zona as Zona | null, subtotal_cents);
  if (!frete) return NextResponse.json({ erro: 'Ainda não entregamos nesse endereço' }, { status: 422 });

  const total_cents = subtotal_cents + frete.valor_cents;
  const margem = margemLiquida({ subtotal_cents, custo_cents, frete_cents: frete.valor_cents, meio });
  if (margem < MARGEM_MINIMA_CENTS)
    return NextResponse.json({
      erro: `Para entregar nessa região o pedido mínimo é maior. Adicione mais um item.`,
    }, { status: 422 });

  const { data: pedido, error } = await admin.from('pedido').insert({
    cliente_id: auth.user.id, endereco_id, zona_id: endereco.zona_id,
    status: 'aguardando_pagamento',
    subtotal_cents, frete_cents: frete.valor_cents, total_cents,
    custo_cents, margem_cents: margem, meio_pagamento: meio,
    parcelas: meio === 'pix' ? 1 : (parcelas ?? 1),
    idempotency_key,
  }).select('id,numero,total_cents').single();
  if (error || !pedido) return NextResponse.json({ erro: 'Não foi possível criar o pedido' }, { status: 500 });

  await admin.from('pedido_item').insert(linhas.map(l => ({
    pedido_id: pedido.id, produto_id: l.produto_id, nome: l.nome,
    qtd: l.qtd, preco_cents: l.preco_cents, custo_cents: l.custo_cents,
  })));

  try {
    const pg = await criarPagamento({
      pedidoId: pedido.id,
      valorCents: total_cents,
      meio,
      descricao: `Suplementos Express pedido ${pedido.numero}`,
      pagador: { email: auth.user.email ?? `${auth.user.id}@suplementosexpress.com.br` },
      cardToken: card_token,
      parcelas,
      idempotencia: idempotency_key,
    });

    await admin.from('pedido').update({
      mp_payment_id: pg.id,
      pix_qr: pg.pix_qr ?? null,
      pix_copia_cola: pg.pix_copia_cola ?? null,
      pix_expira_em: pg.expira_em ?? null,
      // aprovacao imediata do cartao ainda assim e confirmada pelo webhook
      status: pg.status === 'approved' ? 'pago' : 'aguardando_pagamento',
    }).eq('id', pedido.id);

    return NextResponse.json({
      pedido: { ...pedido, status: pg.status === 'approved' ? 'pago' : 'aguardando_pagamento' },
      pagamento: {
        status: pg.status,
        pix_qr: pg.pix_qr ?? null,
        pix_copia_cola: pg.pix_copia_cola ?? null,
        expira_em: pg.expira_em ?? null,
      },
      frete,
    });
  } catch {
    await admin.from('pedido').update({ status: 'cancelado' }).eq('id', pedido.id);
    return NextResponse.json({ erro: 'O pagamento não foi aprovado. Confira os dados ou tente outro método.' }, { status: 402 });
  }
}
