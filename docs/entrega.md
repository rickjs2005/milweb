# Entrega — milweb.com.br

Documento da Fase 16 do checklist `site-institucional`. Registra o que está no ar, onde
mora cada acesso, como se faz backup e como se mantém o site. O estado vivo continua em
`.claude/project-state.md`; a história da reconstrução está em `docs/rebuild/`.

Data da entrega: 05/09/2026.

## O que está no ar

| Item | Valor |
|---|---|
| URL canônica | https://milweb.com.br (PT) · `/en` · `/es` |
| Repositório | https://github.com/rickjs2005/milweb (branch `main`) |
| Versão entregue | tag `v1.0.0` (ver "Versão" abaixo) |
| Stack | Next.js 15.1 · React 19 · Tailwind 3.4 · GSAP 3.15 + Lenis 1.3 · WebGL próprio (sem three.js) · WebAudio procedural |
| Hospedagem | Vercel · time `rickjs2005s-projects` · projeto `milweb` · região `gru1` (São Paulo) |
| Deploy | Manual pela CLI: `git push` primeiro, depois `npx vercel --prod`. Não há auto-deploy pelo GitHub. Sempre conferir com `npx vercel inspect milweb.com.br` que o domínio apontou pro deploy novo |
| Domínio / DNS | `milweb.com.br` registrado no Registro.br. Nameservers `d.sec.dns.br` / `e.sec.dns.br` (DNS do próprio Registro.br). Registro A → `216.198.79.1` (Vercel). `www` redireciona para o apex |
| SSL | Emitido e renovado pela Vercel automaticamente |
| Variáveis de ambiente (Vercel, production) | `NEXT_PUBLIC_SITE_URL=https://milweb.com.br` · `NEXT_PUBLIC_HERO_VISUAL=milo`. Nenhum segredo: o site não tem backend nem formulário |

## Medição, analytics e indexação

| Ferramenta | Estado em 05/09/2026 |
|---|---|
| Vercel Speed Insights | Ativo e recebendo dados (`<SpeedInsights />` no layout) |
| Vercel Web Analytics | **Componente instalado, mas o recurso nunca foi ativado no painel** (Analytics → Enable). Enquanto não ativar, page views e eventos são descartados. Eventos disparados pelo código: `whatsapp_click` (source, path), `email_click` (source, path), `preferred_source_click` |
| Google Search Console | Propriedade de domínio `sc-domain:milweb.com.br` verificada. **Sitemap ainda não enviado** (lista de sitemaps vazia). URL a enviar: `https://milweb.com.br/sitemap.xml` (114 URLs, 3 idiomas, hreflang) |
| Google Preferred Sources | Botão no rodapé sobre o SDK oficial (`news.google.com`), no ar desde 01/09 |
| Lighthouse (produção, 05/09/2026, máquina com carga) | Mobile 66–68 / 100 / 96 / 100 · Desktop 86 / 96 / 96 / 100. O mobile local sem carga media 86 (ver `docs/rebuild/perf-budget.md`); o número de produção deve ser remedido em máquina limpa antes de virar referência. As duas falhas de acessibilidade do desktop (contraste dos estágios do hero e nome acessível dos botões de idioma/som) foram corrigidas nesta entrega e precisam de deploy |

## Como validar (depois de cada deploy)

```bash
node scripts/.rsc-audit/work/logistics.mjs https://milweb.com.br 1920x1080 390x844   # ato 06 em produção
node scripts/.rsc-audit/work/logistics-hover.mjs https://milweb.com.br              # hover, resize, CTA
node scripts/i18n-audit.mjs https://milweb.com.br                                    # vazamento de idioma + SEO
npx lighthouse https://milweb.com.br/ --output=json --output-path=lh-mobile.json     # feche navegadores antes
npx lighthouse https://milweb.com.br/ --preset=desktop --output=json --output-path=lh-desktop.json
```

Entre execuções do Lighthouse, matar processos do Edge/Chrome que ficaram vivos
(`taskkill //F //IM msedge.exe`), senão a nota cai até 20 pontos.

## Backup

- Código: o repositório no GitHub é o backup primário. Todo trabalho aprovado vai pra `main`.
- Configuração da Vercel: `npx vercel env pull .env.production.local --environment=production`
  baixa as variáveis (não commitar o arquivo). Domínio, região e headers estão em `vercel.json`
  e `next.config.mjs`, versionados.
- Mídia: tudo em `public/`, versionado. Os vídeos grandes do Lab (`public/lab/full-*.mp4`, 67 MB)
  também estão no repo.
- Não há banco de dados nem formulário, então não existe dado de usuário a preservar.

## Versão

A entrega é marcada com uma tag anotada no commit que foi pro ar:

```bash
git tag -a v1.0.0 -m "Entrega: site trilíngue no ar, checklist site-institucional fechado"
git push origin v1.0.0
```

Próximas entregas incrementam o minor (`v1.1.0` para seção nova, `v1.0.1` para correção).

## Manutenção

Rotina mensal (30 min):

1. `pnpm outdated` e `pnpm audit`; atualizar Next/React só em minor, com `pnpm build` verde.
2. Lighthouse mobile e desktop em produção; comparar com `docs/rebuild/perf-budget.md`.
3. Search Console → Páginas: cobertura, canonical, erros de rastreamento, Core Web Vitals.
4. Vercel Analytics → Events: quais seções geram `whatsapp_click`; ajustar CTAs pelo dado.
5. Conferir que o WhatsApp e o e-mail de contato em `src/lib/content.ts` continuam corretos.

Quando entrar case novo: seguir o roteiro de `docs/rebuild/04-report.md` (Selected Work em atos)
e registrar em `.claude/project-state.md`.

## Pendências conhecidas na entrega

- Ativar o Vercel Web Analytics no painel (1 clique) e enviar o sitemap no Search Console.
- Safari e Firefox físicos nunca foram testados (sem aparelho); Chromium e WebKit automatizados passam.
- `/diagnostico` ainda usa o shim CSS antigo; funciona, mas destoa do sistema novo.
- Revisão do espanhol feita por leitura completa (variante neutra LatAm), não por falante nativo.
