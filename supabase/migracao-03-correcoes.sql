-- =====================================================================
-- Migracao 03 - conserto da zona "fora de area"
-- Rodar no SQL Editor do Supabase. Idempotente.
--
-- Bug: no seed original a Z4 foi criada com  array[NULL]::text[],  que no
-- Postgres e um array COM UM ELEMENTO NULO ({NULL}), nao um array vazio ({}).
-- No servidor isso chegava como [null], e a comparacao de bairro estourava
-- TypeError. Efeito pratico: qualquer CEP valido FORA de Z1/Z2/Z3 (Caruaru,
-- Sao Paulo, um bairro do Recife ainda nao coberto) devolvia HTTP 500 em vez
-- da mensagem "ainda nao entregamos ai".
--
-- O codigo tambem foi blindado (src/lib/cep.ts ignora NULL na lista), mas o
-- dado errado precisa sair do banco do mesmo jeito.
-- =====================================================================
begin;

update zona
   set bairros = '{}'::text[]
 where bairros is not null
   and array_position(bairros, null) is not null;

-- garante que nenhuma zona fique com NULL solto na lista
update zona
   set bairros = coalesce(array_remove(bairros, null), '{}'::text[])
 where bairros is null or array_position(bairros, null) is not null;

commit;

-- ---------------------------------------------------------------------
-- conferencia: as 4 zonas, com a contagem de bairros e se sobrou NULL
-- ---------------------------------------------------------------------
select codigo,
       nome,
       cardinality(bairros)                                  as qtd_bairros,
       case when array_position(bairros, null) is null
            then 'OK' else 'AINDA TEM NULL' end              as situacao
from zona
order by codigo;
