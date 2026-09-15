import 'server-only';
import { supabaseAdmin } from './supabase-server';

/** Identificador de quem chamou. Atras da Vercel, o IP real vem no x-forwarded-for. */
export function identidade(req: Request) {
  const xf = req.headers.get('x-forwarded-for') ?? '';
  return (xf.split(',')[0] ?? '').trim() || req.headers.get('x-real-ip') || 'desconhecido';
}

/** true = pode seguir. Contador fica no banco: cada lambda tem a propria memoria. */
export async function permitido(chave: string, limite: number, janelaSeg: number) {
  try {
    const { data, error } = await supabaseAdmin()
      .rpc('consome_rate_limit', { p_chave: chave, p_limite: limite, p_janela_seg: janelaSeg });
    if (error) return true;            // falha do limitador nao derruba a loja
    return data === true;
  } catch { return true; }
}
