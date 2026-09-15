import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cepSchema } from '@/lib/validacao';
import { supabaseAdmin } from '@/lib/supabase-server';
import { buscarCep, zonaDoBairro } from '@/lib/cep';
import { calcularFrete, promessaEntrega, type Zona } from '@/lib/frete';
import { identidade, permitido } from '@/lib/rate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corpoSchema = z.object({
  cep: cepSchema,
  subtotal_cents: z.number().int().min(0).max(10_000_00),
});

/** Rota publica: o navegador manda CEP e subtotal, recebe o frete calculado aqui. */
export async function POST(req: Request) {
  if (!(await permitido(`frete:${identidade(req)}`, 30, 60)))
    return NextResponse.json({ erro: 'Muitas consultas. Tente em instantes.' }, { status: 429 });

  let bruto: unknown;
  try { bruto = await req.json(); } catch { return NextResponse.json({ erro: 'Payload inválido' }, { status: 400 }); }

  const p = corpoSchema.safeParse(bruto);
  if (!p.success) return NextResponse.json({ erro: 'CEP inválido' }, { status: 422 });

  const endereco = await buscarCep(p.data.cep);
  if (!endereco) return NextResponse.json({ erro: 'CEP não encontrado' }, { status: 404 });

  const admin = supabaseAdmin();
  const { data: zonas } = await admin.from('zona').select('*').eq('ativa', true);
  const zona = zonaDoBairro((zonas ?? []) as Zona[], endereco.bairro, endereco.cidade);

  if (!zona) {
    return NextResponse.json({
      atende: false, endereco,
      mensagem: `Ainda não entregamos em ${endereco.bairro || endereco.cidade}. Estamos expandindo.`,
    });
  }

  const frete = calcularFrete(zona, p.data.subtotal_cents);
  if (!frete) return NextResponse.json({ atende: false, endereco, mensagem: 'Fora da área de entrega' });

  return NextResponse.json({
    atende: true, endereco,
    zona: { id: zona.id, codigo: zona.codigo, nome: zona.nome, corte_hora: zona.corte_hora },
    frete,
    entrega: promessaEntrega(zona),
  });
}
