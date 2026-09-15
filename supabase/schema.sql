-- =====================================================================
-- Suplementos Express - schema
-- Postgres / Supabase. Seguranca por RLS, nao por if no codigo.
-- =====================================================================
begin;

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;   -- busca por similaridade no catalogo

-- ---------------------------------------------------------------- tipos
do $$ begin
  create type disponibilidade as enum ('pronta_entrega','sob_encomenda_24h','indisponivel');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_pedido as enum
    ('aguardando_pagamento','pago','em_separacao','saiu_para_entrega','entregue','cancelado','estornado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meio_pagamento as enum ('pix','credito','debito');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------- catalogo
create table if not exists zona (
  id                  smallserial primary key,
  codigo              text unique not null,
  nome                text not null,
  bairros             text[] not null default '{}',
  frete_cents         integer not null check (frete_cents >= 0),
  gratis_acima_cents  integer not null default 0 check (gratis_acima_cents >= 0),
  corte_hora          smallint not null default 16 check (corte_hora between 0 and 23),
  ativa               boolean not null default true
);

create table if not exists produto (
  id                      uuid primary key default uuid_generate_v4(),
  cod_forn                text unique not null,          -- id na NE, chave do sync
  sku                     text unique not null,
  slug                    text unique not null,
  nome                    text not null,
  marca                   text not null,
  categoria               text not null,
  familia                 text,
  peso                    text,
  volume                  text,
  capsulas                integer,
  formato                 text,
  sabor                   text,
  custo_ne_cents          integer not null check (custo_ne_cents >= 0),
  preco_referencia_cents  integer not null default 0 check (preco_referencia_cents >= 0),
  preco_venda_cents       integer generated always as (
                            greatest(
                              floor((preco_referencia_cents * 0.95) / 100)::int * 100 - 10,
                              round(custo_ne_cents * 1.12)::int
                            )
                          ) stored,
  descricao               text,
  beneficios              jsonb not null default '[]'::jsonb,
  modo_uso                text,
  nutricional             text,
  foto                    text,
  disponibilidade         disponibilidade not null default 'sob_encomenda_24h',
  ativo                   boolean not null default true,
  criado_em               timestamptz not null default now(),
  atualizado_em           timestamptz not null default now()
);

create index if not exists produto_categoria_idx on produto (categoria) where ativo;
create index if not exists produto_marca_idx     on produto (marca)     where ativo;
create index if not exists produto_busca_idx     on produto using gin (nome gin_trgm_ops);
create index if not exists produto_preco_idx     on produto (preco_venda_cents) where ativo;

create table if not exists combo (
  id                  uuid primary key default uuid_generate_v4(),
  cod_forn            text unique not null,
  slug                text unique not null,
  nome                text not null,
  descricao           text,
  custo_avista_cents  integer not null check (custo_avista_cents >= 0),
  custo_cartao_cents  integer not null check (custo_cartao_cents >= 0),
  referencia_cents    integer not null check (referencia_cents >= 0),
  preco_venda_cents   integer generated always as (
                        floor((referencia_cents * 0.95) / 100)::int * 100 - 10
                      ) stored,
  arte                text,
  validade            date,
  ativo               boolean not null default true,
  criado_em           timestamptz not null default now()
);

-- historico de custo: alimentado pelo sync diario da NE
create table if not exists custo_historico (
  id            bigserial primary key,
  cod_forn      text not null,
  custo_cents   integer not null,
  referencia_cents integer,
  fonte         text not null check (fonte in ('scraper','nfe','manual')),
  coletado_em   timestamptz not null default now()
);
create index if not exists custo_hist_idx on custo_historico (cod_forn, coletado_em desc);

-- fila de aprovacao: variacao de preco nao republica sozinha
create table if not exists preco_pendente (
  id             bigserial primary key,
  cod_forn       text not null references produto(cod_forn) on delete cascade,
  custo_atual    integer not null,
  custo_novo     integer not null,
  variacao_pct   numeric(6,2) not null,
  criado_em      timestamptz not null default now(),
  resolvido_em   timestamptz,
  aprovado       boolean
);

-- ------------------------------------------------------------- clientes
create table if not exists cliente (
  id          uuid primary key references auth.users(id) on delete cascade,
  telefone    text unique,
  nome        text,
  email       text,
  criado_em   timestamptz not null default now()
);

create table if not exists endereco (
  id           uuid primary key default uuid_generate_v4(),
  cliente_id   uuid not null references cliente(id) on delete cascade,
  cep          text not null check (cep ~ '^[0-9]{8}$'),
  rua          text not null,
  numero       text not null,
  complemento  text,
  bairro       text not null,
  cidade       text not null default 'Recife',
  referencia   text,
  zona_id      smallint references zona(id),
  criado_em    timestamptz not null default now()
);
create index if not exists endereco_cliente_idx on endereco (cliente_id);

-- -------------------------------------------------------------- pedidos
create table if not exists pedido (
  id                uuid primary key default uuid_generate_v4(),
  numero            bigserial unique,
  cliente_id        uuid not null references cliente(id) on delete restrict,
  endereco_id       uuid not null references endereco(id) on delete restrict,
  zona_id           smallint not null references zona(id),
  status            status_pedido not null default 'aguardando_pagamento',
  subtotal_cents    integer not null check (subtotal_cents >= 0),
  frete_cents       integer not null check (frete_cents >= 0),
  desconto_cents    integer not null default 0 check (desconto_cents >= 0),
  total_cents       integer not null check (total_cents >= 0),
  custo_cents       integer not null default 0,
  margem_cents      integer not null default 0,
  meio_pagamento    meio_pagamento,
  mp_payment_id     text unique,
  idempotency_key   text unique,
  entrega_prevista  timestamptz,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  constraint total_confere check (total_cents = subtotal_cents + frete_cents - desconto_cents)
);
create index if not exists pedido_cliente_idx on pedido (cliente_id, criado_em desc);
create index if not exists pedido_status_idx  on pedido (status, criado_em desc);

create table if not exists pedido_item (
  id           bigserial primary key,
  pedido_id    uuid not null references pedido(id) on delete cascade,
  produto_id   uuid references produto(id) on delete restrict,
  combo_id     uuid references combo(id) on delete restrict,
  nome         text not null,           -- congelado no momento da compra
  qtd          smallint not null check (qtd > 0 and qtd <= 50),
  preco_cents  integer not null check (preco_cents >= 0),
  custo_cents  integer not null default 0,
  constraint item_tem_origem check (num_nonnulls(produto_id, combo_id) = 1)
);
create index if not exists pedido_item_idx on pedido_item (pedido_id);

-- log de webhook: idempotencia de pagamento
create table if not exists webhook_log (
  id           bigserial primary key,
  provedor     text not null,
  evento_id    text not null,
  payload      jsonb,
  recebido_em  timestamptz not null default now(),
  unique (provedor, evento_id)
);

-- ===================================================================
-- RLS: o banco nega por padrao. Nenhum if de aplicacao substitui isso.
-- ===================================================================
alter table produto          enable row level security;
alter table combo            enable row level security;
alter table zona             enable row level security;
alter table cliente          enable row level security;
alter table endereco         enable row level security;
alter table pedido           enable row level security;
alter table pedido_item      enable row level security;
alter table custo_historico  enable row level security;
alter table preco_pendente   enable row level security;
alter table webhook_log      enable row level security;

-- catalogo: leitura publica apenas do que esta ativo.
-- custo_ne_cents fica exposto na tabela, entao a API publica usa a view abaixo.
drop policy if exists produto_leitura on produto;
create policy produto_leitura on produto for select using (ativo = true);

drop policy if exists combo_leitura on combo;
create policy combo_leitura on combo for select using (ativo = true and (validade is null or validade >= current_date));

drop policy if exists zona_leitura on zona;
create policy zona_leitura on zona for select using (ativa = true);

-- cliente enxerga apenas a si mesmo
drop policy if exists cliente_proprio on cliente;
create policy cliente_proprio on cliente for all
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists endereco_proprio on endereco;
create policy endereco_proprio on endereco for all
  using (cliente_id = auth.uid()) with check (cliente_id = auth.uid());

-- pedido: le o proprio, nunca altera. Status so muda pelo service role (webhook).
drop policy if exists pedido_proprio_leitura on pedido;
create policy pedido_proprio_leitura on pedido for select using (cliente_id = auth.uid());

drop policy if exists item_proprio_leitura on pedido_item;
create policy item_proprio_leitura on pedido_item for select
  using (exists (select 1 from pedido p where p.id = pedido_id and p.cliente_id = auth.uid()));

-- custo, margem e fila de preco: sem policy = ninguem le pelo anon.
-- Apenas o service role (que ignora RLS) enxerga. Nao crie policy aqui.

-- view publica do catalogo: nao expoe custo nem margem
create or replace view produto_publico as
select id, slug, sku, nome, marca, categoria, familia, peso, volume, capsulas,
       formato, sabor, preco_venda_cents, preco_referencia_cents,
       descricao, beneficios, modo_uso, nutricional, foto, disponibilidade
from produto where ativo;

-- ------------------------------------------------------- gatilhos
create or replace function toca_atualizado_em() returns trigger
language plpgsql as $$
begin new.atualizado_em = now(); return new; end $$;

drop trigger if exists produto_touch on produto;
create trigger produto_touch before update on produto
  for each row execute function toca_atualizado_em();

drop trigger if exists pedido_touch on pedido;
create trigger pedido_touch before update on pedido
  for each row execute function toca_atualizado_em();

commit;

-- =====================================================================
-- Sprint 3: checkout e pagamento
-- =====================================================================
begin;

-- todo usuario que se cadastra ganha a linha de cliente automaticamente
create or replace function cria_cliente() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.cliente (id, telefone, email)
  values (new.id, new.phone, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function cria_cliente();

-- dados do pagamento que o front precisa mostrar (QR do Pix, link)
alter table pedido add column if not exists pix_qr           text;
alter table pedido add column if not exists pix_copia_cola   text;
alter table pedido add column if not exists pix_expira_em    timestamptz;
alter table pedido add column if not exists parcelas         smallint;

-- rate limit simples e honesto: contador por chave e janela, no proprio banco.
-- Memoria de instancia nao serve em serverless, cada lambda tem a sua.
create table if not exists rate_limit (
  chave      text not null,
  janela     timestamptz not null,
  acessos    integer not null default 1,
  primary key (chave, janela)
);
alter table rate_limit enable row level security;  -- sem policy: so service role

create or replace function consome_rate_limit(p_chave text, p_limite int, p_janela_seg int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  ini timestamptz := to_timestamp(floor(extract(epoch from now()) / p_janela_seg) * p_janela_seg);
  n   integer;
begin
  insert into rate_limit (chave, janela) values (p_chave, ini)
  on conflict (chave, janela) do update set acessos = rate_limit.acessos + 1
  returning acessos into n;
  delete from rate_limit where janela < now() - interval '1 hour';
  return n <= p_limite;
end $$;

commit;

-- =====================================================================
-- Sprint 4: painel do dono, e um conserto de seguranca do catalogo
-- =====================================================================
begin;

-- CORRECAO IMPORTANTE
-- A policy `produto_leitura` liberava SELECT na tabela inteira, e RLS filtra
-- linha, nao coluna. Ou seja: a anon key conseguia ler custo_ne_cents.
-- Conserto: a tabela sai do alcance de anon/authenticated e o catalogo publico
-- passa a sair so pela view, que nao tem as colunas de custo.
revoke all on produto from anon, authenticated;
revoke all on combo   from anon, authenticated;

drop view if exists produto_publico;
create view produto_publico as       -- security definer: roda como dona da view
select id, slug, sku, nome, marca, categoria, familia, peso, volume, capsulas,
       formato, sabor, preco_venda_cents, preco_referencia_cents,
       descricao, beneficios, modo_uso, nutricional, foto, disponibilidade
from produto where ativo;

create or replace view combo_publico as
select id, slug, nome, descricao, preco_venda_cents, referencia_cents, arte, validade
from combo where ativo and (validade is null or validade >= current_date);

grant select on produto_publico, combo_publico to anon, authenticated;

-- ------------------------------------------------------------- admin
create table if not exists admin (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text,
  criado_em  timestamptz not null default now()
);
alter table admin enable row level security;

drop policy if exists admin_se_ve on admin;
create policy admin_se_ve on admin for select using (id = auth.uid());

create or replace function e_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin where id = auth.uid());
$$;

-- o dono enxerga tudo; o cliente segue vendo so o proprio
drop policy if exists pedido_admin on pedido;
create policy pedido_admin on pedido for select using (e_admin());

drop policy if exists pedido_admin_edita on pedido;
create policy pedido_admin_edita on pedido for update using (e_admin()) with check (e_admin());

drop policy if exists item_admin on pedido_item;
create policy item_admin on pedido_item for select using (e_admin());

drop policy if exists endereco_admin on endereco;
create policy endereco_admin on endereco for select using (e_admin());

drop policy if exists cliente_admin on cliente;
create policy cliente_admin on cliente for select using (e_admin());

-- ------------------------------------------- o que comprar na NE hoje
-- Agrupa os itens dos pedidos pagos e ainda nao entregues, por produto.
create or replace view compra_do_dia as
select
  p.cod_forn,
  p.nome,
  p.marca,
  p.categoria,
  sum(i.qtd)::int                      as unidades,
  p.custo_ne_cents                     as custo_unit_cents,
  (sum(i.qtd) * p.custo_ne_cents)::int as custo_total_cents,
  array_agg(distinct ped.numero order by ped.numero) as pedidos
from pedido_item i
join pedido  ped on ped.id = i.pedido_id
join produto p   on p.id  = i.produto_id
where ped.status in ('pago','em_separacao')
group by p.cod_forn, p.nome, p.marca, p.categoria, p.custo_ne_cents
order by sum(i.qtd) desc;

-- ------------------------------------------------- roteiro de entrega
create or replace view rota_do_dia as
select
  z.codigo       as zona,
  z.nome         as zona_nome,
  ped.numero,
  ped.status,
  ped.total_cents,
  ped.margem_cents,
  c.nome         as cliente,
  c.telefone,
  e.rua, e.numero as num, e.complemento, e.bairro, e.referencia,
  ped.criado_em
from pedido ped
join zona     z on z.id = ped.zona_id
join endereco e on e.id = ped.endereco_id
join cliente  c on c.id = ped.cliente_id
where ped.status in ('pago','em_separacao','saiu_para_entrega')
order by z.codigo, ped.criado_em;

commit;
