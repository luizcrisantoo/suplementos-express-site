import Link from 'next/link';
import type { Metadata } from 'next';
import { exigirAdmin } from '@/lib/admin';

export const metadata: Metadata = { title: 'Painel', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const ABAS = [
  ['/painel', 'Pedidos de hoje'],
  ['/painel/comprar', 'Comprar na NE'],
  ['/painel/rota', 'Rota de entrega'],
] as const;

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  await exigirAdmin();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav aria-label="Painel" className="mb-6 flex flex-wrap gap-1 border-b border-neve-200">
        {ABAS.map(([href, nome]) => (
          <Link key={href} href={href}
                className="rounded-t-lg px-4 py-2.5 text-sm font-semibold hover:bg-neve-200/50">
            {nome}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
