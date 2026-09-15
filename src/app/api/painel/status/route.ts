import { NextResponse } from 'next/server';
import { z } from 'zod';
import { souAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  pedido_id: z.string().uuid(),
  status: z.enum(['em_separacao', 'saiu_para_entrega', 'entregue', 'cancelado']),
});

// Transicoes permitidas. Um pedido nao pula de 'pago' direto para 'entregue',
// e nada volta de 'entregue'.
const PERMITIDO: Record<string, string[]> = {
  pago:              ['em_separacao', 'cancelado'],
  em_separacao:      ['saiu_para_entrega', 'cancelado'],
  saiu_para_entrega: ['entregue'],
};

export async function POST(req: Request) {
  const usuario = await souAdmin();
  if (!usuario) return NextResponse.json({ erro: 'sem permissão' }, { status: 403 });

  let bruto: unknown;
  try { bruto = await req.json(); } catch { return NextResponse.json({ erro: 'payload' }, { status: 400 }); }
  const p = schema.safeParse(bruto);
  if (!p.success) return NextResponse.json({ erro: 'dados inválidos' }, { status: 422 });

  const admin = supabaseAdmin();
  const { data: pedido } = await admin.from('pedido')
    .select('id,status').eq('id', p.data.pedido_id).maybeSingle();
  if (!pedido) return NextResponse.json({ erro: 'pedido não encontrado' }, { status: 404 });

  if (!(PERMITIDO[pedido.status] ?? []).includes(p.data.status))
    return NextResponse.json({ erro: `não dá para ir de ${pedido.status} para ${p.data.status}` }, { status: 409 });

  const { error } = await admin.from('pedido')
    .update({ status: p.data.status }).eq('id', p.data.pedido_id);
  if (error) return NextResponse.json({ erro: 'falha ao atualizar' }, { status: 500 });

  return NextResponse.json({ ok: true, status: p.data.status });
}
