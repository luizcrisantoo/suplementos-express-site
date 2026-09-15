# O que mudou nesta rodada

## 1. Hero menor
A primeira dobra agora mostra produto, não banner. A hero caiu de ~360px para
~230px no desktop e ganhou uma faixa de garantias (entrega hoje / frete grátis /
Pix ou cartão / 100% original) no lugar do espaço vazio.

## 2. Fotos padronizadas
As 756 fotos vinham da NE com proporções e margens diferentes (300x300, 300x405,
500x500, 800x800), então no grid um pote parecia o dobro do outro. Todas foram
recortadas, centralizadas num quadrado e ajustadas para o produto ocupar sempre
86% do quadro. Nenhum pixel foi ampliado: o quadrado é derivado do próprio
recorte. `public/produtos/` já está com as fotos novas.

## 3. Variações de sabor e tamanho
Antes, cada sabor era um produto solto: o Best Whey ocupava 18 cards seguidos na
categoria Proteína. Agora os SKUs da mesma linha são agrupados:

- as listagens (home, categoria) leem a view `vitrine`, uma linha por grupo
- o card mostra o nome limpo ("Best Whey"), o selo "18 opções" e "a partir de"
- a página do produto ganhou chips de **Tamanho** e **Sabor**

761 SKUs viraram **317 grupos**, sendo 165 com variação.

Cada variação continua sendo um SKU com URL própria, então trocar o sabor é uma
navegação de verdade (bom para SEO e para mandar link no WhatsApp).

## 4. WhatsApp
Botão flutuante em todas as páginas, link no rodapé e "Tirar uma dúvida no
WhatsApp" na página do produto, com o nome do produto já preenchido na mensagem.
Número: 5581998080009 (`src/lib/contato.ts`).

---

# O ÚNICO PASSO MANUAL

O site novo depende de três colunas e uma view que ainda não existem no banco.
No painel do Supabase → SQL Editor → cole e rode:

    supabase/migracao-01-variacoes.sql

Pode rodar mais de uma vez sem quebrar nada. No fim ele imprime uma conferência:

    produtos ativos        760
    grupos                 317
    grupos com variacao    165
    sem grupo              0
    custo exposto?         OK

Se "custo exposto?" vier FALHOU, me chama antes de subir.

**Rode a migração ANTES do deploy.** Se o site novo subir antes, as listagens
ficam vazias (a view `vitrine` ainda não existe).

Depois:

    git add -A
    git commit -m "Hero menor, fotos padronizadas, variacoes de sabor e tamanho"
    git push
