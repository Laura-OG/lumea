# Lumea — site institucional

Site de uma página da Lumea, estúdio de sites sob medida da Laura e do Max.
HTML, CSS e JavaScript puros: sem dependências, sem build.

## Estrutura

```
index.html              página (hero, serviços, portfólio, como funciona, sobre, contato)
assets/css/style.css    estilos (cores e espaçamentos em variáveis no topo)
assets/js/main.js       interações (parallax, foto revelada no hero, cursor brilhante, formulário)
assets/img/             imagens
```

## Rodar localmente

Abra o `index.html` no navegador, ou sirva a pasta:

```bash
npx serve .
```

## Publicar

- **Vercel:** importe o repositório em vercel.com → New Project. Não precisa configurar nada.
- **GitHub Pages:** Settings → Pages → Deploy from a branch → `main` / root.

## O que falta preencher

| Onde | O quê |
|---|---|
| `index.html` e `assets/js/main.js` | Número do WhatsApp (`5500000000000`, com DDI e DDD) |
| `index.html` → Portfólio | Imagens dos projetos (trocar `[Imagem do projeto]` por `<img src="assets/img/...">`), tipo do LVLOS, projetos 3 e 4 |
| `index.html` → Rodapé | Link do Instagram e e-mail |
| `index.html` → `og:image` | URL completa da imagem depois de publicado (para a prévia no WhatsApp e redes) |
| Logo | Hoje é um quadrado branco provisório (`.logo__mark`) |

## Ajustes rápidos

- **Enquadramento da foto do hero:** `--hero-focus-y` em `style.css`.
- **Escurecimento da base do hero:** `--hero-scrim` em `style.css`.
- **Efeitos:** objeto `CONFIG` no topo de `main.js` (tamanho e tempo da foto revelada, velocidade do parallax, cores e comprimento do rastro).

As animações ficam desligadas para quem ativa "reduzir movimento" no sistema. O cursor brilhante só funciona com mouse.
