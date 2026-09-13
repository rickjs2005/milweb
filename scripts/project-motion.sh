#!/usr/bin/env bash
# Loops curtos dos projetos para a galeria da home (Sprint 02 do MilWeb System).
#
#   bash scripts/project-motion.sh
#
# Fonte: os filmes de 60 s feitos no Remotion (fora do repo, ~/Videos/TERRAL).
# Cada loop mostra a natureza do projeto, não um efeito genérico:
#   terral  — o grão e o título da abertura (0:00,8 → 0:04,8), corte 4:5 (card retrato)
#   vertex  — vedação → fachada, a obra sendo revelada no scroll (0:23,0 → 0:27,5), corte 4:5
# Os dois cartões são retrato .8 (home-experience.css, nth-child 2 e 3 da galeria) —
# o card de 7:5 (nth-child 4) é o Aurex, que não tem loop. Cortar no 7:5 errado deixava
# 43% do quadro fora do card, com object-fit: cover recortando as bordas.
# Saída: public/motion/<slug>.webm (VP9) + .mp4 (H.264, fallback), 24 fps, sem áudio,
# altura 720, alvo ≤ 500 KB cada. O poster continua sendo a captura já existente do card.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="${MW_VIDEO_SRC:-/c/Users/rickj/Videos/TERRAL}"
OUT=public/motion
mkdir -p "$OUT"

# encode <slug> <fonte> <início> <duração> <crop w:h em proporção> <crf vp9> <crf h264>
encode() {
  local slug=$1 src=$2 start=$3 dur=$4 ratio=$5 crf9=$6 crf4=$7
  # crop centralizado na proporção do card, depois escala pra 720 de altura (largura par).
  local vf="crop=min(iw\,ih*${ratio}):min(ih\,iw/(${ratio})),scale=-2:720,fps=24"
  ffmpeg -loglevel error -y -ss "$start" -t "$dur" -i "$src" -an -vf "$vf" \
    -c:v libvpx-vp9 -crf "$crf9" -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -pix_fmt yuv420p "$OUT/$slug.webm"
  ffmpeg -loglevel error -y -ss "$start" -t "$dur" -i "$src" -an -vf "$vf" \
    -c:v libx264 -crf "$crf4" -preset slow -profile:v main -movflags +faststart -pix_fmt yuv420p "$OUT/$slug.mp4"
  ls -la "$OUT/$slug".{webm,mp4}
}

# Terral tem pouco detalhe (grão sobre fundo escuro); Vertex é fotografia de obra e pede CRF mais alto pra caber.
encode terral "$SRC/terral-60s-master.mp4" 0.8 4.0 "4/5" 34 26
encode atelier-vertex "$SRC/atelier-vertex-v2-60s-web.mp4" 23.0 4.5 "4/5" 38 28
