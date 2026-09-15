import { z } from 'zod';

/** Todo dado que entra pela rede passa por aqui antes de tocar o banco. */
export const cepSchema = z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
  .transform(s => s.replace('-', ''));

export const telefoneSchema = z.string().trim()
  .transform(s => s.replace(/\D/g, ''))
  .refine(s => s.length === 10 || s.length === 11, 'Telefone inválido');

export const itemSchema = z.object({
  produto_id: z.string().uuid(),
  qtd: z.number().int().min(1).max(50),
});

export const checkoutSchema = z.object({
  itens: z.array(itemSchema).min(1).max(40),
  endereco_id: z.string().uuid(),
  meio: z.enum(['pix', 'credito', 'debito']),
  // token do cartao gerado pelo SDK no navegador. O cartao nunca chega ao servidor.
  card_token: z.string().max(200).optional(),
  parcelas: z.number().int().min(1).max(6).optional(),
  idempotency_key: z.string().uuid(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
