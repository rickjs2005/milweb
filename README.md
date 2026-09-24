# MilWeb

Site institucional e portfólio da MilWeb, o estúdio do Rick (desenvolvimento de sites, landing pages, lojas e sistemas web sob medida).

No ar: https://milweb.com.br

## Stack

- Next.js 15 (App Router) com React 19 e TypeScript
- Tailwind CSS 3
- GSAP e Lenis para animação e rolagem
- Three.js com React Three Fiber no visual do hero
- Conteúdo em três idiomas (pt, en, es) com rotas em `src/app/[lang]`
- Deploy na Vercel (região `gru1`, ver `vercel.json`)

## Como rodar

Requer Node.js 18.18 ou mais novo (a Vercel usa Node 24) e pnpm.

```bash
pnpm install
pnpm dev      # servidor de desenvolvimento
pnpm build    # build de produção
pnpm start    # serve o build
pnpm lint
```

## Variáveis de ambiente

Nenhuma é obrigatória para rodar localmente.

| Variável | Uso | Padrão |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública usada em metadados, sitemap e links canônicos | `https://milweb.com.br` |
| `NEXT_PUBLIC_HERO_VISUAL` | Visual do hero: `globe` ou `compiler` | `globe` |

## Estrutura

- `src/app/[lang]`: páginas (serviços, trabalhos, lab, estúdio, contato, diagnóstico e páginas de serviço)
- `src/i18n`: textos de cada idioma
- `src/components`, `src/features`: componentes e blocos do site
- `scripts/`: verificações de QA com Playwright (i18n, movimento, navegação, assets órfãos)
