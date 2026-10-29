# Edição de Halloween 2026 — créditos e licenças

Tudo o que não foi desenhado ou sintetizado em código vem de fonte com licença que permite o uso, listada aqui com
autor, URL e o que foi feito em cada arquivo. Os arquivos ficam no projeto (`public/halloween/`), otimizados; nada é
carregado de serviço externo. Os de áudio só são baixados **depois** de o visitante ativar o som.

Reprodutível: `node scripts/halloween-audio.mjs` (baixa do Wikimedia Commons, recorta, normaliza e codifica o áudio).

## Imagem

| Arquivo | Origem | Autor | Licença | Tratamento |
| --- | --- | --- | --- | --- |
| `public/halloween/moon.webp` | [File:Moon nearside LRO color mosaic.png](https://commons.wikimedia.org/wiki/File:Moon_nearside_LRO_color_mosaic.png) (Wikimedia Commons; original em wms.lroc.asu.edu / lroc.sese.asu.edu/posts/801) | NASA/GSFC/Arizona State University (câmera LROC) | **Domínio público** | Redimensionada a 1100 px, recortada em disco com borda suave, passada a cinza e colorida em laranja de colheita (`ffmpeg`: `eq` + `colorchannelmixer` + máscara circular), WebP q84 |

## Áudio (gravações reais)

| Arquivo | Origem | Autor | Licença | Trecho / tratamento |
| --- | --- | --- | --- | --- |
| `audio/wind-loop.mp3` | [Howling wind.ogg](https://commons.wikimedia.org/wiki/File:Howling_wind.ogg) | Tvabutzku1234 | **CC0** | 30–60 s, fundido em potência igual nas pontas para virar laço sem emenda (26 s); mono, normalizado |
| `audio/wolf-a.mp3`, `wolf-b.mp3` | [Wolf howls.ogg](https://commons.wikimedia.org/wiki/File:Wolf_howls.ogg) | autor não informado no Commons | **Domínio público** (segundo o Commons) | 1–10 s e 15–23 s, com fades; mono, normalizado. Tocado distante (passa-baixas + reverb) |
| `audio/creak-door.mp3` | [Door handle creaking.ogg](https://commons.wikimedia.org/wiki/File:Door_handle_creaking.ogg) (PDSounds #171) | stephan | **Domínio público** | 0–2,6 s; mono, normalizado |
| `audio/creak-casket.mp3` | [Creaky wooden casket.ogg](https://commons.wikimedia.org/wiki/File:Creaky_wooden_casket.ogg) (PDSounds #319) | stephan | **Domínio público** | arquivo inteiro (1,4 s) |
| `audio/creak-metal-a.mp3`, `creak-metal-b.mp3` | [Metal cabinet door jarring.ogg](https://commons.wikimedia.org/wiki/File:Metal_cabinet_door_jarring.ogg) (PDSounds #112) | stephan | **Domínio público** | 0,5–4 s e 9–12,6 s; mono, normalizado |
| `audio/creak-chair.mp3` | [Assorted creaking noises of office chair.ogg](https://commons.wikimedia.org/wiki/File:Assorted_creaking_noises_of_office_chair.ogg) (PDSounds #382) | stephan | **Domínio público** | 10,2–12,8 s; mono, normalizado |
| `audio/heartbeat.mp3` | [Heartbeat mitral valve 150 bpm.ogg](https://commons.wikimedia.org/wiki/File:Heartbeat_mitral_valve_150_bpm.ogg) (PDSounds #158) | ezwa | **Domínio público** | 1–6 s; tocado a 0,56× (cerca de 84 bpm), abafado |
| `audio/thunder.mp3` | [Nosferatu thunderclap - Richard Humphries.wav](https://commons.wikimedia.org/wiki/File:Nosferatu_thunderclap_-_Richard_Humphries.wav) (original: [freesound.org/people/RHumphries/sounds/2525](https://freesound.org/people/RHumphries/sounds/2525/)) | Richard Humphries | **CC BY 4.0** — atribuição obrigatória (esta linha) | 3,4–14,4 s; mono, normalizado; tocado a 0,82× (mais grave) e com passa-baixas |

Atribuição exigida pela CC BY 4.0: *"Thunderclap" por Richard Humphries (RHumphries), via Freesound e Wikimedia Commons,
licenciado sob CC BY 4.0 (https://creativecommons.org/licenses/by/4.0). Trecho cortado, normalizado e reprocessado.*

## Original desta edição (sem terceiros)

- Toda a arte vetorial (castelo, fantasmas, vampiro, zumbi, bruxa, morcegos, aranhas, teias, velas, árvores, lápides,
  abóboras) é desenhada em SVG/CSS no próprio projeto; as abóboras são geradas por `scripts/halloween-assets.mjs`.
- O dark ambient (drone, cluster de cordas dissonantes, rumor de vento, pancadas de madeira, sino) e os sons de reação
  (fantasma, aranha, castelo, abóbora) são **sintetizados em tempo real** com Web Audio (`halloween/audio.ts`).

## O que NÃO existe (e portanto não é anunciado)

Risada de bruxa, sussurros e coros não foram gravados nem licenciados: não há esses sons. Os "olhos" e as "vozes" do
cenário são imagem e síntese.
