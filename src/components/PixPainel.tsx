'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PixPainel({
  qr, copiaCola, expiraEm, numero,
}: { qr: string | null; copiaCola: string; expiraEm: string | null; numero: number }) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);
  const [restante, setRestante] = useState<string | null>(null);

  // o webhook e quem confirma. Aqui so recarregamos para ver a mudanca de status.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(t);
  }, [router]);

  useEffect(() => {
    if (!expiraEm) return;
    const fim = new Date(expiraEm).getTime();
    const tick = () => {
      const s = Math.max(0, Math.floor((fim - Date.now()) / 1000));
      setRestante(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiraEm]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(copiaCola);
      setCopiado(true); setTimeout(() => setCopiado(false), 2500);
    } catch { /* sem permissao de clipboard: o texto segue selecionavel abaixo */ }
  }

  return (
    <div className="mt-6 rounded-card border border-neve-200 p-5">
      <h2 className="font-display text-lg font-bold">Pague com Pix</h2>
      <p className="mt-1 text-sm text-neve-600">
        Abra o app do banco, escolha Pix e aponte para o código.
        {restante && <> Expira em <strong className="tabular">{restante}</strong>.</>}
      </p>

      {qr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`data:image/png;base64,${qr}`} alt={`QR Code do Pix do pedido ${numero}`}
             width={240} height={240} className="mx-auto mt-4 rounded bg-white p-2" />
      )}

      <button onClick={copiar}
              className="mt-4 w-full rounded-lg bg-tinta px-5 py-3 font-display font-bold text-neve">
        {copiado ? 'Código copiado' : 'Copiar código Pix'}
      </button>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-neve-600">ver o código</summary>
        <p className="mt-2 break-all rounded bg-neve-200/40 p-3 text-xs">{copiaCola}</p>
      </details>

      <p className="mt-4 text-center text-xs text-neve-600" role="status">
        Esta página se atualiza sozinha quando o pagamento cair.
      </p>
    </div>
  );
}
