'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseNavegador } from '@/lib/supabase-browser';

function FormEntrar() {
  const router = useRouter();
  const params = useSearchParams();
  const destino = params.get('destino') ?? '/checkout';

  const [fase, setFase] = useState<'telefone' | 'codigo'>('telefone');
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const e164 = () => '+55' + telefone.replace(/\D/g, '');

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setCarregando(true); setErro(null);
    const { error } = await supabaseNavegador().auth.signInWithOtp({ phone: e164() });
    setCarregando(false);
    if (error) return setErro('Não consegui enviar o código. Confira o número.');
    setFase('codigo');
  }

  async function conferir(e: React.FormEvent) {
    e.preventDefault(); setCarregando(true); setErro(null);
    const { error } = await supabaseNavegador().auth
      .verifyOtp({ phone: e164(), token: codigo, type: 'sms' });
    setCarregando(false);
    if (error) return setErro('Código inválido ou expirado.');
    router.push(destino); router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-2xl font-extrabold">Entrar</h1>
      <p className="mt-2 text-sm text-neve-600">
        Só o seu número. Sem senha para lembrar, e é por ele que avisamos quando o pedido sai para entrega.
      </p>

      {fase === 'telefone' ? (
        <form onSubmit={enviar} className="mt-6 space-y-3">
          <label htmlFor="tel" className="block text-sm font-semibold">Celular com DDD</label>
          <input id="tel" inputMode="tel" autoComplete="tel-national" placeholder="81 90000-0000"
                 value={telefone} onChange={e => setTelefone(e.target.value)}
                 className="w-full rounded-lg border border-neve-200 px-3 py-2.5 tabular" />
          <button disabled={carregando || telefone.replace(/\D/g, '').length < 10}
                  className="w-full rounded-lg bg-tinta px-5 py-3 font-display font-bold text-neve disabled:opacity-40">
            {carregando ? 'Enviando…' : 'Receber código por SMS'}
          </button>
        </form>
      ) : (
        <form onSubmit={conferir} className="mt-6 space-y-3">
          <label htmlFor="cod" className="block text-sm font-semibold">Código que chegou por SMS</label>
          <input id="cod" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000"
                 value={codigo} onChange={e => setCodigo(e.target.value)}
                 className="w-full rounded-lg border border-neve-200 px-3 py-2.5 text-center text-xl tracking-[0.4em] tabular" />
          <button disabled={carregando || codigo.length < 4}
                  className="w-full rounded-lg bg-ouro px-5 py-3 font-display font-bold text-tinta disabled:opacity-40">
            {carregando ? 'Conferindo…' : 'Entrar'}
          </button>
          <button type="button" onClick={() => setFase('telefone')} className="w-full text-sm text-neve-600 underline">
            usar outro número
          </button>
        </form>
      )}

      {erro && <p className="mt-4 rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta" role="alert">{erro}</p>}
    </div>
  );
}

export default function Entrar() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-4 py-16 text-neve-600">Carregando…</div>}>
      <FormEntrar />
    </Suspense>
  );
}
