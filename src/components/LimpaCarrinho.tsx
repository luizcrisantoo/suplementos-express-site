'use client';
import { useEffect } from 'react';

/** Pedido criado: o carrinho local ja cumpriu o papel. */
export default function LimpaCarrinho() {
  useEffect(() => { try { localStorage.removeItem('se_carrinho_v1'); } catch {} }, []);
  return null;
}
