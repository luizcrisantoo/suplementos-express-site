import { supabaseAdmin } from '@/lib/supabase-server';
import { brl } from '@/lib/dinheiro';
import BotaoStatus from '@/components/BotaoStatus';

export const dynamic = 'force-dynamic';

const PROXIMO: Record<string, { valor: string; rotulo: string } | undefined> = {
  pago:              { valor: 'em_separacao',      rotulo: 'Separar' },
  em_separacao:      { valor: 'saiu_para_entrega', rotulo: 'Saiu para entrega' },
  saiu_para_entrega: { valor: 'entregue',          rotulo: 'Entregue' },
};

const COR: Record<string, string> = {
  aguardando_pagamento: 'bg-ouro-100 text-ouro-700',
  pago: 'bg-ok/10 text-ok', em_separacao: 'bg-ok/10 text-ok',
  saiu_para_entrega: 'bg-ok/10 text-ok', entregue: 'bg-neve-200 text-neve-600',
  cancelado: 'bg-alerta/10 text-alerta', estornado: 'bg-alerta/10 text-alerta',
};

export default async function Painel() {
  const admin = supabaseAdmin();
  const inicioDoDia = new Date(); inicioDoDia.setHours(0, 0, 0, 0);

  const { data: pedidos } = await admin.from('pedido')
    .select('id,numero,status,total_cents,frete_cents,custo_cents,margem_cents,meio_pagamento,criado_em,zona:zona_id(codigo),cliente:cliente_id(nome,telefone)')
    .gte('criado_em', inicioDoDia.toISOString())
    .order('criado_em', { ascending: false });

  const lista = pedidos ?? [];
  const pagos = lista.filter(p => p.status !== 'aguardando_pagamento' && p.status !== 'cancelado');
  const faturamento = pagos.reduce((s, p) => s + p.total_cents, 0);
  const margem = pagos.reduce((s, p) => s + (p.margem_cents ?? 0), 0);
  const ticket = pagos.length ? Math.round(faturamento / pagos.length) : 0;

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Pedidos de hoje</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile rotulo="Pedidos pagos" valor={String(pagos.length)} />
        <Tile rotulo="Faturamento" valor={brl(faturamento)} />
        <Tile rotulo="Margem líquida" valor={brl(margem)} destaque={margem > 0} />
        <Tile rotulo="Ticket médio" valor={brl(ticket)} />
      </div>

      {lista.length === 0 ? (
        <p className="mt-10 rounded-card border border-neve-200 p-10 text-center text-neve-600">
          Nenhum pedido hoje ainda.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-neve-200">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-neve-200/40 text-left text-xs uppercase tracking-wider text-neve-600">
              <tr>
                <th className="px-4 py-3">Nº</th><th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Pgto</th><th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Margem</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neve-200">
              {lista.map(p => {
                const prox = PROXIMO[p.status];
                const cliente = p.cliente as unknown as { nome: string | null; telefone: string | null } | null;
                const zona = p.zona as unknown as { codigo: string } | null;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-semibold tabular">#{p.numero}</td>
                    <td className="px-4 py-3 tabular">
                      {new Date(p.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Recife' })}
                    </td>
                    <td className="px-4 py-3">{cliente?.nome ?? cliente?.telefone ?? '—'}</td>
                    <td className="px-4 py-3">{zona?.codigo ?? '—'}</td>
                    <td className="px-4 py-3">{p.meio_pagamento ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular">{brl(p.total_cents)}</td>
                    <td className={`px-4 py-3 text-right tabular ${(p.margem_cents ?? 0) < 1200 ? 'text-alerta' : ''}`}>
                      {brl(p.margem_cents ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COR[p.status] ?? ''}`}>
                        {p.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {prox && <BotaoStatus pedidoId={p.id} novo={prox.valor} rotulo={prox.rotulo} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Tile({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`rounded-card border p-4 ${destaque ? 'border-ok/40 bg-ok/5' : 'border-neve-200'}`}>
      <p className="text-xs uppercase tracking-wider text-neve-600">{rotulo}</p>
      <p className="mt-1 font-display text-xl font-extrabold tabular">{valor}</p>
    </div>
  );
}
