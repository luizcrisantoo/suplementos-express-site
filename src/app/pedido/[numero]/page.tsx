import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseServidor } from '@/lib/supabase-server';
import { brl } from '@/lib/dinheiro';
import PixPainel from '@/components/PixPainel';
import LimpaCarrinho from '@/components/LimpaCarrinho';

export const metadata: Metadata = { title: 'Seu pedido', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const ROTULO: Record<string, { texto: string; cor: string }> = {
  aguardando_pagamento: { texto: 'Aguardando pagamento', cor: 'bg-ouro-100 text-ouro-700' },
  pago:                 { texto: 'Pagamento confirmado', cor: 'bg-ok/10 text-ok' },
  em_separacao:         { texto: 'Separando seu pedido', cor: 'bg-ok/10 text-ok' },
  saiu_para_entrega:    { texto: 'Saiu para entrega',    cor: 'bg-ok/10 text-ok' },
  entregue:             { texto: 'Entregue',             cor: 'bg-ok/10 text-ok' },
  cancelado:            { texto: 'Cancelado',            cor: 'bg-alerta/10 text-alerta' },
  estornado:            { texto: 'Estornado',            cor: 'bg-alerta/10 text-alerta' },
};

export default async function Pedido({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const n = Number(numero);
  if (!Number.isInteger(n)) notFound();

  const sb = await supabaseServidor();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) redirect(`/entrar?destino=/pedido/${numero}`);

  // RLS garante que so o dono le. Sem select extra de seguranca no codigo.
  const { data: pedido } = await sb.from('pedido')
    .select('id,numero,status,subtotal_cents,frete_cents,total_cents,meio_pagamento,pix_qr,pix_copia_cola,pix_expira_em,criado_em')
    .eq('numero', n).maybeSingle();
  if (!pedido) notFound();

  const { data: itens } = await sb.from('pedido_item')
    .select('nome,qtd,preco_cents').eq('pedido_id', pedido.id);

  const r = ROTULO[pedido.status] ?? ROTULO['aguardando_pagamento']!;
  const pago = ['pago', 'em_separacao', 'saiu_para_entrega', 'entregue'].includes(pedido.status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <LimpaCarrinho />

      <p className="text-sm text-neve-600 tabular">Pedido #{pedido.numero}</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold">
        {pago ? 'Pedido confirmado' : 'Falta o pagamento'}
      </h1>
      <p className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${r.cor}`}>{r.texto}</p>

      {pedido.status === 'aguardando_pagamento' && pedido.pix_copia_cola && (
        <PixPainel
          qr={pedido.pix_qr}
          copiaCola={pedido.pix_copia_cola}
          expiraEm={pedido.pix_expira_em}
          numero={pedido.numero}
        />
      )}

      {pago && (
        <p className="mt-6 rounded-card border border-ok/30 bg-ok/5 p-4 text-sm">
          Recebemos o seu pagamento. Vamos te avisar no WhatsApp quando o pedido sair para entrega.
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">Itens</h2>
        <ul className="mt-3 divide-y divide-neve-200">
          {(itens ?? []).map((i, k) => (
            <li key={k} className="flex justify-between py-3 text-sm">
              <span><span className="tabular">{i.qtd}×</span> {i.nome}</span>
              <span className="tabular">{brl(i.preco_cents * i.qtd)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular">{brl(pedido.subtotal_cents)}</dd></div>
          <div className="flex justify-between">
            <dt>Frete</dt>
            <dd className="tabular">{pedido.frete_cents === 0 ? <span className="text-ok">grátis</span> : brl(pedido.frete_cents)}</dd>
          </div>
          <div className="flex justify-between border-t border-neve-200 pt-2 font-display text-lg font-extrabold">
            <dt>Total</dt><dd className="tabular">{brl(pedido.total_cents)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
