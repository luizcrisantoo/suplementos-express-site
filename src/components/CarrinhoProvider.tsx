'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Linha = { id: string; slug: string; nome: string; preco_cents: number; foto: string | null; qtd: number };
type Ctx = {
  linhas: Linha[]; quantidade: number; subtotal_cents: number;
  adicionar: (l: Omit<Linha, 'qtd'>, qtd?: number) => void;
  remover: (id: string) => void; mudarQtd: (id: string, qtd: number) => void;
  aberto: boolean; abrir: () => void; fechar: () => void;
};
const C = createContext<Ctx | null>(null);
const CHAVE = 'se_carrinho_v1';

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [aberto, setAberto] = useState(false);

  // O carrinho guarda id e qtd. O preco aqui e so vitrine:
  // o servidor recalcula tudo no checkout a partir do banco.
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) setLinhas(JSON.parse(bruto));
    } catch { /* modo privado ou storage bloqueado */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CHAVE, JSON.stringify(linhas)); } catch {}
  }, [linhas]);

  const valor = useMemo<Ctx>(() => ({
    linhas,
    quantidade: linhas.reduce((s, l) => s + l.qtd, 0),
    subtotal_cents: linhas.reduce((s, l) => s + l.preco_cents * l.qtd, 0),
    adicionar: (l, qtd = 1) => setLinhas(a => {
      const i = a.findIndex(x => x.id === l.id);
      if (i >= 0) { const c = [...a]; c[i] = { ...c[i]!, qtd: Math.min(50, c[i]!.qtd + qtd) }; return c; }
      return [...a, { ...l, qtd }];
    }),
    remover: id => setLinhas(a => a.filter(x => x.id !== id)),
    mudarQtd: (id, qtd) => setLinhas(a =>
      qtd <= 0 ? a.filter(x => x.id !== id) : a.map(x => x.id === id ? { ...x, qtd: Math.min(50, qtd) } : x)),
    aberto, abrir: () => setAberto(true), fechar: () => setAberto(false),
  }), [linhas, aberto]);

  return <C.Provider value={valor}>{children}</C.Provider>;
}

export const useCarrinho = () => {
  const c = useContext(C);
  if (!c) throw new Error('useCarrinho fora do CarrinhoProvider');
  return c;
};
