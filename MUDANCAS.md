# Rodada 3: conserto do frete fora de área + relevância da busca

## 1. BUG: CEP fora da área derrubava a rota (500)

Testando a `/api/frete` em produção com CEPs reais:

    51020-000 (Boa Viagem)   -> 200, "Chega hoje", frete grátis acima de R$ 149  OK
    00000-000 (inexistente)  -> 404, "CEP não encontrado"                        OK
    55002-000 (Caruaru)      -> 500, corpo vazio                                 QUEBRADO
    01310-100 (São Paulo)    -> 500, corpo vazio                                 QUEBRADO

Causa: no seed original a zona Z4 ("fora de área") foi criada com
`array[NULL]::text[]`. No Postgres isso é um array **com um elemento nulo**
(`{NULL}`), não um array vazio (`{}`). No servidor chegava como `[null]`, e a
comparação de bairro estourava TypeError.

Boa Viagem funcionava porque casava na Z1 e a função retornava antes de chegar
na Z4. Qualquer bairro que **não** casasse com Z1, Z2 ou Z3 percorria a lista
inteira, batia no `null` e derrubava a resposta.

Isso não afetava só o campo novo de CEP no produto: a mesma rota é usada pela
calculadora do **carrinho** e pelo formulário de **checkout**. Ou seja, um
cliente de bairro ainda não coberto tomava erro genérico em vez de
"ainda não entregamos aí, estamos expandindo".

Consertado nos dois lados:

- **dado**: `migracao-03-correcoes.sql` troca o `{NULL}` por `{}` e remove
  qualquer NULL solto de qualquer zona
- **código**: `src/lib/cep.ts` passa a ignorar NULL na lista de bairros, então
  não quebra de novo se entrar outro

Cobri com teste os 8 casos (dentro de zona, com acento, cidade inteira na Z3,
fora de área, campos vazios). Todos passam.

## 2. Relevância da busca

Procurar "whey chocolate" trazia 28 resultados certos, mas na ordem errada: em
primeiro vinha o creme de avelã mais barato da loja, porque o desempate era só
preço. Agora a ordem é:

1. termo inteiro no nome da linha (igual > começa com > contém)
2. quantas palavras do termo aparecem no nome da linha
3. quantas aparecem na marca
4. linha com mais variações primeiro (Best Whey, com 18 sabores, ganha de um
   item avulso qualquer)
5. mais barato primeiro

---

# O QUE VOCÊ PRECISA FAZER

    cd "$env:USERPROFILE\OneDrive\Área de Trabalho\suplementos-express\app"
    Get-Content .\supabase\migracao-03-correcoes.sql -Raw | Set-Clipboard

Cola no SQL Editor do Supabase e roda. Tem que listar as 4 zonas com
`situacao = OK`, e a Z4 com `qtd_bairros = 0`.

Depois:

    npm run build
    git add -A
    git commit -m "Corrige 500 em CEP fora de area e melhora a ordem da busca"
    git push

Essa migração pode rodar antes ou depois do deploy: o código novo já aguenta o
dado velho.

---

# Ainda parado

Checkout continua sem receber pedido: login por SMS (Twilio) e Mercado Pago
seguem sem configuração.
