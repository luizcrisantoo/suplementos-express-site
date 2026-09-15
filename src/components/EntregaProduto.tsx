'use client';
import { useEffect, useState } from 'react';
import { brl } from '@/lib/dinheiro';
import type { ResultadoFrete } from './CalculadoraFrete';

const CHAVE = 'se_cep_v1';
const VALIDADE_MS = 12 * 60 * 60 * 1000;

type Lembrado = { cep: string; bairro: string; cidade: string; texto: string; hoje: boolean; ts: number };

function ler(): Lembrado | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const l = JSON.parse(bruto) as Lembrado;
    return Date.now() - l.ts < VALIDADE_MS ? l : null;
  } catch { return null; }
}

/**
 * "Chega hoje no seu bairro?" na propria pagina do produto.
 *
 * O cliente nao deveria precisar montar o carrinho inteiro para descobrir se a
 * gente entrega na rua dele. O CEP fica lembrado por 12h no navegador, entao a
 * partir do segundo produto a resposta ja aparece pronta, sem nova consulta.
 */
export default function EntregaProduto({ precoCents }: { precoCents: number }) {
  const [lembrado, setLembrado] = useState<Lembrado | null>(null);
  const [montado, setMontado] = useState(false);
  const [trocando, setTrocando] = useState(false);
  const [cep, setCep] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [r, setR] = useState<ResultadoFrete | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // localStorage so depois da hidratacao, senao o HTML do servidor nao bate
  useEffect(() => { setLembrado(ler()); setMontado(true); }, []);

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true); setErro(null);
    try {
      const resp = await fetch('/api/frete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep, subtotal_cents: precoCents }),
      });
      const dados: ResultadoFrete & { erro?: string } = await resp.json();
      if (!resp.ok) { setErro(dados.erro ?? 'Não consegui consultar esse CEP'); setR(null); return; }
      setR(dados);
      if (dados.atende && dados.entrega && dados.endereco) {
        const novo: Lembrado = {
          cep: dados.endereco.cep, bairro: dados.endereco.bairro, cidade: dados.endereco.cidade,
          texto: dados.entrega.texto, hoje: dados.entrega.hoje, ts: Date.now(),
        };
        try { localStorage.setItem(CHAVE, JSON.stringify(novo)); } catch {}
        setLembrado(novo); setTrocando(false);
      } else {
        try { localStorage.removeItem(CHAVE); } catch {}
        setLembrado(null);
      }
    } catch {
      setErro('Falha de conexão. Tente de novo.');
    } finally { setCarregando(false); }
  }

  const digitos = cep.replace(/\D/g, '');
  const mostrarForm = !montado || !lembrado || trocando;

  return (
    <div className="mt-5 rounded-card border border-neve-200 p-4">
      {lembrado && !trocando && (
        <div className="text-sm" role="status">
          <p className={lembrado.hoje ? 'font-semibold text-ok' : 'font-semibold'}>
            {lembrado.texto} em {lembrado.bairro}, {lembrado.cidade}
          </p>
          {r?.atende && r.frete && (
            <p className="mt-1">
              Frete deste item:{' '}
              {r.frete.gratis
                ? <strong className="text-ok">grátis</strong>
                : <strong className="tabular">{brl(r.frete.valor_cents)}</strong>}
              {!r.frete.gratis && r.frete.falta_para_gratis_cents > 0 && (
                <span className="text-neve-600">
                  {' '}· faltam <span className="tabular">{brl(r.frete.falta_para_gratis_cents)}</span> para sair de graça
                </span>
              )}
            </p>
          )}
          <button
            onClick={() => { setTrocando(true); setCep(lembrado.cep); }}
            className="mt-2 text-sm font-semibold text-neve-600 underline hover:text-tinta"
          >
            Trocar CEP ({lembrado.cep})
          </button>
        </div>
      )}

      {mostrarForm && (
        <form onSubmit={consultar} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[150px] flex-1">
            <label htmlFor="cep-produto" className="block text-sm font-semibold">
              Chega hoje no seu endereço?
            </label>
            <input
              id="cep-produto" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
              value={cep} onChange={e => setCep(e.target.value)} maxLength={9}
              className="mt-1 w-full rounded-lg border border-neve-200 px-3 py-2 tabular"
            />
          </div>
          <button
            disabled={carregando || digitos.length !== 8}
            className="rounded-lg bg-tinta px-4 py-2 font-semibold text-neve disabled:opacity-40"
          >
            {carregando ? 'Consultando…' : 'Ver'}
          </button>
        </form>
      )}

      {erro && <p className="mt-3 text-sm text-alerta" role="alert">{erro}</p>}

      {r && !r.atende && (
        <p className="mt-3 rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta" role="status">
          {r.mensagem}
        </p>
      )}
    </div>
  );
}
