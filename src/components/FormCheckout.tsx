'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { brl } from '@/lib/dinheiro';
import { useCarrinho } from './CarrinhoProvider';
import CalculadoraFrete, { type ResultadoFrete } from './CalculadoraFrete';
import { supabaseNavegador } from '@/lib/supabase-browser';

export type Endereco = {
  id: string; cep: string; rua: string; numero: string;
  complemento: string | null; bairro: string; cidade: string; zona_id: number | null;
};

export default function FormCheckout({ enderecos }: { enderecos: Endereco[] }) {
  const router = useRouter();
  const { linhas, subtotal_cents } = useCarrinho();
  const [enderecoId, setEnderecoId] = useState<string | null>(enderecos[0]?.id ?? null);
  const [novo, setNovo] = useState(enderecos.length === 0);
  const [frete, setFrete] = useState<ResultadoFrete | null>(null);
  const [meio, setMeio] = useState<'pix' | 'credito'>('pix');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({ rua: '', numero: '', complemento: '', referencia: '' });
  const valorFrete = frete?.atende ? frete.frete?.valor_cents ?? 0 : 0;
  const total = subtotal_cents + valorFrete;

  async function salvarEndereco(): Promise<string | null> {
    if (!frete?.atende || !frete.endereco || !frete.zona) { setErro('Confirme o CEP antes.'); return null; }
    const sb = supabaseNavegador();
    const { data: sessao } = await sb.auth.getUser();
    if (!sessao.user) { router.push('/entrar?destino=/checkout'); return null; }

    const { data, error } = await sb.from('endereco').insert({
      cliente_id: sessao.user.id,
      cep: frete.endereco.cep,
      rua: form.rua || frete.endereco.rua,
      numero: form.numero,
      complemento: form.complemento || null,
      referencia: form.referencia || null,
      bairro: frete.endereco.bairro,
      cidade: frete.endereco.cidade,
      zona_id: frete.zona.id,
    }).select('id').single();

    if (error || !data) { setErro('Não consegui salvar o endereço.'); return null; }
    return data.id;
  }

  async function finalizar() {
    setErro(null); setEnviando(true);
    try {
      const id = novo ? await salvarEndereco() : enderecoId;
      if (!id) { setEnviando(false); return; }

      const resp = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // so id e quantidade. Preco e total sao recalculados no servidor.
          itens: linhas.map(l => ({ produto_id: l.id, qtd: l.qtd })),
          endereco_id: id,
          meio,
          idempotency_key: crypto.randomUUID(),
        }),
      });
      const dados = await resp.json();
      if (!resp.ok) { setErro(dados.erro ?? 'Não foi possível finalizar.'); return; }
      router.push(`/pedido/${dados.pedido.numero}`);
    } catch {
      setErro('Falha de conexão. Seu carrinho continua salvo.');
    } finally { setEnviando(false); }
  }

  if (linhas.length === 0)
    return <p className="mt-8 text-neve-600">Seu carrinho está vazio.</p>;

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="font-display text-lg font-bold">1. Onde entregar</h2>

        {enderecos.length > 0 && (
          <div className="mt-3 space-y-2">
            {enderecos.map(e => (
              <label key={e.id} className="flex cursor-pointer gap-3 rounded-card border border-neve-200 p-3">
                <input type="radio" name="endereco" checked={!novo && enderecoId === e.id}
                       onChange={() => { setNovo(false); setEnderecoId(e.id); }} className="mt-1" />
                <span className="text-sm">
                  {e.rua}, {e.numero}{e.complemento ? ` · ${e.complemento}` : ''}<br />
                  <span className="text-neve-600">{e.bairro}, {e.cidade} · {e.cep}</span>
                </span>
              </label>
            ))}
            <label className="flex cursor-pointer gap-3 rounded-card border border-neve-200 p-3">
              <input type="radio" name="endereco" checked={novo} onChange={() => setNovo(true)} className="mt-1" />
              <span className="text-sm font-semibold">Entregar em outro endereço</span>
            </label>
          </div>
        )}

        {novo && (
          <div className="mt-4 space-y-3">
            <CalculadoraFrete subtotalCents={subtotal_cents} onResultado={r => {
              setFrete(r);
              if (r.atende && r.endereco) setForm(f => ({ ...f, rua: f.rua || r.endereco!.rua }));
            }} />
            {frete?.atende && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo id="rua" rotulo="Rua" valor={form.rua} onChange={v => setForm({ ...form, rua: v })} />
                <Campo id="numero" rotulo="Número" valor={form.numero} onChange={v => setForm({ ...form, numero: v })} />
                <Campo id="complemento" rotulo="Complemento (opcional)" valor={form.complemento} onChange={v => setForm({ ...form, complemento: v })} />
                <Campo id="referencia" rotulo="Ponto de referência (opcional)" valor={form.referencia} onChange={v => setForm({ ...form, referencia: v })} />
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">2. Como pagar</h2>
        <div className="mt-3 space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-card border border-neve-200 p-4">
            <input type="radio" name="meio" checked={meio === 'pix'} onChange={() => setMeio('pix')} className="mt-1" />
            <span>
              <strong className="font-semibold">Pix</strong>
              <span className="block text-sm text-neve-600">
                O QR aparece na próxima tela. O pedido entra na fila assim que o pagamento cai.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-card border border-neve-200 p-4">
            <input type="radio" name="meio" checked={meio === 'credito'} onChange={() => setMeio('credito')} className="mt-1" />
            <span>
              <strong className="font-semibold">Cartão de crédito</strong>
              <span className="block text-sm text-neve-600">Em até 6x. Os dados do cartão vão direto para o Mercado Pago.</span>
            </span>
          </label>
        </div>
        {meio === 'credito' && (
          <p className="mt-3 rounded-lg bg-ouro-100 px-3 py-2 text-sm text-ouro-700">
            O formulário de cartão é montado pelo SDK do Mercado Pago e ainda não está plugado nesta tela.
            Use Pix por enquanto.
          </p>
        )}
      </section>

      <section className="rounded-card border border-neve-200 p-4">
        <h2 className="font-display text-lg font-bold">3. Resumo</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal ({linhas.length} itens)</dt><dd className="tabular">{brl(subtotal_cents)}</dd></div>
          <div className="flex justify-between">
            <dt>Frete</dt>
            <dd className="tabular">{frete?.frete?.gratis ? <span className="text-ok">grátis</span> : brl(valorFrete)}</dd>
          </div>
          <div className="flex justify-between border-t border-neve-200 pt-2 font-display text-xl font-extrabold">
            <dt>Total</dt><dd className="tabular">{brl(total)}</dd>
          </div>
        </dl>

        {erro && <p className="mt-3 rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta" role="alert">{erro}</p>}

        <button
          onClick={finalizar}
          disabled={enviando || meio === 'credito' || (novo && (!frete?.atende || !form.numero))}
          className="mt-4 w-full rounded-lg bg-ouro px-6 py-4 font-display text-lg font-extrabold text-tinta disabled:opacity-40"
        >
          {enviando ? 'Criando pedido…' : `Pagar ${brl(total)} no Pix`}
        </button>
        <p className="mt-2 text-center text-xs text-neve-600">
          O valor é recalculado no servidor antes da cobrança.
        </p>
      </section>
    </div>
  );
}

function Campo({ id, rotulo, valor, onChange }: { id: string; rotulo: string; valor: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">{rotulo}</label>
      <input id={id} value={valor} onChange={e => onChange(e.target.value)}
             className="mt-1 w-full rounded-lg border border-neve-200 px-3 py-2" />
    </div>
  );
}
