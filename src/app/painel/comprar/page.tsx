import { supabaseAdmin } from '@/lib/supabase-server';
import { brl } from '@/lib/dinheiro';

export const dynamic = 'force-dynamic';

type Linha = {
  cod_forn: string; nome: string; marca: string; categoria: string;
  unidades: number; custo_unit_cents: number; custo_total_cents: number; pedidos: number[];
};

export default async function Comprar() {
  const { data } = await supabaseAdmin().from('compra_do_dia').select('*');
  const linhas = (data ?? []) as Linha[];
  const total = linhas.reduce((s, l) => s + l.custo_total_cents, 0);
  const unidades = linhas.reduce((s, l) => s + l.unidades, 0);

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Comprar na NE hoje</h1>
      <p className="mt-1 text-sm text-neve-600">
        Itens dos pedidos já pagos e ainda não entregues, somados por produto.
        O código é o mesmo que a NE usa, então dá pra buscar direto no site deles.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-neve-200 p-4">
          <p className="text-xs uppercase tracking-wider text-neve-600">Produtos</p>
          <p className="mt-1 font-display text-xl font-extrabold tabular">{linhas.length}</p>
        </div>
        <div className="rounded-card border border-neve-200 p-4">
          <p className="text-xs uppercase tracking-wider text-neve-600">Unidades</p>
          <p className="mt-1 font-display text-xl font-extrabold tabular">{unidades}</p>
        </div>
        <div className="rounded-card border border-ouro bg-ouro-100 p-4">
          <p className="text-xs uppercase tracking-wider text-ouro-700">Vai gastar</p>
          <p className="mt-1 font-display text-xl font-extrabold tabular text-ouro-700">{brl(total)}</p>
        </div>
      </div>

      {linhas.length === 0 ? (
        <p className="mt-10 rounded-card border border-neve-200 p-10 text-center text-neve-600">
          Nada para comprar. Nenhum pedido pago em aberto.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-neve-200">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-neve-200/40 text-left text-xs uppercase tracking-wider text-neve-600">
              <tr>
                <th className="px-4 py-3">Cód. NE</th><th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3 text-right">Qtd</th>
                <th className="px-4 py-3 text-right">Custo un.</th>
                <th className="px-4 py-3 text-right">Custo total</th>
                <th className="px-4 py-3">Pedidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neve-200">
              {linhas.map(l => (
                <tr key={l.cod_forn}>
                  <td className="px-4 py-3 tabular text-neve-600">{l.cod_forn}</td>
                  <td className="px-4 py-3 font-semibold">{l.nome}</td>
                  <td className="px-4 py-3 text-neve-600">{l.marca}</td>
                  <td className="px-4 py-3 text-right font-display font-extrabold tabular">{l.unidades}</td>
                  <td className="px-4 py-3 text-right tabular">{brl(l.custo_unit_cents)}</td>
                  <td className="px-4 py-3 text-right tabular">{brl(l.custo_total_cents)}</td>
                  <td className="px-4 py-3 tabular text-xs text-neve-600">
                    {l.pedidos.map(n => `#${n}`).join(' ')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-tinta">
              <tr className="font-display font-extrabold">
                <td className="px-4 py-3" colSpan={5}>Total</td>
                <td className="px-4 py-3 text-right tabular">{brl(total)}</td><td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );
}
