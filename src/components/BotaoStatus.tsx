'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BotaoStatus({ pedidoId, novo, rotulo }: { pedidoId: string; novo: string; rotulo: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  async function mudar() {
    setOcupado(true);
    const r = await fetch('/api/painel/status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido_id: pedidoId, status: novo }),
    });
    setOcupado(false);
    if (r.ok) router.refresh();
    else alert('Não consegui atualizar o pedido.');
  }

  return (
    <button onClick={mudar} disabled={ocupado}
            className="rounded-lg bg-tinta px-3 py-1.5 text-xs font-bold text-neve disabled:opacity-40">
      {ocupado ? '…' : rotulo}
    </button>
  );
}
