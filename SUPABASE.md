# Configurar o Supabase

Ordem importa. Cada passo depende do anterior.

## 1. Criar o projeto

supabase.com → New project. Região **South America (São Paulo)**: o banco fica a
milissegundos do seu cliente em Recife, e não do outro lado do mundo.
Guarde a senha do Postgres que ele pede.

## 2. Rodar o SQL

SQL Editor → New query. Cole e rode nesta ordem:

| Arquivo | O que faz | Reexecutável? |
|---|---|---|
| `supabase/schema.sql` | Tabelas, índices, RLS, views, funções, gatilhos | Sim, é idempotente |
| `supabase/seed.sql` | 761 produtos, 24 combos e 4 zonas | Sim, tem `on conflict do nothing` |

O `schema.sql` cresceu: hoje ele tem catálogo, checkout, rate limit e painel.
Pode colar inteiro de novo sempre que eu mandar uma versão nova.

## 3. Pegar as chaves

Project Settings → API. Vão para o `.env.local`:

| Campo no painel | Variável | Onde vive |
|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | navegador e servidor |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | navegador e servidor |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` | **só servidor** |

A service_role ignora RLS por completo. Ela não pode ter prefixo `NEXT_PUBLIC_`,
não vai para o repositório e não aparece em nenhum componente de cliente.

## 4. Ligar o login por SMS

Authentication → Providers → **Phone** → habilitar, e escolher o provedor
(Twilio, MessageBird ou Vonage). Precisa de conta no provedor e crédito: cada SMS
é cobrado. Sem isso o código do login não chega e ninguém finaliza pedido.

Em Authentication → URL Configuration, coloque a URL do site em Site URL.

## 5. Virar admin

O painel em `/painel` só abre para quem está na tabela `admin`.
Faça login normal pelo site com o seu número, depois rode no SQL Editor:

```sql
insert into admin (id, nome)
select id, 'Luiz' from auth.users where phone = '5581SEUNUMERO';
```

Confira com `select * from admin;`. Se voltar vazio, o telefone no `auth.users`
está em outro formato: rode `select id, phone from auth.users;` e use o valor exato.

## 6. Mercado Pago

Painel do MP → Suas integrações → credenciais de **produção**:

- `MERCADOPAGO_ACCESS_TOKEN` (servidor)
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (navegador, para tokenizar o cartão depois)
- `MERCADOPAGO_WEBHOOK_SECRET` (a chave secreta da configuração de webhooks)

Em Webhooks, aponte para `https://SEUDOMINIO/api/webhook/mercadopago` e marque o
evento **Pagamentos**. O MP não alcança `localhost`: para testar Pix na sua máquina
use um túnel, ou suba na Vercel antes.

## 7. Conferir que o custo não vaza

Depois de rodar o schema, teste com a anon key:

```sql
-- deve dar erro de permissão
select custo_ne_cents from produto limit 1;
-- deve funcionar e não ter coluna de custo
select * from produto_publico limit 1;
```

A tabela `produto` saiu do alcance de `anon` e `authenticated` de propósito.
O catálogo público sai só pela view, que não tem custo nem margem.
