'use client';
import { useSearchParams } from 'next/navigation';

/**
 * Busca do cabecalho. E um <form> GET de verdade: funciona sem JavaScript,
 * o resultado tem URL propria e da para compartilhar ou favoritar.
 */
export default function CampoBusca({ className = '' }: { className?: string }) {
  const params = useSearchParams();
  return (
    <form action="/busca" method="get" role="search" className={`relative ${className}`}>
      <label htmlFor="q" className="sr-only">Buscar produto</label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={params.get('q') ?? ''}
        placeholder="Buscar whey, creatina, marca…"
        autoComplete="off"
        className="w-full rounded-lg border border-tinta-700 bg-tinta-800 py-2 pl-9 pr-3 text-sm text-neve placeholder:text-neve-600 focus:border-ouro"
      />
      <svg
        viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neve-400"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <button type="submit" className="sr-only">Buscar</button>
    </form>
  );
}
