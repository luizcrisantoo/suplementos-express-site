import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServidor } from './supabase-server';

/**
 * Porta do painel. Duas camadas: esta checagem barra a navegacao, e as policies
 * `e_admin()` no banco barram a consulta. Se uma falhar, a outra segura.
 */
export async function exigirAdmin() {
  const sb = await supabaseServidor();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) redirect('/entrar?destino=/painel');

  const { data } = await sb.from('admin').select('id,nome').eq('id', auth.user.id).maybeSingle();
  if (!data) redirect('/');
  return { usuario: auth.user, admin: data };
}

export async function souAdmin() {
  const sb = await supabaseServidor();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from('admin').select('id').eq('id', auth.user.id).maybeSingle();
  return data ? auth.user : null;
}
