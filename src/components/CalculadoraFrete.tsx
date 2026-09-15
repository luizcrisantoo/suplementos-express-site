'use client';
import { useState } from 'react';
import { brl } from '@/lib/dinheiro';

export type ResultadoFrete = {
  atende: boolean; mensagem?: string;
  endereco?: { cep: string; rua: string; bairro: string; cidade: string; uf: string };
  zona?: { id: number; codigo: string; nome: string; corte_hora: number };
  frete?: { valor_cents: number; gratis: boolean; falta_para_gratis_cents: number };
  entrega?: { hoje: boolean; texto: string };
};

export default function CalculadoraFrete({
  subtotalCents, onResultado,
}: { subtotalCents: number; onResultado?: (r: ResultadoFrete) => void }) {
  const [cep, setCep] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [r, setR] = useState<ResultadoFrete | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true); setErro(null);
    try {
      const resp = await fetch('/api/frete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep, subtotal_cents: subtotalCents }),
      });
      const dados = await resp.json();
      if (!resp.ok) { setErro(dados.erro ?? 'Não consegui consultar esse CEP'); setR(null); return; }
      setR(dados); onResultado?.(dados);
    } catch {
      setErro('Falha de conexão. Tente de novo.');
    } finally { setCarregando(false); }
  }

  return (
    <div className="rounded-card border border-neve-200 p-4">
      <form onSubmit={consultar} className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="cep" className="block text-sm font-semibold">Calcular entrega</label>
          <input
            id="cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
            value={cep} onChange={e => setCep(e.target.value)} maxLength={9}
            className="mt-1 w-full rounded-lg border border-neve-200 px-3 py-2 tabular"
          />
        </div>
        <button disabled={carregando || cep.replace(/\D/g, '').length !== 8}
                className="rounded-lg bg-tinta px-4 py-2 font-semibold text-neve disabled:opacity-40">
          {carregando ? 'Consultando…' : 'Ver'}
        </button>
      </form>

      {erro && <p className="mt-3 text-sm text-alerta" role="alert">{erro}</p>}

      {r && !r.atende && (
        <p className="mt-3 rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta" role="status">{r.mensagem}</p>
      )}

      {r?.atende && r.frete && r.entrega && (
        <div className="mt-3 space-y-1 text-sm" role="status">
          <p className="font-semibold text-ok">
            {r.entrega.texto} · {r.endereco?.bairro}, {r.endereco?.cidade}
          </p>
          <p>
            Frete: {r.frete.gratis
              ? <strong className="text-ok">grátis</strong>
              : <strong className="tabular">{brl(r.frete.valor_cents)}</strong>}
          </p>
          {!r.frete.gratis && r.frete.falta_para_gratis_cents > 0 && (
            <p className="text-neve-600">
              Faltam <strong className="tabular">{brl(r.frete.falta_para_gratis_cents)}</strong> para o frete sair de graça.
            </p>
          )}
          {r.entrega.hoje && (
            <p className="text-neve-600">Pedidos até {r.zona?.corte_hora}h saem no mesmo dia.</p>
          )}
        </div>
      )}
    </div>
  );
}
