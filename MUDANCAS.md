# Rodada 4: as categorias que sumiam

## O problema

O catálogo tem **20 categorias**. O cabeçalho linkava **7**. As outras 13
existiam, respondiam na URL e tinham produto dentro, mas nenhuma página do site
apontava para elas. Só dava para chegar pela busca ou digitando o endereço.

Eram 217 SKUs / 119 grupos escondidos:

    pastas-e-cremes       28 SKUs    endurance             27
    bebidas-energeticos   25         aminoacidos           23
    molhos-e-caldas       20         carboidrato           16
    colageno              14         enzima-saude          10
    omega-oleos            7         sono-imunidade         2
    vasodilatador          2         natural                1
    precursor              1

Pior: no celular a faixa de categorias era `hidden lg:block`. Ou seja, **no
celular não existia navegação por categoria nenhuma**, nem as 7.

A causa de fundo era a lista de categorias estar duplicada em três lugares que
discordavam entre si: o cabeçalho conhecia 7, a página `/c` conhecia 20, e o
rodapé nenhuma.

## O que mudou

**Uma lista só** (`src/lib/categorias.ts`), consumida pelo cabeçalho, pela
página de categoria, pelo rodapé e pela home. Ordenada por tamanho de catálogo.

**Cabeçalho**: 8 categorias em destaque mais "Todas as categorias" em dourado.
No celular a faixa rola na horizontal em vez de sumir, com um degradê na borda
mostrando que tem mais para o lado.

**Página nova `/categorias`**: as 20, com a contagem de produtos de cada uma
vinda do banco (não é número escrito na mão, então não desatualiza). Categoria
que ficar sem produto some da lista em vez de virar link morto.

**Rodapé**: as 20 categorias, em duas colunas no celular. Serve de navegação e
de mapa do site para o Google.

**Home**: faixa de atalhos logo abaixo da hero, e as prateleiras passaram de 3
para 6 (proteína, snacks, pré-treino, creatina, vitaminas, hipercalórico), mais
um botão "Ver as 20 categorias" no fim.

Também troquei os "Ver o catálogo" que jogavam direto em `/c/proteina` (carrinho
vazio, gaveta, busca sem resultado) para `/categorias`.

Conferi por script que os 20 slugs do código batem exatamente com os 20 que
existem no banco, nos dois sentidos.

---

# O QUE VOCÊ PRECISA FAZER

Nada no banco desta vez. Só subir:

    cd "$env:USERPROFILE\OneDrive\Área de Trabalho\suplementos-express\app"
    npm run build
    git add -A
    git commit -m "Expoe as 20 categorias e devolve a navegacao no celular"
    git push

---

# Ainda parado

Checkout continua sem receber pedido: login por SMS (Twilio) e Mercado Pago
seguem sem configuração.
