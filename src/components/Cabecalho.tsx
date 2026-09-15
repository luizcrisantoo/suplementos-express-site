'use client';
import Link from 'next/link';
import Logo from './Logo';
import { useCarrinho } from './CarrinhoProvider';

const CATEGORIAS = [
  ['proteina', 'Proteína'], ['creatina', 'Creatina'], ['pre-treino', 'Pré-treino'],
  ['hipercalorico', 'Hipercalórico'], ['barrinhas-e-snacks', 'Snacks'],
  ['vitamina-mineral', 'Vitaminas'], ['termogenico', 'Termogênico'],
] as const;

export default function Cabecalho() {
  const { quantidade, abrir } = useCarrinho();
  return (
    <header className="sticky top-0 z-40 bg-tinta text-neve">
      <p className="bg-ouro text-tinta text-center text-[13px] font-semibold py-1.5 px-4">
        Pediu até 16h, recebe hoje · Frete grátis acima de R$ 149
      </p>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" aria-label="Suplementos Express, página inicial" className="flex-none">
          <Logo altura={36} prioridade />
        </Link>
        <nav className="ml-auto hidden lg:block" aria-label="Categorias">
          <ul className="flex gap-5 text-sm">
            {CATEGORIAS.map(([slug, nome]) => (
              <li key={slug}>
                <Link href={`/c/${slug}`} className="hover:text-ouro transition-colors">{nome}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <button
          onClick={abrir}
          className="ml-auto lg:ml-0 rounded-full bg-ouro px-4 py-2 text-sm font-bold text-tinta"
          aria-label={`Abrir carrinho com ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`}
        >
          Carrinho {quantidade > 0 && <span className="tabular">({quantidade})</span>}
        </button>
      </div>
    </header>
  );
}
