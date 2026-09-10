# MilWeb — atualização visual de setembro de 2026

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
