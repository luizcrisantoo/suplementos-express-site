import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseServidor } from '@/lib/supabase-server';
import FormCheckout from '@/components/FormCheckout';

export const metadata: Metadata = { title: 'Pagamento', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Checkout() {
  const sb = await supabaseServidor();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) redirect('/entrar?destino=/checkout');

  const { data: enderecos } = await sb.from('endereco')
    .select('id,cep,rua,numero,complemento,bairro,cidade,zona_id')
    .order('criado_em', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold">Finalizar pedido</h1>
      <FormCheckout enderecos={enderecos ?? []} />
    </div>
  );
}
