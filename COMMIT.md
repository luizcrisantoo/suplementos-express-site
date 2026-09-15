# Subir para o GitHub

## Antes de tudo: o repositorio precisa ser PRIVADO

O `supabase/seed.sql` e a pasta `dados/` contem o **custo que voce paga na NE**
para os 761 SKUs, alem da sua margem por produto e por combo.

Isso nao e vazamento de senha, e vazamento de negocio. Num repositorio publico,
qualquer concorrente (Macaco Blindado, VITA, outro revendedor da NE) le a sua
estrutura de custo inteira e sabe exatamente ate onde voce consegue baixar preco.

Em github.com/luizcrisantoo/suplementos-express-site > Settings > role ate o fim >
**Change repository visibility** > Private.

Repositorio privado nao atrapalha o deploy: a Netlify conecta em repo privado no
plano gratuito normalmente.

## Comandos

Na pasta `app`:

```powershell
cd "C:\Users\luizc\OneDrive\Área de Trabalho\suplementos-express\app"

git init
git branch -M main
git remote add origin https://github.com/luizcrisantoo/suplementos-express-site.git

# CONFERE antes de commitar: o .env.local NAO pode aparecer nesta lista
git add -A
git status --short | Select-String "env"

# se nao apareceu nada com "env" (fora .env.example), pode seguir:
git commit -m "Loja Suplementos Express: catalogo, checkout Pix e painel"
git push -u origin main
```

## O que NAO vai (esta no .gitignore)

- `.env.local` e qualquer `.env.*` (menos o `.env.example`, que so tem os nomes)
- `env-local-MODELO.txt`
- `node_modules/` e `.next/`
- `public/produtos-fotos.zip` (o zip; as 756 fotos soltas VAO, senao o site sobe sem imagem)
- `*.pem`, `*.key`, logs

## O que vai, e e grande

- `public/produtos/` com 756 fotos, 8.8 MB
- `supabase/seed.sql`, 528 KB

Soma uns 10 MB. GitHub aguenta tranquilo.

## Se o .env.local ja tiver sido commitado alguma vez

Apagar o arquivo num commit novo NAO resolve: ele fica no historico e qualquer um
com acesso ao repo consegue recuperar. Nesse caso o certo e **rodar as chaves**:

- Supabase: Project Settings > API Keys > rotacionar a Secret
- Mercado Pago: gerar novo Access Token

Rodar a chave e gratis e leva um minuto. Tentar limpar historico do git e demorado
e costuma deixar rastro.
