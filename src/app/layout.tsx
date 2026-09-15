import type { Metadata, Viewport } from 'next';
import { Archivo, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import Cabecalho from '@/components/Cabecalho';
import Rodape from '@/components/Rodape';
import { CarrinhoProvider } from '@/components/CarrinhoProvider';
import GavetaCarrinho from '@/components/GavetaCarrinho';
import BotaoWhatsApp from '@/components/BotaoWhatsApp';

const display = Archivo({ subsets: ['latin'], weight: ['600','700','800'], variable: '--fonte-display', display: 'swap' });
const corpo = Source_Sans_3({ subsets: ['latin'], weight: ['400','600'], variable: '--fonte-corpo', display: 'swap' });

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suplementosexpress.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: 'Suplementos Express | Entrega de suplementos no mesmo dia em Recife',
    template: '%s | Suplementos Express',
  },
  description:
    'Whey, creatina, pré-treino e mais com entrega no mesmo dia em Recife, Olinda e Jaboatão. Pediu até 16h, recebe hoje. Frete grátis acima de R$ 149.',
  openGraph: { type: 'website', locale: 'pt_BR', siteName: 'Suplementos Express' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#141413', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${corpo.variable}`}>
      <body className="font-corpo antialiased">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-ouro focus:px-4 focus:py-2 focus:font-semibold">
          Pular para o conteúdo
        </a>
        <CarrinhoProvider>
          <Cabecalho />
          <main id="conteudo">{children}</main>
          <GavetaCarrinho />
          <Rodape />
          <BotaoWhatsApp />
        </CarrinhoProvider>
      </body>
    </html>
  );
}
