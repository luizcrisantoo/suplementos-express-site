import Logo from './Logo';
import Link from 'next/link';
import { linkWhatsapp, MSG_PADRAO } from '@/lib/contato';
import { CATEGORIAS } from '@/lib/categorias';

export default function Rodape() {
  return (
    <footer className="mt-20 bg-tinta text-neve-400">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <Logo altura={30} />
          <p className="mt-3 text-sm leading-relaxed">
            Suplementos com entrega no mesmo dia na Região Metropolitana do Recife.
          </p>
        </div>
        <div>
          <h2 className="font-display font-bold text-neve text-sm uppercase tracking-wider">Entrega</h2>
          <ul className="mt-3 space-y-1 text-sm">
            <li>Recife, Olinda, Jaboatão e Camaragibe</li>
            <li>Pedidos até 16h saem no mesmo dia</li>
            <li>Frete grátis acima de R$ 149</li>
          </ul>
        </div>
        <div>
          <h2 className="font-display font-bold text-neve text-sm uppercase tracking-wider">Atendimento</h2>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <a href={linkWhatsapp(MSG_PADRAO)} target="_blank" rel="noopener noreferrer"
                 className="hover:text-ouro">WhatsApp (81) 99808-0009</a>
            </li>
            <li><a href="/trocas" className="hover:text-ouro">Trocas e devoluções</a></li>
            <li><a href="/privacidade" className="hover:text-ouro">Privacidade (LGPD)</a></li>
          </ul>
        </div>
      </div>

      {/* Todas as categorias, inclusive as que nao cabem no cabecalho.
          Serve de navegacao no celular e de mapa do site para o Google. */}
      <div className="mx-auto max-w-6xl border-t border-tinta-700 px-4 py-8">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-neve">Categorias</h2>
        <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIAS.map(c => (
            <li key={c.slug}>
              <Link href={`/c/${c.slug}`} className="hover:text-ouro">{c.nome}</Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-tinta-700 px-4 py-5 text-center text-xs">
        <p>
          Suplementos alimentares não substituem uma alimentação equilibrada.
          Este produto não é medicamento e não possui finalidade terapêutica.
        </p>
      </div>
    </footer>
  );
}
