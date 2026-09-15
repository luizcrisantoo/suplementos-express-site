# Suplementos Express

Loja de suplementos com entrega no mesmo dia na Região Metropolitana do Recife.
Next.js 15 (App Router) + Supabase + Mercado Pago.

## Rodar local

```bash
npm install
cp .env.example .env.local     # preencha as chaves
npm run dev
```

## Subir o banco

No SQL Editor do Supabase, nesta ordem:

1. `supabase/schema.sql` — tabelas, índices, RLS e políticas
2. `supabase/seed.sql`   — 761 produtos, 24 combos e 4 zonas de entrega

As fotos já estão em `public/produtos/<cod_forn>.webp`, mesmo código que a coluna
`produto.cod_forn`. O seed referencia o arquivo pelo nome, sem upload manual.

## Decisões de segurança

**O cartão nunca toca o servidor.** O SDK do Mercado Pago tokeniza no navegador
e o backend recebe só o token. Isso mantém a operação fora do escopo pesado do PCI-DSS.

**O preço nunca vem do navegador.** `/api/checkout` recebe apenas `{produto_id, qtd}`
e recalcula preço, frete e total a partir do banco. Quem adulterar o payload não muda
nada: veja `src/app/api/checkout/route.ts`.

**RLS ligado em todas as tabelas.** Cliente só enxerga os próprios pedidos por política
do banco, não por `if`. Custo e margem não têm policy alguma: só o service role lê.
O catálogo público sai pela view `produto_publico`, que não expõe custo.

**Webhook verificado.** Assinatura HMAC conferida com `timingSafeEqual` antes de
qualquer processamento; `webhook_log` garante idempotência contra replay; o status
vem de uma consulta à API do MP, nunca do corpo recebido; valor pago é conferido
contra o total do pedido.

**Cabeçalhos.** CSP restritiva, HSTS, `X-Content-Type-Options`, `frame-ancestors none`
e `Permissions-Policy` em `next.config.mjs`.

## Regra de frete

`src/lib/frete.ts`. Zona sai do CEP, valor sai da tabela `zona`, e endereço fora de
área não finaliza pedido. A promessa de entrega usa o horário de corte da zona no
fuso de Recife.

## Estrutura

```
src/lib/          regras de negócio, tudo server-only
src/components/   UI, client components marcados com 'use client'
src/app/api/      rotas de servidor (checkout, webhook)
supabase/         schema.sql e seed.sql
```

## Checkout (Sprint 3)

Fluxo: carrinho → CEP vira zona → login por SMS → endereço → Pix → página do pedido.

**CEP vira zona no servidor.** `/api/frete` consulta o ViaCEP, cruza o bairro com
`zona.bairros` e devolve o frete já calculado. O navegador nunca manda valor de frete.

**Login por telefone.** OTP por SMS via Supabase Auth. Exige um provedor de SMS
configurado no painel do Supabase (Auth → Providers → Phone). Sem isso, o código
não chega. Um trigger em `auth.users` cria a linha de `cliente` no cadastro.

**Pix funcionando ponta a ponta.** `/api/checkout` cria o pedido, chama o Mercado
Pago, guarda o QR e o copia-e-cola. A página do pedido mostra o QR com contador de
expiração e se atualiza sozinha até o webhook confirmar.

**Cartão: falta a última milha.** A rota já aceita `card_token` e monta o pagamento.
O que falta é montar o formulário do SDK do MP na tela de checkout, que é o que
tokeniza o cartão no navegador. Até lá a opção fica desabilitada na interface.

**Rate limit no banco.** `consome_rate_limit` conta acessos por chave e janela em
Postgres. Memória de instância não serve em serverless: cada lambda tem a sua.

## O que ainda falta

- Formulário de cartão do SDK do Mercado Pago na tela de checkout
- Sprint 4: painel do dono (pedidos do dia, lista de compra na NE, roteiro por zona)
- Sprint 5: analytics de funil, recuperação de carrinho, histórico do cliente
- Sync diário de preço da NE com fila de aprovação (`preco_pendente`)
- Aviso de pedido por WhatsApp
