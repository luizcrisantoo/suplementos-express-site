-- =====================================================================
-- Conferencia pos-instalacao. Cole inteiro no SQL Editor e rode.
-- Tudo tem que voltar OK. Qualquer FALHA esta explicada na coluna detalhe.
-- =====================================================================
with checagens as (

  select 1 as ord, 'Produtos no catalogo' as item,
    case when count(*) = 761 then 'OK' else 'FALHA' end as res,
    count(*) || ' de 761 (se deu menos, o seed.sql parou no meio)' as detalhe
  from produto

  union all
  select 2, 'Combos da campanha',
    case when count(*) = 24 then 'OK' else 'FALHA' end,
    count(*) || ' de 24'
  from combo

  union all
  select 3, 'Zonas de entrega',
    case when count(*) = 4 then 'OK' else 'FALHA' end,
    count(*) || ' de 4'
  from zona

  union all
  select 4, 'Preco de venda calculado',
    case when count(*) filter (where preco_venda_cents > 0) = count(*) then 'OK' else 'FALHA' end,
    'exemplo: ' || coalesce(max(nome || ' = R$ ' || (preco_venda_cents/100.0)::numeric(10,2)), 'nenhum')
  from (select nome, preco_venda_cents from produto where categoria = 'creatina' limit 1) t

  union all
  select 5, 'Custo NAO visivel pela chave publica',
    case when not has_table_privilege('anon','produto','select') then 'OK' else 'FALHA' end,
    case when has_table_privilege('anon','produto','select')
         then 'PERIGO: anon le a tabela produto e enxerga custo_ne_cents. Rode o schema.sql de novo.'
         else 'anon nao alcanca a tabela produto' end

  union all
  select 6, 'Catalogo publico pela view',
    case when has_table_privilege('anon','produto_publico','select') then 'OK' else 'FALHA' end,
    'anon le produto_publico (sem coluna de custo)'

  union all
  select 7, 'RLS ligado nas tabelas sensiveis',
    case when count(*) filter (where not rowsecurity) = 0 then 'OK' else 'FALHA' end,
    coalesce(string_agg(tablename, ', ') filter (where not rowsecurity), 'todas protegidas')
  from pg_tables
  where schemaname = 'public'
    and tablename in ('produto','combo','zona','cliente','endereco','pedido','pedido_item',
                      'custo_historico','preco_pendente','webhook_log','rate_limit','admin')

  union all
  select 8, 'Funcoes do checkout e do painel',
    case when count(*) = 3 then 'OK' else 'FALHA' end,
    'encontradas: ' || coalesce(string_agg(proname, ', '), 'nenhuma')
  from pg_proc where proname in ('e_admin','consome_rate_limit','cria_cliente')

  union all
  select 9, 'Gatilho que cria o cliente no cadastro',
    case when count(*) = 1 then 'OK' else 'FALHA' end,
    case when count(*) = 1 then 'ativo em auth.users'
         else 'ausente: ninguem consegue finalizar pedido' end
  from pg_trigger where tgname = 'ao_criar_usuario'

  union all
  select 10, 'Views do painel',
    case when count(*) = 4 then 'OK' else 'FALHA' end,
    'encontradas: ' || coalesce(string_agg(viewname, ', '), 'nenhuma')
  from pg_views where schemaname = 'public'
    and viewname in ('produto_publico','combo_publico','compra_do_dia','rota_do_dia')

  union all
  select 11, 'Voce ja e admin',
    case when count(*) > 0 then 'OK' else 'PENDENTE' end,
    case when count(*) > 0 then count(*) || ' admin cadastrado'
         else 'normal agora: faca login no site primeiro, depois rode o insert do SUPABASE.md' end
  from admin
)
select ord as "#", item, res as "situacao", detalhe from checagens order by ord;
