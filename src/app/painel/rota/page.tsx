import { supabaseAdmin } from '@/lib/supabase-server';
import { brl } from '@/lib/dinheiro';

export const dynamic = 'force-dynamic';

type Parada = {
  zona: string; zona_nome: string; numero: number; status: string;
  total_cents: number; margem_cents: number;
  cliente: string | null; telefone: string | null;
  rua: string; num: string; complemento: string | null; bairro: string;
  referencia: string | null; criado_em: string;
};

export default async function Rota() {
  const { data } = await supabaseAdmin().from('rota_do_dia').select('*');
  const paradas = (data ?? []) as Parada[];

  const porZona = paradas.reduce<Record<string, Parada[]>>((acc, p) => {
    (acc[p.zona] ??= []).push(p); return acc;
  }, {});

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Rota de entrega</h1>
      <p className="mt-1 text-sm text-neve-600">
        Pedidos pagos agrupados por zona. Entregue uma zona por vez: é o que faz o custo
        por entrega cair.
      </p>

      {paradas.length === 0 ? (
        <p className="mt-10 rounded-card border border-neve-200 p-10 text-center text-neve-600">
          Nenhuma entrega na fila.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {Object.entries(porZona).map(([zona, lista]) => (
            <section key={zona}>
              <h2 className="font-display text-lg font-extrabold">
                {zona} · {lista[0]!.zona_nome}
                <span className="ml-2 text-sm font-semibold text-neve-600 tabular">
                  {lista.length} {lista.length === 1 ? 'parada' : 'paradas'} ·{' '}
                  {brl(lista.reduce((s, p) => s + p.total_cents, 0))}
                </span>
              </h2>

              <ol className="mt-3 space-y-3">
                {lista.map((p, i) => (
                  <li key={p.numero} className="rounded-card border border-neve-200 p-4">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-display text-lg font-extrabold tabular">{i + 1}.</span>
                      <span className="font-semibold tabular">#{p.numero}</span>
                      <span className="text-sm text-neve-600">{p.cliente ?? 'sem nome'}</span>
                      <span className="ml-auto font-display font-extrabold tabular">{brl(p.total_cents)}</span>
                    </div>
                    <p className="mt-2 text-sm">
                      {p.rua}, {p.num}{p.complemento ? ` · ${p.complemento}` : ''}<br />
                      <span className="text-neve-600">{p.bairro}</span>
                      {p.referencia && <><br /><span className="text-neve-600">Referência: {p.referencia}</span></>}
                    </p>
                    {p.telefone && (
                      <a href={`https://wa.me/${p.telefone.replace(/\D/g, '')}`}
                         target="_blank" rel="noopener noreferrer"
                         className="mt-3 inline-block rounded-lg bg-ok px-3 py-1.5 text-xs font-bold text-white">
                        Avisar no WhatsApp
                      </a>
                    )}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.rua}, ${p.num}, ${p.bairro}, Recife`)}`}
                       target="_blank" rel="noopener noreferrer"
                       className="ml-2 mt-3 inline-block rounded-lg border border-neve-200 px-3 py-1.5 text-xs font-bold">
                      Abrir no mapa
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
