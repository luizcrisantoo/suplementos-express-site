# Rodada 2: busca e prazo de entrega no produto

## 1. Busca no cabeçalho
Campo de busca no topo de todas as páginas. É um `<form>` GET de verdade, então
funciona sem JavaScript e o resultado tem URL própria (`/busca?q=whey`), dá para
mandar link no WhatsApp.

- **sem acento**: "proteina" acha "proteína", e vice-versa
- **várias palavras**: "whey chocolate" só traz quem tem as duas coisas
- **acha pelo sabor do irmão**: procurar "chocolate" traz a linha Best Whey
  inteira, porque a busca olha o texto de todos os SKUs do grupo
- **acha por marca, categoria e tamanho** também
- quando não acha nada, oferece perguntar no WhatsApp com o termo já na mensagem

O cabeçalho foi reorganizado: logo, busca e carrinho na primeira linha, e as
categorias passaram para uma faixa própria embaixo. No celular a busca desce
para a segunda linha, em largura cheia.

## 2. "Chega hoje?" na página do produto
Antes o cliente só descobria o frete depois de montar o carrinho inteiro. Agora
tem um campo de CEP na própria página do produto, mostrando o prazo, o bairro e
quanto falta para o frete sair de graça.

O CEP fica lembrado por 12h no navegador dele, então a partir do segundo produto
a resposta já aparece pronta, sem nova consulta.

---

# O QUE VOCÊ PRECISA FAZER

## Passo 1 - migração do banco

A busca depende de uma coluna nova (`busca`) e de uma versão nova da view
`vitrine`. Copia o SQL:

    cd "$env:USERPROFILE\OneDrive\Área de Trabalho\suplementos-express\app"
    Get-Content .\supabase\migracao-02-busca.sql -Raw | Set-Clipboard

Cola no SQL Editor do Supabase e roda. No fim ele imprime:

    sem texto de busca     0
    acha "proteina"        (um número > 100)
    acha "creatina"        (um número > 10)
    acha "chocolate"       (um número > 40)
    custo exposto?         OK

Se "sem texto de busca" vier diferente de 0, ou "custo exposto?" vier FALHOU,
me chama antes de subir.

**Roda a migração ANTES do deploy.** Se o código novo subir primeiro, toda busca
dá erro, porque a coluna `busca` ainda não existe na view.

## Passo 2 - subir

    npm run build
    git add -A
    git commit -m "Busca no cabecalho e consulta de entrega na pagina do produto"
    git push

---

# Ainda parado

O checkout continua sem conseguir receber pedido: exige login por SMS (Twilio
não configurado) e o Mercado Pago não tem credencial no ambiente. Enquanto isso
não for resolvido, quem quiser comprar tem que cair no WhatsApp.
