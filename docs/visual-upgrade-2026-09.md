# MilWeb — atualização visual de setembro de 2026

## Revisão mobile — 10 de setembro

- Abertura em fluxo normal no celular, sem o trecho sticky adicional. Manchete recomposta para destacar MUNDO/WORLD em uma linha maior, com texto acessível completo. Escultura maior, enquadrada para retrato, e movimento de scroll independente do desktop.
- Altura mínima da abertura com expansão para o conteúdo, preservando o acesso ao CTA em telas baixas e com texto ampliado. Áreas principais de toque com 48–52px.
- Projetos com a largura útil da tela, sem recuos alternados. Títulos e metadados maiores, captura real ampliada e ação de explorar visível em cada imagem.
- Menu substituído por dialog nativo. O botão de fechar fica dentro do painel, acima da página; Escape, foco modal e retorno do foco são geridos pelo navegador. Fecha ao navegar e ao passar para a largura desktop; rolagem interna liberada do Lenis.
- Ritmo mobile revisto em capacidades, Lab, interação de quebrar o site, apresentação pessoal e contato. Retrato com 112px; links de contato com áreas de toque maiores. Conteúdo, idiomas e rotas preservados.

Verificação: build de produção, tipos e lint aprovados, com 126 páginas geradas; home com 13,1 KB e primeiro carregamento de JavaScript de 176 KB. Revisão do CSS e dos componentes; conferência em desktop sem overflow horizontal, com os seis links de projeto preservados e menu fechado fora do fluxo. O navegador disponível não oferece emulação de viewport mobile; a composição em celular e o fluxo de abrir/fechar o menu em dispositivo real continuam pendentes de conferência. Não foi executada auditoria Lighthouse.

## Segunda direção — 10 de setembro

O feedback do Rick foi que a primeira revisão continuava próxima demais da composição anterior. A home agora abre com uma escultura orbital metálica em fundo preto, tipografia em grande escala e uma galeria editorial assimétrica. A mudança é de composição e ritmo, além de acabamento.

### Implementação atual

- `OrbitalHero`: imagem com transparência sempre presente; entrada após o boot, resposta suave ao ponteiro e deslocamento durante o scroll. São transformações de uma imagem renderizada, não um objeto 3D em tempo real. Sem dependência de WebGL para a abertura.
- Hero com altura de 128svh no desktop e 112svh no celular, com sticky nativo. O CTA para os trabalhos está disponível desde a abertura. Redução de movimento elimina o trecho sticky e as animações.
- `ProjectGallery`: seis projetos em uma grade de 12 colunas com proporções e posições diferentes. Capturas reais dos projetos visíveis também em dispositivos sem hover. Fotografias existentes fornecem o contexto das imagens. Links, rótulo do cliente e nomes seguem as fontes de conteúdo do repositório.
- Cabeçalho da home com marca maior e sem o indicador de atos. Normalização do prefixo interno `/pt` antes de resolver a navegação.
- Os componentes antigos de globo e atos permanecem no código; a home usa os dois componentes novos. A antiga opção de visual do hero não seleciona mais a abertura da home.
- PT, EN e ES preservados, sem dependências adicionais ou alterações no lockfile. Mantidos boot, watchdog de scroll, Lab, interações, páginas de case e contato.

### Asset da abertura

`public/art/orbital-sculpture-v2.webp`: 1254 × 1254, alfa, 210.672 bytes. Uma imagem gerada para esta composição, convertida para WebP com qualidade 88 e alfa 100. Não é uma captura de trabalho de cliente.

Brief de geração: escultura orbital quase esférica de fitas espessas de prata polida, faces planas e bordas chanfradas, entrelaçamento em torno de uma abertura diagonal; vista em três quartos, reflexos de estúdio brancos e pretos, silhueta contida no quadro e fundo transparente. Sem texto, ambiente, partículas ou iluminação colorida. Uma única geração, sem variantes.

### Verificação desta revisão

- Build de produção com verificação de tipos e lint: 126 páginas. A home passou de 38,7 KB para 13 KB; JavaScript de primeiro carregamento de 202 KB para 176 KB. Esses números são a saída do Next, não uma medição de velocidade no dispositivo.
- Conferência visual desktop da abertura e galeria; seis capturas carregadas; nenhuma rolagem horizontal nos estados observados. Abertura conferida em PT/EN/ES.
- CTA da abertura, navegação para o case Kavita e retorno à home conferidos. Galeria conserva nomes únicos `case-media-<slug>` para as transições.
- Nesta revisão, o navegador não registrou erros da aplicação; mensagens de erro observadas eram da extensão do ambiente de inspeção.
- Regras de celular e redução de movimento revisadas no código. Este navegador não oferece ajuste de viewport ou emulação de preferências; a aparência nessas condições não foi validada em dispositivo real. Não foi realizada uma auditoria Lighthouse ou uma avaliação Awwwards.

## Primeira revisão — histórico

Direção: tipografia em grande escala → globo → território real do primeiro projeto.

## Alterações

- Hero com tipografia maior, órbitas presentes na abertura e grade que ganha perspectiva.
- Transformação do O antecipada; pin de 280% no desktop e 200% no celular.
- Globo maior, material de grafite e continentes claros. Preservados mapa editorial, rotas, resposta ao mouse e controles de qualidade.
- Lente circular entrega a cena à fotografia da Kavita. Primeiro ato com fundo escuro, paisagem contínua e drone em maior escala.
- Entrada dos títulos dos seis projetos; capacidades com contraste no hover; retrato maior e encerramento escuro com a órbita da abertura.
- Conteúdo e rotas PT/EN/ES preservados. Sem novas dependências.
- Inicialização de desenvolvimento aceita as opções usuais de prévia e as converte para o CLI do Next. Porta explícita conserva o comportamento de falhar quando ocupada.
- Allowlist de scripts de instalação dos dois pacotes já presentes no lockfile: sharp e unrs-resolver.

## Validação

- Build de produção, TypeScript e lint executados pelo Next; 126 páginas geradas.
- Shader GLSL ES real compilado e linkado em contexto EGL, incluindo as constantes das rotas.
- Conferência visual desktop: abertura, estado formado com fallback, lente, Kavita, capacidades, apresentação pessoal e contato. Sem overflow horizontal nos pontos conferidos.
- Link específico da Kavita abre o case correto; retorno à home funciona.
- CSS e lógica para telas baixas e redução de movimento revisados.

## Limites da verificação

O navegador de conferência não disponibilizou WebGL; exibiu o fallback previsto. A compilação do shader passou, mas a aparência em GPU real e o desempenho não foram medidos. A conferência visual em celular e com prefers-reduced-motion real ainda precisa ocorrer em dispositivos/navegador que permitam essa configuração. A execução do build não equivale a uma auditoria Lighthouse nem a uma avaliação Awwwards.
