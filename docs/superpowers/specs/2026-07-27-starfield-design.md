# Céu de estrelas atrás da Lula

Data: 2026-07-27

## O que é

Um campo de estrelas ambiente atrás de todo o site, com a Lula
(`SquidFollower`) nadando por cima dele. No tema escuro são estrelas frias
num vazio; no claro, poeira quente suspensa na luz.

A ideia partiu de uma observação simples: a Lula já flutua sobre o site
inteiro, mas sobre nada. Dar um céu a ela custa pouco e transforma um
mascote solto numa cena.

## Contexto que decidiu o desenho

Três fatos do código atual moldaram tudo:

1. **A Lula já é global.** Montada em `layout.tsx`, é um `canvas` `fixed
   inset-0` com `zIndex: -1`, ou seja, já cobre a tela inteira e já está
   atrás do conteúdo. É exatamente onde um céu deve ser desenhado.
2. **O loop já existe.** O componente já tem `requestAnimationFrame`,
   pausa, modo autônomo no touch e DPR adaptativo. Um céu novo não precisa
   de nada disso de novo.
3. **O hero já tem estrelas.** Duas camadas de `<Sparkles>` (220 + 110) na
   cena 3D, mas com opacidade 0.35/0.5 — quase invisíveis perto do glow.
   O céu global não substitui isso; convive.

## Decisões

**Alcance: site inteiro, nos dois temas.** O escuro ganha estrelas frias.
O claro ganha poeira quente, não céu azul: os neutros claros são quentes
de propósito (`#FAF9F7`), decisão tomada para quebrar o mono-hue que fazia
o site parecer gerado por IA. Um céu azul desfaria isso. A metáfora vira
"espaço é escuro, dia é luz", mantendo a mesma linguagem de partícula
suspensa com temperatura oposta.

**Intensidade: atmosfera discreta.** O céu é textura de fundo, não cena.
Percebe-se nos respiros entre seções e desaparece atrás de conteúdo. O
site precisa vender; o céu não pode competir com a leitura.

**Onde mora: dentro do canvas da Lula**, como módulo próprio
(`starfield.ts`), no mesmo padrão dos vizinhos (`particles.ts`,
`physics.ts`, `tentacle.ts`). O `renderer.ts` ganha um `drawStarfield()`
chamado logo após o `clear()`, antes de qualquer traço da Lula.

Alternativas descartadas:
- *Canvas dedicado*: seria o terceiro da página (hero 3D + Lula + céu),
  num site que já vigia INP e jank no mobile.
- *CSS puro*: mais barato ainda, mas estrela em `radial-gradient` é
  estática — sem cintilação individual nem parallax. Vira textura, não céu.

## Arquitetura

```
SquidFollower/
  starfield.ts   (novo)  createStarfield() + drawStarfield()
  renderer.ts    (+)     método drawStarfield(), chamado após clear()
  constants.ts   (+)     STARFIELD (densidade, camadas, opacidade)
  index.tsx      (+)     uma linha no loop de render
```

`starfield.ts` não conhece a Lula e a Lula não conhece o céu. A única
ponte é o `renderer`, que desenha um antes do outro.

## Comportamento

**Camadas.** Três profundidades, cada uma com tamanho, opacidade e fator
de parallax próprios. As do fundo quase não se movem com o scroll; as da
frente acompanham mais. É o que cria profundidade sem WebGL.

**Cintilação.** Cada estrela tem fase e período próprios, então nenhuma
pisca junto da outra.

**Parallax infinito.** As estrelas vivem num campo virtual mais alto que a
viewport; a posição na tela é o módulo do deslocamento pelo scroll. Assim
o céu nunca "acaba" numa página longa.

**Cor via token, não hex.** As cores saem de `--accent-soft` (noite) e
`--warm` (dia), lidas do `documentElement` e relidas quando a classe
`light` muda. Mesma correção aplicada hoje ao `hero-cinema`: o céu
acompanha qualquer troca futura de paleta sozinho, e a diferença entre os
dois temas sai de graça.

**Orçamento.** ~120 estrelas no desktop, ~60 no touch, espelhando o modo
leve que a Lula já usa.

## Riscos assumidos

**Cards são translúcidos.** `.glass` usa `--surface` a 55%, então estrela
atrás de card aparece por baixo a ~45%. Se densidade ou brilho passarem do
ponto, o texto sobre os cards perde contraste — o mesmo problema que a
própria Lula já teve no tema claro (documentado no `globals.css`). Por isso
o teto de opacidade faz parte do desenho, e a verificação inclui medir
contraste de texto sobre card com estrela atrás, nos dois temas.

**Sem céu sob `prefers-reduced-motion`.** A Lula não monta nesse caso
(`index.tsx:33`), então o céu também não. Optamos por não duplicar o
conceito numa camada CSS só para esse caso: quem pediu menos movimento
está abrindo mão de um fundo decorativo, o que é aceitável.

## Verificação

1. Contraste de texto sobre `.glass` com estrela atrás, nos dois temas,
   comparado com o estado atual.
2. Nenhum erro de runtime no canvas.
3. Céu visível nos respiros entre seções e discreto atrás de conteúdo,
   conferido em captura real.

## Fora de escopo

Nebulosas, planetas, estrela cadente e trajetória própria da Lula pelo
espaço. Foram considerados e descartados: virariam um segundo produto
dentro do site, competindo com o portfólio pela atenção.
